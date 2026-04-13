import { useState, useMemo } from "react";
import { useDataStore } from "../store/dataStore";
import { exportToExcel } from "../services/exportService";
import { Download, FileText, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type ExportFormat = "pdf" | "excel";
type ExportScope = "all" | "filtered";

export default function Reports() {
  const { selectedProject, votes, loading } = useDataStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [scope, setScope] = useState<ExportScope>("all");

  // Datos filtrados para exportación
  const exportData = useMemo(() => {
    if (!selectedProject) return [];
    const base = votes.filter(v => v.projectId === selectedProject.id);
    return scope === "filtered" 
      ? base // Aquí se podrían aplicar filtros adicionales si se implementan
      : base;
  }, [votes, selectedProject, scope]);

  // KPIs para el reporte
  const reportStats = useMemo(() => {
    if (exportData.length === 0) return null;
    const totalVotes = exportData.reduce((sum, v) => sum + v.votes, 0);
    const uniqueMesas = new Set(exportData.map(v => v.mesa)).size;
    const uniqueParties = new Set(exportData.map(v => v.partyName)).size;
    const topMunicipality = exportData.reduce((acc, v) => {
      acc[v.municipality] = (acc[v.municipality] || 0) + v.votes;
      return acc;
    }, {} as Record<string, number>);
    const topMun = Object.entries(topMunicipality).sort((a, b) => b[1] - a[1])[0];
    
    return { totalVotes, uniqueMesas, uniqueParties, topMun };
  }, [exportData]);

  const handleExport = async () => {
    if (!selectedProject || exportData.length === 0) {
      setExportStatus({ type: "error", msg: "No hay datos para exportar. Cargue registros primero." });
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `VotoAnalytics_${selectedProject.name.replace(/\s/g, "_")}_${timestamp}`;
      
      if (format === "pdf") {
  // PDF con branding completo en próxima actualización
  setExportStatus({ type: "error", msg: "📄 Exportación PDF en desarrollo. Use Excel por ahora." });
  setIsExporting(false);
  return;
} else {
        // Preparar datos para Excel
        const excelRows = exportData.map(v => ({
          "Mesa": v.mesa,
          "Partido": v.partyName,
          "Candidato": v.candidateName,
          "Municipio": v.municipality,
          "Departamento": v.department,
          "Corregimiento": v.corregimiento,
          "Puesto": v.puesto,
          "Votos": v.votes,
          "Líderes": v.leaderIds.join(", ")
        }));
        exportToExcel(excelRows, "Resultados", fileName);
      }
      
      setExportStatus({ type: "success", msg: `✅ Exportación ${format.toUpperCase()} completada exitosamente` });
    } catch (error) {
      console.error("Export error:", error);
      setExportStatus({ type: "error", msg: "❌ Error al generar el archivo. Intente nuevamente." });
    } finally {
      setIsExporting(false);
    }
  };

  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando datos para reporte...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes Profesionales</h1>
          <p className="text-sm text-gray-400 mt-1">Exporte análisis con branding APPYEMPRESA para presentaciones ejecutivas</p>
        </div>
      </header>

      {/* Estado de campaña */}
      {!selectedProject ? (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Seleccione una campaña</p>
            <p className="text-sm text-gray-400 mt-1">Elija un proyecto en el Dashboard para generar reportes específicos.</p>
          </div>
        </div>
      ) : exportData.length === 0 ? (
        <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300">Sin datos para exportar</h3>
          <p className="text-sm text-gray-500 mt-2">Cargue registros desde "Carga de Datos" para generar reportes.</p>
        </div>
      ) : (
        <>
          {/* Panel de Configuración */}
          <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-accent" />
              Configurar Exportación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formato */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Formato de Archivo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormat("pdf")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      format === "pdf" 
                        ? "bg-accent/20 border-accent text-accent" 
                        : "bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => setFormat("excel")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      format === "excel" 
                        ? "bg-success/20 border-success text-success" 
                        : "bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                </div>
              </div>
              
              {/* Alcance */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Alcance de Datos</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 focus:border-accent outline-none"
                >
                  <option value="all">Todos los registros del proyecto</option>
                  <option value="filtered">Solo datos filtrados (próximamente)</option>
                </select>
              </div>
            </div>
            
            {/* Vista previa de stats */}
            {reportStats && (
              <div className="pt-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 mb-2">Resumen a exportar:</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">📊 {reportStats.totalVotes.toLocaleString()} votos</span>
                  <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">🗳️ {reportStats.uniqueMesas} mesas</span>
                  <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">🏆 {reportStats.uniqueParties} partidos</span>
                  {reportStats.topMun && (
                    <span className="px-2 py-1 bg-accent/20 text-accent rounded">📍 Top: {reportStats.topMun[0]}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Botón de Exportar */}
            <div className="pt-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generando archivo...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Exportar {format.toUpperCase()} con Branding APPYEMPRESA
                  </>
                )}
              </button>
            </div>
            
            {/* Feedback de Estado */}
            {exportStatus && (
              <div className={`mt-4 p-3 rounded-lg border flex items-center gap-3 text-sm ${
                exportStatus.type === "success" 
                  ? "bg-success/10 border-success/30 text-success" 
                  : "bg-danger/10 border-danger/30 text-danger"
              }`}>
                {exportStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{exportStatus.msg}</span>
              </div>
            )}
          </div>

          {/* Footer de Branding */}
          <div className="mt-6 p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <span className="text-accent font-bold text-sm">AE</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">APPYEMPRESA S.A.S</p>
                <p className="text-xs text-gray-400">www.appyempresa.digital</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Ing. Cristian Marín - CEO</p>
              <p>Reporte generado automáticamente • {new Date().toLocaleDateString("es-CO")}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}