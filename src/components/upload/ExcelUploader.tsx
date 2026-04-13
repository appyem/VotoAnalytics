import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import type { VoteRecord } from "../../models/types";
import { useDataStore } from "../../store/dataStore";
import { saveVotesBatch, type BatchUploadResult } from "../../services/firestoreService";
import { Upload, CheckCircle, AlertCircle, Loader2, X, FileSpreadsheet } from "lucide-react";

interface UploadState {
  isUploading: boolean;
  progress: number;
  status: "idle" | "validating" | "uploading" | "success" | "error";
  message: string;
  result: BatchUploadResult | null;
}

export default function ExcelUploader() {
  const [fileName, setFileName] = useState<string>("");
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    status: "idle",
    message: "",
    result: null
  });
  
  const { selectedProject, loadFirestoreVotes } = useDataStore();

  const resetUpload = useCallback(() => {
    setFileName("");
    setUploadState({
      isUploading: false,
      progress: 0,
      status: "idle",
      message: "",
      result: null
    });
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar extensión
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setUploadState({
        isUploading: false,
        progress: 0,
        status: "error",
        message: "Formato no válido. Use archivos .xlsx o .xls",
        result: null
      });
      return;
    }
    
    setFileName(file.name);
    setUploadState(prev => ({ ...prev, status: "validating", message: "Leyendo archivo..." }));

    try {
      // Leer y parsear Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Partial<VoteRecord>>(ws);

      if (json.length === 0) {
        throw new Error("El archivo no contiene datos válidos");
      }

      // Validar projectId
      if (!selectedProject?.id) {
        throw new Error("Seleccione un proyecto antes de cargar datos");
      }

      // Preparar datos para envío
      const votesToUpload = json.map(row => ({
        ...row,
        projectId: selectedProject.id,
        votes: Number(row.votes) || 0,
        leaderIds: Array.isArray(row.leaderIds) ? row.leaderIds : 
                  (typeof row.leaderIds === "string" ? [row.leaderIds] : [])
      })) as Omit<VoteRecord, "id">[];

      setUploadState({ 
        isUploading: true, 
        progress: 10, 
        status: "uploading", 
        message: `Validando ${votesToUpload.length} registros...`,
        result: null
      });

      // Callback de progreso
      const onProgress = (processed: number, total: number) => {
        const percent = Math.min(95, Math.round((processed / total) * 100));
        setUploadState(prev => ({
          ...prev,
          progress: percent,
          message: `Procesando: ${processed}/${total} registros...`
        }));
      };

      // Ejecutar carga masiva
      const result = await saveVotesBatch(votesToUpload, selectedProject.id, onProgress);

      // Actualizar estado final
      setUploadState({
        isUploading: false,
        progress: 100,
        status: result.errorCount === 0 ? "success" : "error",
        message: result.errorCount === 0 
          ? `✅ ${result.successCount} registros guardados exitosamente`
          : `⚠️ ${result.successCount} guardados, ${result.errorCount} con errores`,
        result
      });

      // Recargar datos del proyecto si hubo éxito
      if (result.successCount > 0) {
        await loadFirestoreVotes(selectedProject.id);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al procesar el archivo";
      setUploadState({
        isUploading: false,
        progress: 0,
        status: "error",
        message,
        result: null
      });
      console.error("Excel upload error:", error);
    }
  };

  // Componente: Barra de Progreso
  const ProgressBar = ({ percent, status }: { percent: number; status: UploadState["status"] }) => {
    const getColor = () => {
      if (status === "error") return "bg-danger";
      if (status === "success") return "bg-success";
      return "bg-accent";
    };
    
    return (
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  // Componente: Mensaje de Estado
  const StatusMessage = () => {
    if (uploadState.status === "idle") return null;
    
    const icons = {
      validating: <Loader2 className="w-5 h-5 text-warning animate-spin" />,
      uploading: <Loader2 className="w-5 h-5 text-accent animate-spin" />,
      success: <CheckCircle className="w-5 h-5 text-success" />,
      error: <AlertCircle className="w-5 h-5 text-danger" />
    };
    
    const bgColors = {
      validating: "bg-warning/10 border-warning/30 text-warning",
      uploading: "bg-accent/10 border-accent/30 text-accent", 
      success: "bg-success/10 border-success/30 text-success",
      error: "bg-danger/10 border-danger/30 text-danger"
    };
    
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${bgColors[uploadState.status]}`}>
        {icons[uploadState.status]}
        <span className="text-sm font-medium flex-1">{uploadState.message}</span>
        {(uploadState.status === "success" || uploadState.status === "error") && (
          <button 
            onClick={resetUpload}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  // Componente: Detalle de Errores
  const ErrorDetails = () => {
    if (!uploadState.result?.errors.length) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Detalles de errores ({uploadState.result.errors.length})
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {uploadState.result.errors.slice(0, 10).map((err, idx) => (
            <div key={idx} className="text-xs text-gray-400 flex items-start gap-2">
              <span className="text-danger font-mono">Fila {err.index + 1}:</span>
              <span>{err.message}</span>
            </div>
          ))}
          {uploadState.result.errors.length > 10 && (
            <div className="text-xs text-gray-500 italic">
              + {uploadState.result.errors.length - 10} errores más...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Carga Masiva por Excel</h3>
            <p className="text-xs text-gray-500">Importe registros desde una plantilla</p>
          </div>
        </div>
        {fileName && uploadState.status === "idle" && (
          <button 
            onClick={resetUpload}
            className="text-xs text-gray-400 hover:text-danger transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Área de Upload */}
      {uploadState.status === "idle" ? (
        <label className="block">
          <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            fileName 
              ? "border-accent/50 bg-accent/5 hover:border-accent" 
              : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/30"
          }`}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="hidden"
              disabled={uploadState.isUploading}
            />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${fileName ? "text-accent" : "text-gray-500"}`} />
            <p className="text-sm font-medium text-gray-300">
              {fileName || "Arrastre su archivo Excel aquí"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              o haga clic para buscar • .xlsx, .xls
            </p>
          </div>
        </label>
      ) : (
        /* Estado de Proceso */
        <div className="space-y-4">
          {/* Barra de Progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{uploadState.message}</span>
              <span className="text-gray-500 font-mono">{uploadState.progress}%</span>
            </div>
            <ProgressBar percent={uploadState.progress} status={uploadState.status} />
          </div>
          
          {/* Mensaje de Estado */}
          <StatusMessage />
          
          {/* Detalles de Errores (si aplica) */}
          {uploadState.status === "error" && <ErrorDetails />}
          
          {/* Botón de Reiniciar */}
          {(uploadState.status === "success" || uploadState.status === "error") && (
            <button
              onClick={resetUpload}
              className="w-full py-2.5 text-sm font-medium text-gray-300 hover:text-white 
                       bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cargar otro archivo
            </button>
          )}
        </div>
      )}

      {/* Footer: Columnas Requeridas */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500 mb-2">Columnas requeridas en el Excel:</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            "department", "municipality", "corregimiento", "puesto", "mesa",
            "partyId", "partyName", "candidateId", "candidateName", 
            "leaderIds", "votes", "projectId"
          ].map((col) => (
            <span 
              key={col}
              className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded font-mono"
            >
              {col}
            </span>
          ))}
        </div>
        <button 
          className="mt-3 text-xs text-accent hover:text-accent/80 transition-colors"
          onClick={() => {
            // Aquí podría implementar la descarga de plantilla
            alert("Función de descarga de plantilla en desarrollo");
          }}
        >
          ↓ Descargar plantilla de ejemplo
        </button>
      </div>
    </div>
  );
}