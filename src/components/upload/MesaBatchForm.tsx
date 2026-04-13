import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useDataStore } from "../../store/dataStore";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { Plus, Trash2, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

// ============================================================================
// DATOS TERRITORIALES (Estructurados para fácil expansión futura)
// ============================================================================

const DEPARTMENTS = ["Caldas"];

const MUNICIPALITIES_BY_REGION: Record<string, string[]> = {
  "Norte": ["Aguadas", "Aranzazu", "Pácora", "Salamina"],
  "Centro-Norte": ["Filadelfia", "La Merced", "Marmato", "Riosucio", "Supía"],
  "Oriente": ["Manzanares", "Marquetalia", "Marulanda", "Pensilvania"],
  "Sur": ["Anserma", "Belalcázar", "Risaralda", "San José", "Viterbo"],
  "Centro": ["Chinchiná", "Manizales", "Neira", "Palestina", "Villamaría"],
  "Magdalena Medio": ["La Dorada", "Norcasia", "Samaná", "Victoria"]
};

const CORREGIMIENTOS_FILADELFIA = [
  "El Pintado", "El Verso", "Morritos", "La Paila", "Samaria", "San Luis"
];

const MESA_OPTIONS = Array.from({ length: 100 }, (_, i) => (i + 1).toString().padStart(3, "0"));

// ============================================================================
// TIPOS LOCALES (Estrictos, cero 'any')
// ============================================================================

interface LocationData {
  department: string;
  municipality: string;
  corregimiento: string;
  puesto: string;
  mesa: string;
}

interface CandidateRow {
  id: string;
  partyId: string;
  partyName: string;
  candidateId: string;
  candidateName: string;
  leaderIdsRaw: string;
  votes: string;
}

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const INITIAL_LOCATION: LocationData = {
  department: "", municipality: "", corregimiento: "", puesto: "", mesa: ""
};

const createEmptyRow = (): CandidateRow => ({
  id: Math.random().toString(36).substring(2, 9),
  partyId: "", partyName: "", candidateId: "", candidateName: "", leaderIdsRaw: "", votes: ""
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function MesaBatchForm() {
  const { selectedProject, loadFirestoreVotes } = useDataStore();
  const [location, setLocation] = useState<LocationData>(INITIAL_LOCATION);
  const [rows, setRows] = useState<CandidateRow[]>([createEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  
  // 🟢 NUEVO: Cache de autocompletado por sesión
  const [partyCache, setPartyCache] = useState<Record<string, string>>({});
  const [candidateCache, setCandidateCache] = useState<Record<string, string>>({});

  // Handlers unificados para inputs y selects
  const handleLocationChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setLocation(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status) setStatus(null);
  };

  const addRow = () => setRows(prev => [...prev, createEmptyRow()]);
  
  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof CandidateRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    if (status) setStatus(null);
  };

  // 🟢 NUEVO: Handler especializado para ID Partido (con autocompletado en onBlur)
  const handlePartyIdChange = (rowId: string, value: string) => {
    // Actualizar el ID del partido
    updateRow(rowId, "partyId", value);
    
    // Si hay valor y ya existe en cache, autocompletar nombre (solo si el nombre está vacío)
    if (value.trim() && partyCache[value]) {
      const currentRow = rows.find(r => r.id === rowId);
      if (currentRow && !currentRow.partyName.trim()) {
        updateRow(rowId, "partyName", partyCache[value]);
      }
    }
  };

  // 🟢 NUEVO: Handler especializado para Nombre Partido (guarda en cache en onBlur)
  const handlePartyNameBlur = (rowId: string, value: string) => {
    const currentRow = rows.find(r => r.id === rowId);
    if (currentRow?.partyId.trim() && value.trim()) {
      // Guardar en cache: partyId -> partyName
      setPartyCache(prev => ({ ...prev, [currentRow.partyId]: value }));
    }
  };

  // 🟢 NUEVO: Handler especializado para ID Candidato (con autocompletado compuesto en onBlur)
  const handleCandidateIdChange = (rowId: string, value: string) => {
    // Actualizar el ID del candidato
    updateRow(rowId, "candidateId", value);
    
    // Si hay valor y hay partyId, buscar en cache compuesto
    const currentRow = rows.find(r => r.id === rowId);
    if (value.trim() && currentRow?.partyId.trim()) {
      const cacheKey = `${currentRow.partyId}_${value}`;
      if (candidateCache[cacheKey] && !currentRow.candidateName.trim()) {
        updateRow(rowId, "candidateName", candidateCache[cacheKey]);
      }
    }
  };

  // 🟢 NUEVO: Handler especializado para Nombre Candidato (guarda en cache compuesto en onBlur)
  const handleCandidateNameBlur = (rowId: string, value: string) => {
    const currentRow = rows.find(r => r.id === rowId);
    if (currentRow?.partyId.trim() && currentRow?.candidateId.trim() && value.trim()) {
      // Guardar en cache compuesto: "partyId_candidateId" -> candidateName
      const cacheKey = `${currentRow.partyId}_${currentRow.candidateId}`;
      setCandidateCache(prev => ({ ...prev, [cacheKey]: value }));
    }
  };

  const resetForm = () => {
    setLocation(INITIAL_LOCATION);
    setRows([createEmptyRow()]);
    // 🟢 NUEVO: Resetear caches al reiniciar formulario
    setPartyCache({});
    setCandidateCache({});
    setStatus(null);
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject?.id) {
      setStatus({ type: "error", msg: "⚠️ Seleccione una campaña activa en la parte superior." });
      return;
    }

    // Validación Ubicación (corregimiento es OPCIONAL para casco urbano)
    const requiredLocation = [
      location.department,
      location.municipality,
      location.puesto,
      location.mesa
    ];
    if (requiredLocation.some(v => !v.trim())) {
      setStatus({ type: "error", msg: "⚠️ Complete: Departamento, Municipio, Puesto de Votación y Número de Mesa. (Corregimiento es opcional)" });
      return;
    }

    // Filtrar filas válidas
    const validRows = rows.filter(r => r.partyId.trim() && r.candidateId.trim() && r.votes.trim());
    if (validRows.length === 0) {
      setStatus({ type: "error", msg: "⚠️ Agregue al menos un candidato con ID de partido y votos válidos." });
      return;
    }

    // Validar números
    const hasInvalidVotes = validRows.some(r => {
      const val = Number(r.votes);
      return isNaN(val) || val < 0 || !Number.isInteger(val);
    });
    if (hasInvalidVotes) {
      setStatus({ type: "error", msg: "⚠️ Los votos deben ser números enteros ≥ 0." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const batch = writeBatch(db);
      const votesRef = collection(db, "votes");
      const now = new Date().toISOString();

      for (const row of validRows) {
        const leaderIds = row.leaderIdsRaw.split(",").map(s => s.trim()).filter(Boolean);
        const newDocRef = doc(votesRef);

        batch.set(newDocRef, {
          department: location.department,
          municipality: location.municipality,
          corregimiento: location.corregimiento,
          puesto: location.puesto,
          mesa: location.mesa,
          partyId: row.partyId,
          partyName: row.partyName,
          candidateId: row.candidateId,
          candidateName: row.candidateName,
          leaderIds,
          votes: Number(row.votes),
          projectId: selectedProject.id,
          createdAt: now,
          updatedAt: now
        });
      }

      await batch.commit();

      setStatus({ type: "success", msg: `✅ Acta guardada exitosamente. ${validRows.length} candidato(s) registrados.` });
      await loadFirestoreVotes(selectedProject.id);
      resetForm();

    } catch (error) {
      console.error("Error al guardar acta:", error);
      setStatus({ type: "error", msg: "❌ Error al conectar con Firestore. Verifique permisos o red." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Registro de Acta por Mesa</h3>
        <button 
          type="button" 
          onClick={resetForm} 
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          disabled={isSubmitting}
        >
          Reiniciar formulario
        </button>
      </div>

      {/* Feedback */}
      {status && (
        <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
          status.type === "success" ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger"
        }`}>
          {status.type === "success" ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span>{status.msg}</span>
        </div>
      )}

      {/* Sección 1: Ubicación (Ahora con Selects) */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-gray-300 mb-2">📍 Ubicación Territorial</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <SelectField label="Departamento *" name="department" value={location.department} onChange={handleLocationChange}>
            <option value="">Seleccione...</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </SelectField>

          <SelectField label="Municipio *" name="municipality" value={location.municipality} onChange={handleLocationChange}>
            <option value="">Seleccione...</option>
            {Object.entries(MUNICIPALITIES_BY_REGION).map(([region, towns]) => (
              <optgroup key={region} label={region}>
                {towns.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
            ))}
          </SelectField>

          <SelectField label="Corregimiento" name="corregimiento" value={location.corregimiento} onChange={handleLocationChange}>
            <option value="">Ninguno / Urbano</option>
            {CORREGIMIENTOS_FILADELFIA.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectField>

          <InputField label="Puesto de Votación *" name="puesto" value={location.puesto} onChange={handleLocationChange} />
          
          <SelectField label="Número de Mesa *" name="mesa" value={location.mesa} onChange={handleLocationChange}>
            <option value="">Seleccione...</option>
            {MESA_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </SelectField>
        </div>
      </fieldset>

      {/* Sección 2: Tabla Dinámica de Candidatos */}
      <fieldset className="space-y-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium text-gray-300">🗳️ Resultados por Partido/Candidato</legend>
          <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar fila
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-800/50 text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left w-24">ID Partido *</th>
                <th className="px-3 py-2 text-left w-32">Nombre Partido</th>
                <th className="px-3 py-2 text-left w-24">ID Candidato *</th>
                <th className="px-3 py-2 text-left w-32">Nombre Candidato</th>
                <th className="px-3 py-2 text-left w-40">Líderes (sep. por coma)</th>
                <th className="px-3 py-2 text-right w-24">Votos *</th>
                <th className="px-3 py-2 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-800/20 transition-colors">
                  {/* 🟢 MODIFICADO: ID Partido con handler especializado */}
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={row.partyId} 
                      onChange={(e) => handlePartyIdChange(row.id, e.target.value)}
                      onBlur={() => handlePartyNameBlur(row.id, row.partyName)}
                      className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:border-accent outline-none" 
                    />
                  </td>
                  {/* 🟢 MODIFICADO: Nombre Partido con onBlur para guardar en cache */}
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={row.partyName} 
                      onChange={(e) => updateRow(row.id, "partyName", e.target.value)}
                      onBlur={(e) => handlePartyNameBlur(row.id, e.target.value)}
                      className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:border-accent outline-none" 
                    />
                  </td>
                  {/* 🟢 MODIFICADO: ID Candidato con handler especializado (cache compuesto) */}
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={row.candidateId} 
                      onChange={(e) => handleCandidateIdChange(row.id, e.target.value)}
                      className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:border-accent outline-none" 
                    />
                  </td>
                  {/* 🟢 MODIFICADO: Nombre Candidato con onBlur para guardar en cache compuesto */}
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={row.candidateName} 
                      onChange={(e) => updateRow(row.id, "candidateName", e.target.value)}
                      onBlur={(e) => handleCandidateNameBlur(row.id, e.target.value)}
                      className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:border-accent outline-none" 
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={row.leaderIdsRaw} 
                      onChange={(e) => updateRow(row.id, "leaderIdsRaw", e.target.value)} 
                      placeholder="l1, l2" 
                      className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 focus:border-accent outline-none" 
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      min="0" 
                      value={row.votes} 
                      onChange={(e) => updateRow(row.id, "votes", e.target.value)} 
                      className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 text-right focus:border-accent outline-none" 
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      type="button" 
                      onClick={() => removeRow(row.id)} 
                      disabled={rows.length <= 1} 
                      className="p-1.5 text-gray-500 hover:text-danger hover:bg-danger/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">* Campos obligatorios. Puede agregar todas las filas que necesite antes de guardar.</p>
      </fieldset>

      {/* Botón Guardar */}
      <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-700/50">
        <span className="text-xs text-gray-400">
          {rows.filter(r => r.partyId && r.candidateId && r.votes).length} fila(s) listas
        </span>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? "Guardando acta..." : "💾 Guardar Acta Completa"}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// SUBCOMPONENTES REUTILIZABLES
// ============================================================================

const InputField = ({ label, ...props }: { label: string; name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <input {...props} className="w-full p-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors" />
  </div>
);

const SelectField = ({ label, children, ...props }: { label: string; children: React.ReactNode; name: string; value: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <select {...props} className="w-full p-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer">
      {children}
    </select>
  </div>
);