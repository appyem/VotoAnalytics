import { useState, useEffect, useCallback } from "react";
import { useDataStore } from "../store/dataStore";
import { generateRuleBasedInsights, type AIInsight } from "../services/aiEngine";
import { 
  Brain, AlertTriangle, TrendingUp, Target, RefreshCw, Loader2, 
  CheckCircle, BarChart3, Shield, Users, MapPin 
} from "lucide-react";

export default function AIInsights() {
  const { votes, projects, selectedProject, loading } = useDataStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ejecutar análisis cuando cambian los datos
  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    // Simulación de procesamiento para UX profesional (600ms)
    const timer = setTimeout(() => {
      try {
        // ⚠️ IMPORTANTE: Asegúrese de que su aiEngine.ts exporte 'generateRuleBasedInsights'
        const result = generateRuleBasedInsights(votes, projects, selectedProject);
        setInsights(result);
      } catch (error) {
        console.error("Error en motor de IA:", error);
        setInsights([]);
      } finally {
        setIsAnalyzing(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [votes, projects, selectedProject]);

  useEffect(() => { 
    if (!loading && votes.length > 0) {
      runAnalysis(); 
    }
  }, [runAnalysis, loading, votes.length]);

  const getIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-danger" />;
      case "strategy": return <Target className="w-5 h-5 text-accent" />;
      case "opportunity": return <TrendingUp className="w-5 h-5 text-success" />;
      default: return <Brain className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBg = (type: AIInsight["type"]) => {
    switch (type) {
      case "warning": return "bg-danger/10 border-danger/30";
      case "strategy": return "bg-accent/10 border-accent/30";
      case "opportunity": return "bg-success/10 border-success/30";
      default: return "bg-gray-800/50 border-gray-700";
    }
  };

  const priorityBadge = (priority: AIInsight["priority"]) => {
    const colors = { 
      high: "bg-danger/20 text-danger", 
      medium: "bg-warning/20 text-warning", 
      low: "bg-gray-700 text-gray-300" 
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded ${colors[priority]}`}>{priority.toUpperCase()}</span>;
  };

  // Métricas resumen
  const stats = {
    warnings: insights.filter(i => i.type === "warning").length,
    strategies: insights.filter(i => i.type === "strategy").length,
    opportunities: insights.filter(i => i.type === "opportunity").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Brain className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">IA Estratégica</h1>
              <p className="text-sm text-gray-400 mt-1">Motor de análisis inteligente basado en datos reales</p>
            </div>
          </div>
        </div>
        <button 
          onClick={runAnalysis} 
          disabled={isAnalyzing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-gray-700 rounded-lg text-gray-200 hover:text-white hover:border-gray-600 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? "Analizando..." : "Regenerar Insights"}
        </button>
      </header>

      {/* Empty State / Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-surface/50 rounded-xl border border-gray-700/50">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
          <p className="text-gray-400">Cargando datos para análisis...</p>
        </div>
      ) : insights.length === 0 && !isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface/50 rounded-xl border border-gray-700/50">
          <BarChart3 className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-300">Sin datos suficientes</h3>
          <p className="text-sm text-gray-500 max-w-md mt-2">Cargue al menos 10 mesas desde "Carga de Datos" para activar el motor de recomendaciones.</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface/50 p-4 rounded-xl border border-gray-700/50 flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-danger" /></div>
              <div><p className="text-xs text-gray-400">Alertas Críticas</p><p className="text-xl font-bold text-danger">{stats.warnings}</p></div>
            </div>
            <div className="bg-surface/50 p-4 rounded-xl border border-gray-700/50 flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg"><Target className="w-5 h-5 text-accent" /></div>
              <div><p className="text-xs text-gray-400">Estrategias Activas</p><p className="text-xl font-bold text-accent">{stats.strategies}</p></div>
            </div>
            <div className="bg-surface/50 p-4 rounded-xl border border-gray-700/50 flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg"><TrendingUp className="w-5 h-5 text-success" /></div>
              <div><p className="text-xs text-gray-400">Oportunidades</p><p className="text-xl font-bold text-success">{stats.opportunities}</p></div>
            </div>
          </div>

          {/* Insights Feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Recomendaciones Generadas
            </h2>
            
            {isAnalyzing ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface/50 p-4 rounded-xl border border-gray-700/50 animate-pulse h-24" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {insights.map(insight => (
                  <div key={insight.id} className={`p-4 rounded-xl border transition-all hover:shadow-lg ${getBg(insight.type)}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">{getIcon(insight.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">{insight.title}</h3>
                          {priorityBadge(insight.priority)}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{insight.description}</p>
                        {insight.metric && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-800 rounded text-xs font-mono text-gray-400">
                              📊 {insight.metric}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Footer */}
          <div className="mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Motor Rule-Based (v1.0)</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Proyecto: {selectedProject?.name || "Ninguno"}</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {votes.length} registros analizados</span>
            </div>
            <span>Generado automáticamente • Sin costo de API</span>
          </div>
        </>
      )}
    </div>
  );
}