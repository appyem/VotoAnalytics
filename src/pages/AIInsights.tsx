import { useState, useCallback, useMemo } from "react";
import { useDataStore } from "../store/dataStore";
import { analyzeElectionStrategy, type AIAnalysisResult, type Recommendation } from "../services/groqService";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { Brain, Loader2, AlertTriangle, MapPin, Target, ChevronDown, CheckCircle, TrendingUp, Award } from "lucide-react";

// ============================================================================
// COMPONENTES AUXILIARES DE GRÁFICOS
// ============================================================================

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-medium text-gray-300 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value?.toLocaleString()}</span>
          {entry.payload?.target && (
            <span className="text-xs text-accent">(Meta: {entry.payload.target.toLocaleString()})</span>
          )}
        </div>
      ))}
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon, trend }: { 
  title: string; value: string | number; subtitle?: string; icon: React.ReactNode; trend?: "up" | "down" | "stable" 
}) => (
  <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-4 hover:border-gray-600/50 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-accent/10 rounded-lg">{icon}</div>
      {trend && (
        <TrendingUp className={`w-4 h-4 ${trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-gray-400"}`} />
      )}
    </div>
    <p className="text-xs text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const RecommendationCard = ({ rec }: { rec: Recommendation }) => {
  const priorityColors = {
    high: "border-danger/50 bg-danger/5",
    medium: "border-warning/50 bg-warning/5",
    low: "border-gray-600 bg-gray-800/30"
  };
  
  return (
    <div className={`p-4 rounded-xl border ${priorityColors[rec.priority]} transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-white text-sm">{rec.action}</h4>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
          rec.priority === "high" ? "bg-danger/20 text-danger" :
          rec.priority === "medium" ? "bg-warning/20 text-warning" : "bg-gray-700 text-gray-300"
        }`}>
          {rec.priority.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-gray-300 mb-3">{rec.justification}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-800/50 rounded p-2">
          <p className="text-gray-500">Fuente</p>
          <p className="text-gray-200 font-medium">{rec.dataSource}</p>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <p className="text-gray-500">Impacto</p>
          <p className="text-accent font-bold">+{rec.expectedImpact.toLocaleString()} votos</p>
          <p className="text-gray-400 text-[10px]">ROI: {rec.roi} votos/recurso</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AIInsights() {
  const { votes, selectedProject, loading } = useDataStore();
  const [contextNotes, setContextNotes] = useState("");
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("charts");

  // Filtrar votos por proyecto (comparación robusta)
  const projectVotes = useMemo(() => 
    selectedProject 
      ? votes.filter((v: any) => String(v.projectId || "").trim() === String(selectedProject.id || "").trim())
      : [],
    [votes, selectedProject]
  );

  const runAIAnalysis = useCallback(async () => {
    if (!contextNotes.trim()) {
      setError("Escriba el contexto político en lenguaje natural para analizar.");
      return;
    }
    if (projectVotes.length < 5) {
      setError(`Se requieren al menos 5 mesas válidas. Actualmente: ${projectVotes.length}.`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeElectionStrategy(
        contextNotes,
        projectVotes,
        selectedProject?.name || "Proyecto Activo"
      );
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al conectar con la IA");
    } finally {
      setIsAnalyzing(false);
    }
  }, [contextNotes, projectVotes, selectedProject]);

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  // 🔹 Preparar datos para gráficos (fallback si la IA no los devuelve)
  const fallbackChartData = useMemo(() => {
    if (!projectVotes.length) return { bar: [], pie: [], line: [], radar: [] };
    
    // Barras: Partidos
    const partyMap = new Map<string, number>();
    projectVotes.forEach(v => partyMap.set(v.partyName || "N/A", (partyMap.get(v.partyName) || 0) + v.votes));
    const barData = Array.from(partyMap.entries()).slice(0, 5).map(([label, value], i) => ({
      label, value, target: Math.round(value * 1.2), color: COLORS[i % COLORS.length]
    }));
    
    // Circular: Urbano/Rural
    const urban = projectVotes.filter(v => !v.corregimiento).reduce((s, v) => s + v.votes, 0);
    const rural = projectVotes.filter(v => v.corregimiento).reduce((s, v) => s + v.votes, 0);
    const pieData = [
      { label: "Urbano", value: Math.round((urban / (urban + rural)) * 100), color: COLORS[0] },
      { label: "Rural", value: Math.round((rural / (urban + rural)) * 100), color: COLORS[1] }
    ];
    
    // Línea: Proyección mensual (simulada)
    const lineData = Array.from({ length: 6 }, (_, i) => ({
      label: `Mes ${i + 1}`,
      value: Math.round((projectVotes.reduce((s, v) => s + v.votes, 0) / 6) * (i + 1) * 0.9 + Math.random() * 50)
    }));
    
    // Radar: Fortalezas (simulado)
    const radarData = [
      { label: "Cobertura Líderes", value: Math.min(100, Math.round((projectVotes.filter(v => v.leaderIds?.length > 0).length / projectVotes.length) * 100)) },
      { label: "Densidad Urbana", value: Math.min(100, Math.round((urban / (urban + rural)) * 100)) },
      { label: "Potencial Rural", value: Math.min(100, Math.round((rural / (urban + rural)) * 100 * 1.2)) },
      { label: "Alianzas Clave", value: 75 },
      { label: "Recursos Logísticos", value: 60 }
    ].map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));
    
    return { bar: barData, pie: pieData, line: lineData, radar: radarData };
  }, [projectVotes]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg"><Brain className="w-6 h-6 text-accent" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">IA Estratégica</h1>
              <p className="text-sm text-gray-400 mt-1">Análisis con lenguaje natural • Gráficos • Métricas en tiempo real</p>
            </div>
          </div>
        </div>
      </header>

      {/* Panel de Contexto */}
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl border border-accent/30 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" /> Contexto Político (Lenguaje Natural)
        </h3>
        <textarea
          value={contextNotes}
          onChange={(e) => setContextNotes(e.target.value)}
          placeholder="Ej: 'Daniel Gaviria es nuestro candidato a la Alcaldía. Apoyó a Juan Manuel Londoño y César Díaz. Queremos aumentar la votación 20% encima del candidato actual. Estrategias separadas para corregimientos y zona urbana...'"
          className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-accent outline-none resize-none h-32 transition-colors"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500">
            💡 La IA cruzará su contexto con {projectVotes.length} mesas reales para generar estrategias con gráficos y métricas.
          </p>
          <button 
            onClick={runAIAnalysis}
            disabled={isAnalyzing || loading || projectVotes.length < 5}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {isAnalyzing ? "Analizando..." : "🧠 Generar Análisis Completo"}
          </button>
        </div>
      </div>

      {/* Estados */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {!selectedProject && (
        <div className="text-center py-12 text-gray-500 bg-surface/30 rounded-xl border border-gray-700/50">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Seleccione un proyecto en el Dashboard para iniciar el análisis.</p>
        </div>
      )}

      {/* 🔹 RESULTADOS ENRIQUECIDOS */}
      {result && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* KPIs Ejecutivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard 
              title="Brecha Total" 
              value={`+${result.executiveSummary.totalGap.toLocaleString()} votos`} 
              subtitle={`Para alcanzar +${result.executiveSummary.growthPercentage}%`}
              icon={<Target className="w-5 h-5 text-accent" />}
              trend="up"
            />
            <KPICard 
              title="Mesas Intervenibles" 
              value={`${result.executiveSummary.intervenableMesas} de ${result.executiveSummary.totalMesas}`} 
              subtitle="Con margen <50 votos"
              icon={<MapPin className="w-5 h-5 text-success" />}
              trend="stable"
            />
            <KPICard 
              title="Crecimiento Necesario" 
              value={`+${result.executiveSummary.growthPercentage}%`} 
              subtitle="Sobre votación actual"
              icon={<TrendingUp className="w-5 h-5 text-warning" />}
              trend="up"
            />
            <KPICard 
              title="Nivel de Confianza" 
              value={result.executiveSummary.confidenceLevel.toUpperCase()} 
              subtitle="Basado en calidad de datos"
              icon={<Award className="w-5 h-5 text-accent" />}
              trend={result.executiveSummary.confidenceLevel === "high" ? "up" : "stable"}
            />
          </div>

          {/* 🔹 SECCIÓN DE GRÁFICOS (colapsable) */}
          <div className="bg-surface/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <button 
              onClick={() => toggleSection("charts")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors text-left"
            >
              <span className="font-medium text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> 📊 Visualizaciones Analíticas
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === "charts" ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSection === "charts" && (
              <div className="p-4 border-t border-gray-700/50 space-y-6">
                
                {/* Gráfico 1: Barras Comparativo */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">📈 Votos Actuales vs Meta por Partido</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                      // 🔹 PRIORIDAD 1: Datos reales de la IA
                      // 🔹 PRIORIDAD 2: Fallback con nombres reales de projectVotes
                      result.chartSeries?.barComparison?.length 
                        ? result.chartSeries.barComparison 
                        : Array.from(new Map(projectVotes.map((v: any) => [v.partyName || "N/A", (v.partyName ? 1 : 0) + v.votes]))
                            .entries())
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([label, value], i) => ({
                            label: label.length > 12 ? label.substring(0, 12) + "..." : label,
                            value,
                            target: Math.round(value * 1.2),
                            color: COLORS[i % COLORS.length],
                            fullName: label // Para tooltip completo
                          }))
                    }>
                      <CartesianGrid strokeDasharray="4 4" stroke="#374151" vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        stroke="#9ca3af" 
                        fontSize={9} 
                        tick={{ fill: '#9ca3af' }} 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                        interval={0}
                      />
                      <YAxis 
                        stroke="#9ca3af" 
                        fontSize={9} 
                        tick={{ fill: '#9ca3af' }} 
                        tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} 
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-surface border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
                              <p className="font-medium text-white mb-1">{data.fullName || data.label}</p>
                              <p className="text-gray-400">Votos actuales: <span className="text-white font-semibold">{data.value?.toLocaleString()}</span></p>
                              {data.target && (
                                <p className="text-accent">Meta +20%: <span className="font-semibold">{data.target.toLocaleString()}</span></p>
                              )}
                              {data.target && data.value && (
                                <p className="text-gray-500 mt-1">Brecha: <span className="text-danger">+{(data.target - data.value).toLocaleString()} votos</span></p>
                              )}
                            </div>
                          );
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="value" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Meta +20%" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico 2: Circular Distribución */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">🥧 Distribución Urbano vs Rural</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={result.chartSeries?.pieDistribution || fallbackChartData.pie} 
                            dataKey="value" 
                            nameKey="label" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={60} 
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {(result.chartSeries?.pieDistribution || fallbackChartData.pie).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Gráfico 3: Radar Fortalezas */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">🎯 Fortalezas por Factor</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={result.chartSeries?.radarStrengths || fallbackChartData.radar}>
                          <PolarGrid stroke="#374151" />
                          <PolarAngleAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                          <Radar name="Puntuación" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Gráfico 4: Línea Proyección */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">📈 Proyección de Crecimiento (6 meses)</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.chartSeries?.lineProjection || fallbackChartData.line}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#374151" />
                        <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tick={{ fill: '#9ca3af' }} />
                        <YAxis stroke="#9ca3af" fontSize={10} tick={{ fill: '#9ca3af' }} tickFormatter={(v) => `${v/100}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
              </div>
            )}
          </div>

          {/* 🔹 Análisis Territorial Detallado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zona Urbana */}
            <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-blue-400" /> 🏙️ Zona Urbana
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Votos actuales:</span>
                  <span className="text-white font-medium">{result.territorialAnalysis.urban.currentVotes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Meta (+{result.territorialAnalysis.urban.growthPercentage}%):</span>
                  <span className="text-accent font-bold">{result.territorialAnalysis.urban.targetVotes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Brecha:</span>
                  <span className="text-danger font-bold">+{result.territorialAnalysis.urban.gap.toLocaleString()} votos</span>
                </div>
              </div>
              
              {/* Puestos clave urbanos */}
              {result.territorialAnalysis.urban.keyPuestos?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-400 mb-2">Puestos prioritarios:</p>
                  <div className="space-y-2">
                    {result.territorialAnalysis.urban.keyPuestos.slice(0, 3).map((puesto, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">{puesto.name}</span>
                        <span className="text-accent font-medium">+{puesto.potential} votos potenciales</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Zona Rural */}
            <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-green-400" /> 🌾 Zona Rural (Corregimientos)
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Votos actuales:</span>
                  <span className="text-white font-medium">{result.territorialAnalysis.rural.currentVotes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Meta (+{result.territorialAnalysis.rural.growthPercentage}%):</span>
                  <span className="text-accent font-bold">{result.territorialAnalysis.rural.targetVotes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Brecha:</span>
                  <span className="text-danger font-bold">+{result.territorialAnalysis.rural.gap.toLocaleString()} votos</span>
                </div>
              </div>
              
              {/* Corregimientos clave */}
              {result.territorialAnalysis.rural.byCorregimiento && Object.keys(result.territorialAnalysis.rural.byCorregimiento).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-400 mb-2">Corregimientos con mayor oportunidad:</p>
                  <div className="space-y-2">
                    {Object.entries(result.territorialAnalysis.rural.byCorregimiento)
                      .sort(([, a]: any, [, b]: any) => b.gap - a.gap)
                      .slice(0, 3)
                      .map(([name, data]: [string, any], i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300">{name}</span>
                          <span className="text-accent font-medium">+{data.gap.toLocaleString()} votos</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🔹 Recomendaciones con Justificación */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" /> 🔍 Recomendaciones Tácticas (con Justificación)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))}
            </div>
          </div>

          {/* 🔹 Estrategias por Territorio */}
          <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">🎯 Estrategias Detalladas</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-medium text-blue-400 mb-2">🏙️ Zona Urbana</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  {result.strategies.urban.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-green-400 mb-2">🌾 Zona Rural</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  {result.strategies.rural.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 🔹 Brecha Proyectada con Detalle */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-2">📊 Brecha Detallada</h4>
            <p className="text-sm text-gray-200 leading-relaxed">
              Brecha total: +{result.executiveSummary.totalGap.toLocaleString()} votos 
              ({result.executiveSummary.growthPercentage}% de crecimiento necesario). 
              Mesas intervenibles: {result.executiveSummary.intervenableMesas} de {result.executiveSummary.totalMesas}.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-800/50 rounded p-2">
                <p className="text-gray-500">Votos necesarios</p>
                <p className="text-white font-bold">{result.executiveSummary.totalGap.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <p className="text-gray-500">Mesas a intervenir</p>
                <p className="text-white font-bold">{result.executiveSummary.intervenableMesas}</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}