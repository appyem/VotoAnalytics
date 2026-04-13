import { useState, useEffect } from "react";
import { useDataStore } from "../store/dataStore";
import ExcelUploader from "../components/upload/ExcelUploader";
import { Plus, Upload, Edit3, CheckCircle, Loader2 } from "lucide-react";
import MesaBatchForm from "../components/upload/MesaBatchForm";
import { createProject } from "../services/firestoreService";
import type { Project } from "../models/types";

export default function DataUpload() {
  const { projects, selectedProject, setSelectedProject, loadFirestoreProjects } = useDataStore();
  const [activeTab, setActiveTab] = useState<"excel" | "manual">("excel");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Estado del formulario
  const [newProject, setNewProject] = useState({
    name: "",
    type: "congreso" as Project["type"],
    year: new Date().getFullYear()
  });

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
                onChange={(e) => setNewProject({...newProject, name: e.target.value})} 
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
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "excel" ? (
        <ExcelUploader />
        ) : (
        <MesaBatchForm />
        )}
        </div>
      </div>
    </div>
  );
}