import { useState, useEffect } from "react";
import { useDataStore } from "../store/dataStore";
import ExcelUploader from "../components/upload/ExcelUploader";
import { Plus, Upload, Edit3, CheckCircle, Loader2, Search, Trash2, Save, X, AlertTriangle } from "lucide-react";
import MesaBatchForm from "../components/upload/MesaBatchForm";
import { createProject, getVotesByPuestoSearch, updateVotesPuesto, deleteVotesByIds } from "../services/firestoreService";
import type { Project, VoteRecord } from "../models/types";

export default function DataUpload() {
  const { projects, selectedProject, setSelectedProject, loadFirestoreProjects } = useDataStore();
  const [activeTab, setActiveTab] = useState<"excel" | "manual" | "manage">("excel");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Estado del formulario de nueva campaña
  const [newProject, setNewProject] = useState({
    name: "",
    type: "congreso" as Project["type"],
    year: new Date().getFullYear()
  });

  // Estado para gestión de registros (nuevo)
  const [puestoSearch, setPuestoSearch] = useState("");
  const [searchResults, setSearchResults] = useState<VoteRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVoteIds, setSelectedVoteIds] = useState<Set<string>>(new Set());
  const [editModal, setEditModal] = useState<{ open: boolean; newPuesto: string; newCorregimiento: string }>({
    open: false, newPuesto: "", newCorregimiento: ""
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; count: number }>({ open: false, count: 0 });
  const [actionStatus, setActionStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Cargar proyectos al montar
  useEffect(() => {
    if (projects.length === 0) loadFirestoreProjects();
  }, [projects.length, loadFirestoreProjects]);

  // Crear nueva campaña
  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.year) return;
    setIsCreating(true);
    try {
      await createProject(newProject);
      await loadFirestoreProjects();
      setShowCreateForm(false);
      setNewProject({ name: "", type: "congreso", year: new Date().getFullYear() });
    } catch (err) {
      console.error("Error creando campaña:", err);
      alert("No se pudo crear la campaña. Verifique la consola.");
    } finally {
      setIsCreating(false);
    }
  };

  // 🔹 NUEVO: Buscar votos por puesto
  const handleSearchPuesto = async () => {
    if (!selectedProject?.id || !puestoSearch.trim()) return;
    
    setIsSearching(true);
    setActionStatus(null);
    try {
      const results = await getVotesByPuestoSearch(selectedProject.id, puestoSearch);
      setSearchResults(results);
      setSelectedVoteIds(new Set()); // Reset selección
    } catch (error) {
      setActionStatus({ type: "error", msg: "❌ Error al buscar registros. Intente nuevamente." });
    } finally {
      setIsSearching(false);
    }
  };

  // 🔹 NUEVO: Toggle selección individual
  const toggleVoteSelection = (voteId: string) => {
    setSelectedVoteIds(prev => {
      const next = new Set(prev);
      if (next.has(voteId)) next.delete(voteId);
      else next.add(voteId);
      return next;
    });
  };

  // 🔹 NUEVO: Seleccionar todos en resultados
  const toggleSelectAll = () => {
    if (selectedVoteIds.size === searchResults.length) {
      setSelectedVoteIds(new Set());
    } else {
      setSelectedVoteIds(new Set(searchResults.map(v => v.id)));
    }
  };

  // 🔹 NUEVO: Abrir modal de edición
  const openEditModal = () => {
    if (selectedVoteIds.size === 0) return;
    // Pre-llenar con el primer resultado como sugerencia
    const first = searchResults.find(v => selectedVoteIds.has(v.id));
    setEditModal({
      open: true,
      newPuesto: first?.puesto || "",
      newCorregimiento: first?.corregimiento || ""
    });
  };

  // 🔹 NUEVO: Ejecutar edición
  const handleUpdatePuesto = async () => {
    if (!editModal.newPuesto.trim() || selectedVoteIds.size === 0) return;
    
    try {
      await updateVotesPuesto(
        Array.from(selectedVoteIds),
        editModal.newPuesto,
        editModal.newCorregimiento || undefined
      );
      setActionStatus({ type: "success", msg: `✅ ${selectedVoteIds.size} registro(s) actualizado(s)` });
      setEditModal({ open: false, newPuesto: "", newCorregimiento: "" });
      // Refrescar búsqueda
      handleSearchPuesto();
    } catch (error) {
      setActionStatus({ type: "error", msg: "❌ Error al actualizar registros." });
    }
  };

  // 🔹 NUEVO: Confirmar eliminación
  const confirmDelete = () => {
    if (selectedVoteIds.size === 0) return;
    setDeleteConfirm({ open: true, count: selectedVoteIds.size });
  };

  // 🔹 NUEVO: Ejecutar eliminación
  const handleDeleteVotes = async () => {
    try {
      await deleteVotesByIds(Array.from(selectedVoteIds));
      setActionStatus({ type: "success", msg: `✅ ${selectedVoteIds.size} registro(s) eliminado(s)` });
      setDeleteConfirm({ open: false, count: 0 });
      setSelectedVoteIds(new Set());
      setSearchResults(prev => prev.filter(v => !selectedVoteIds.has(v.id)));
    } catch (error) {
      setActionStatus({ type: "error", msg: "❌ Error al eliminar registros." });
    }
  };

  // Vista inicial: Sin campañas
  if (projects.length === 0 && !showCreateForm) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="p-4 bg-accent/10 rounded-full">
          <Plus className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Bienvenido a Carga de Datos</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            Cree su primera campaña para comenzar a registrar y analizar resultados electorales.
          </p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          Crear Primera Campaña
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Campañas</h1>
          <p className="text-sm text-gray-400 mt-1">Cree, seleccione y cargue información electoral por campaña</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nueva Campaña
        </button>
      </div>

      {/* Formulario de Creación */}
      {showCreateForm && (
        <div className="bg-surface/50 p-5 rounded-xl border border-gray-700 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-white mb-4">Crear Nueva Campaña</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
              <input 
                type="text" 
                value={newProject.name} 
                onChange={(e) => setNewProject({...newProject, name: e.target.value.toUpperCase()})} 
                placeholder="Ej: Legislativas 2026" 
                className="w-full p-2.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Elección</label>
              <select 
                value={newProject.type} 
                onChange={(e) => setNewProject({...newProject, type: e.target.value as Project["type"]})} 
                className="w-full p-2.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-accent outline-none"
              >
                <option value="congreso">Congreso</option>
                <option value="regional">Regional</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Año</label>
              <input 
                type="number" 
                value={newProject.year} 
                onChange={(e) => setNewProject({...newProject, year: Number(e.target.value)})} 
                className="w-full p-2.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-accent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
            <button 
              onClick={() => setShowCreateForm(false)} 
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreateProject} 
              disabled={isCreating || !newProject.name.trim()} 
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isCreating ? "Creando..." : "Crear Campaña"}
            </button>
          </div>
        </div>
      )}

      {/* Selector de Campañas */}
      {projects.length > 0 && (
        <div className="bg-surface/50 p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium text-gray-300 whitespace-nowrap">Campaña Activa:</span>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <button 
                key={p.id} 
                onClick={() => setSelectedProject(p)} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  selectedProject?.id === p.id 
                    ? "bg-accent/20 text-accent border-accent/40 shadow-sm" 
                    : "bg-gray-800/50 text-gray-400 border-gray-700 hover:text-gray-200 hover:border-gray-600"
                }`}
              >
                {p.name} ({p.year})
                {selectedProject?.id === p.id && <span className="ml-2 inline-block w-1.5 h-1.5 bg-accent rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback de acciones */}
      {actionStatus && (
        <div className={`p-3 rounded-lg border flex items-center gap-3 text-sm ${
          actionStatus.type === "success" ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger"
        }`}>
          {actionStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionStatus.msg}</span>
          <button onClick={() => setActionStatus(null)} className="ml-auto text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pestañas y Contenido */}
      <div className="bg-surface/50 rounded-xl border border-gray-700 overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-gray-700 bg-gray-900/30">
          <button 
            onClick={() => setActiveTab("excel")} 
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "excel" ? "text-accent" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Upload className="w-4 h-4" /> Carga Masiva (Excel)
            {activeTab === "excel" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />}
          </button>
          <button 
            onClick={() => setActiveTab("manual")} 
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "manual" ? "text-accent" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Edit3 className="w-4 h-4" /> Ingreso Manual
            {activeTab === "manual" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />}
          </button>
          <button 
            onClick={() => { setActiveTab("manage"); setSearchResults([]); setPuestoSearch(""); }} 
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "manage" ? "text-accent" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Search className="w-4 h-4" /> Gestionar Registros
            {activeTab === "manage" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "excel" && <ExcelUploader />}
          {activeTab === "manual" && <MesaBatchForm />}
          
          {/* 🔹 NUEVA PESTAÑA: Gestión de Registros */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              {/* Barra de búsqueda */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={puestoSearch}
                    onChange={(e) => setPuestoSearch(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchPuesto()}
                    placeholder="Buscar por Puesto de Votación (ej: ESCUELA CENTRAL)"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-accent outline-none"
                  />
                </div>
                <button
                  onClick={handleSearchPuesto}
                  disabled={isSearching || !puestoSearch.trim()}
                  className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Buscar
                </button>
              </div>

              {/* Resultados */}
              {searchResults.length > 0 ? (
                <>
                  {/* Header de resultados + acciones */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedVoteIds.size === searchResults.length && searchResults.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-gray-300">
                        {selectedVoteIds.size} de {searchResults.length} seleccionados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openEditModal}
                        disabled={selectedVoteIds.size === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar Puesto
                      </button>
                      <button
                        onClick={confirmDelete}
                        disabled={selectedVoteIds.size === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 hover:bg-danger/20 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Tabla de resultados */}
                  <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800/50 text-gray-300">
                        <tr>
                          <th className="px-3 py-2 text-left w-10"></th>
                          <th className="px-3 py-2 text-left">Mesa</th>
                          <th className="px-3 py-2 text-left">Puesto</th>
                          <th className="px-3 py-2 text-left">Municipio</th>
                          <th className="px-3 py-2 text-left">Partido</th>
                          <th className="px-3 py-2 text-left">Candidato</th>
                          <th className="px-3 py-2 text-right">Votos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/30">
                        {searchResults.map((vote) => (
                          <tr key={vote.id} className="hover:bg-gray-800/20 transition-colors">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedVoteIds.has(vote.id)}
                                onChange={() => toggleVoteSelection(vote.id)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent focus:ring-accent"
                              />
                            </td>
                            <td className="px-3 py-2 text-gray-200">{vote.mesa}</td>
                            <td className="px-3 py-2 text-gray-200 font-medium">{vote.puesto}</td>
                            <td className="px-3 py-2 text-gray-400">{vote.municipality}</td>
                            <td className="px-3 py-2 text-gray-300">{vote.partyName}</td>
                            <td className="px-3 py-2 text-gray-300">{vote.candidateName}</td>
                            <td className="px-3 py-2 text-right text-accent font-semibold">{vote.votes.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : puestoSearch.trim() ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No se encontraron registros para "{puestoSearch}"</p>
                  <p className="text-xs mt-1">Intente con otro término o verifique la ortografía</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ingrese un nombre de puesto para buscar registros</p>
                  <p className="text-xs mt-1">Ej: "ESCUELA", "COLEGIO", "CANCHA"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Modal de Edición */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-gray-700 w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-white mb-4">Editar Puesto de Votación</h3>
            <p className="text-sm text-gray-400 mb-4">
              Se actualizarán <span className="text-accent font-medium">{selectedVoteIds.size}</span> registro(s)
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nuevo Puesto *</label>
                <input
                  type="text"
                  value={editModal.newPuesto}
                  onChange={(e) => setEditModal(prev => ({ ...prev, newPuesto: e.target.value.toUpperCase() }))}
                  placeholder="Ej: COLEGIO CENTRAL"
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-accent outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Corregimiento (opcional)</label>
                <input
                  type="text"
                  value={editModal.newCorregimiento}
                  onChange={(e) => setEditModal(prev => ({ ...prev, newCorregimiento: e.target.value.toUpperCase() }))}
                  placeholder="Dejar vacío si es zona urbana"
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-accent outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setEditModal({ open: false, newPuesto: "", newCorregimiento: "" })}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                onClick={handleUpdatePuesto}
                disabled={!editModal.newPuesto.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal de Confirmación de Eliminación */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-danger/30 w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-white">¿Eliminar registros?</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Esta acción no se puede deshacer. Se eliminarán permanentemente <span className="text-danger font-medium">{deleteConfirm.count}</span> registro(s) de Firestore.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setDeleteConfirm({ open: false, count: 0 })}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteVotes}
                className="flex items-center gap-2 px-4 py-2 bg-danger hover:bg-danger/90 text-white font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}