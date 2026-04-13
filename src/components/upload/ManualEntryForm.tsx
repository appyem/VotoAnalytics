import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useDataStore } from "../../store/dataStore";
import { saveVote } from "../../services/firestoreService";
import type { VoteRecord } from "../../models/types";
import { Save, RotateCcw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface FormData {
  department: string;
  municipality: string;
  corregimiento: string;
  puesto: string;
  mesa: string;
  partyId: string;
  partyName: string;
  candidateId: string;
  candidateName: string;
  leaderIdsRaw: string;
  votes: string;
}

const INITIAL_FORM: FormData = {
  department: "", municipality: "", corregimiento: "", puesto: "", mesa: "",
  partyId: "", partyName: "", candidateId: "", candidateName: "", leaderIdsRaw: "", votes: ""
};

export default function ManualEntryForm() {
  const { selectedProject, loadFirestoreVotes } = useDataStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [keepLocation, setKeepLocation] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status) setStatus(null); // Limpiar estado al editar
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject?.id) {
      setStatus({ type: "error", msg: "⚠️ Seleccione una campaña activa en la parte superior." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      // Validaciones mínimas
      if (!form.department || !form.mesa || !form.partyId || !form.candidateId || !form.votes) {
        throw new Error("Complete los campos obligatorios marcados con *");
      }

      const votesNum = Number(form.votes);
      if (isNaN(votesNum) || votesNum < 0) throw new Error("Los votos deben ser un número ≥ 0");

      // Parsear líderes (entrada: texto separado por comas)
      const leaderIds = form.leaderIdsRaw.split(",").map(s => s.trim()).filter(Boolean);

      // Mapear a tipo de Firestore
      const voteData: Omit<VoteRecord, "id"> = {
        department: form.department,
        municipality: form.municipality,
        corregimiento: form.corregimiento,
        puesto: form.puesto,
        mesa: form.mesa,
        partyId: form.partyId,
        partyName: form.partyName,
        candidateId: form.candidateId,
        candidateName: form.candidateName,
        leaderIds,
        votes: votesNum,
        projectId: selectedProject.id
      };

      await saveVote(voteData);
      setStatus({ type: "success", msg: "✅ Registro guardado exitosamente en Firestore." });

      // Reset inteligente
      if (keepLocation) {
        const { department, municipality, corregimiento, puesto } = form;
        setForm({ ...INITIAL_FORM, department, municipality, corregimiento, puesto });
      } else {
        setForm(INITIAL_FORM);
      }

      // Actualizar datos en store/dashboard
      await loadFirestoreVotes(selectedProject.id);
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido al guardar";
      setStatus({ type: "error", msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setStatus(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Header Form */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Registro Manual de Mesa</h3>
        <button type="button" onClick={resetForm} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>
      </div>

      {/* Estado Feedback */}
      {status && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
          status.type === "success" 
            ? "bg-success/10 border-success/30 text-success" 
            : "bg-danger/10 border-danger/30 text-danger"
        }`}>
          {status.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{status.msg}</span>
        </div>
      )}

      {/* Sección 1: Ubicación Territorial */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-gray-300 mb-2">📍 Ubicación Territorial</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Departamento *" name="department" value={form.department} onChange={handleChange} />
          <Input label="Municipio" name="municipality" value={form.municipality} onChange={handleChange} />
          <Input label="Corregimiento" name="corregimiento" value={form.corregimiento} onChange={handleChange} />
          <Input label="Puesto de Votación" name="puesto" value={form.puesto} onChange={handleChange} />
          <Input label="Número de Mesa *" name="mesa" value={form.mesa} onChange={handleChange} placeholder="Ej: 001" />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer mt-1">
          <input 
            type="checkbox" 
            checked={keepLocation} 
            onChange={(e) => setKeepLocation(e.target.checked)} 
            className="rounded border-gray-600 bg-gray-800 text-accent focus:ring-accent/50"
          />
          Mantener ubicación para siguiente registro (ideal para múltiples mesas en mismo puesto)
        </label>
      </fieldset>

      {/* Sección 2: Datos Políticos */}
      <fieldset className="space-y-4 pt-4 border-t border-gray-700/50">
        <legend className="text-sm font-medium text-gray-300 mb-2">🗳️ Datos del Candidato</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="ID Partido *" name="partyId" value={form.partyId} onChange={handleChange} placeholder="Ej: p1" />
          <Input label="Nombre Partido" name="partyName" value={form.partyName} onChange={handleChange} placeholder="Ej: Partido A" />
          <Input label="ID Candidato *" name="candidateId" value={form.candidateId} onChange={handleChange} placeholder="Ej: c1" />
          <Input label="Nombre Candidato" name="candidateName" value={form.candidateName} onChange={handleChange} placeholder="Ej: Carlos M" />
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs text-gray-400 mb-1">Líderes de Campaña (separados por coma)</label>
            <input
              type="text"
              name="leaderIdsRaw"
              value={form.leaderIdsRaw}
              onChange={handleChange}
              placeholder="Ej: l1, l2, l3"
              className="w-full p-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      </fieldset>

      {/* Sección 3: Resultados */}
      <fieldset className="space-y-4 pt-4 border-t border-gray-700/50">
        <legend className="text-sm font-medium text-gray-300 mb-2">📊 Resultado</legend>
        <div className="max-w-xs">
          <Input label="Votos Obtenidos *" name="votes" value={form.votes} onChange={handleChange} type="number" min="0" placeholder="0" />
        </div>
      </fieldset>

      {/* Botón Submit */}
      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !selectedProject?.id}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? "Guardando en Firestore..." : "Guardar Registro"}
        </button>
      </div>
    </form>
  );
}

// Subcomponente Input reutilizable para mantener DRY
const Input = ({ label, type = "text", ...props }: { label: string; type?: string; name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; placeholder?: string; min?: string }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <input
      type={type}
      {...props}
      className="w-full p-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
    />
  </div>
);