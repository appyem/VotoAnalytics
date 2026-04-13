import { useState, useMemo } from "react";
import { useDataStore } from "../store/dataStore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  ArrowUp, ArrowDown, Minus, BarChart3, Users, MapPin, 
  AlertCircle, Loader2, TrendingUp 
} from "lucide-react";

// ============================================================================
// TIPOS LOCALES (Sin depender de exportService.ts)
// ============================================================================

interface ComparisonRow {
  party: string;
  current: number;
  compare: number;
  growth: number;
}

interface KPICard {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
  detail?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL (Aislado y Seguro)
// ============================================================================

export default function Analysis() {
  const { projects, selectedProject, votes, loading } = useDataStore();
  const [compareProjectId, setCompareProjectId] = useState<string>("");

  // Votos del proyecto actual
  const currentVotes = useMemo(
    () => votes.filter(v => v.projectId === selectedProject?.id),
    [votes, selectedProject]
  );

  // Votos del proyecto a comparar
  const compareProject = projects.find(p => p.id === compareProjectId);
  const compareVotes = useMemo(
    () => compareProjectId ? votes.filter(v => v.projectId === compareProjectId) : [],
    [votes, compareProjectId]
  );

  // Matriz comparativa por partido
  const comparisonData: ComparisonRow[] = useMemo(() => {
    if (currentVotes.length === 0 || compareVotes.length === 0) return [];
    
    const partyMap = new Map<string, { current: number; compare: number }>();
    
    currentVotes.forEach(v => {
      const existing = partyMap.get(v.partyName) || { current: 0, compare: 0 };
      partyMap.set(v.partyName, { ...existing, current: existing.current + v.votes });
    });

    compareVotes.forEach(v => {
      const existing = partyMap.get(v.partyName) || { current: 0, compare: 0 };
      partyMap.set(v.partyName, { ...existing, compare: existing.compare + v.votes });
    });

    return Array.from(partyMap.entries())
      .map(([party, data]) => {
        const growth = data.compare > 0 
          ? Math.round(((data.current - data.compare) / data.compare) * 100) 
          : data.current > 0 ? 100 : 0;
        return { party, current: data.current, compare: data.compare, growth };
      })
      .sort((a, b) => b.current - a.current);
  }, [currentVotes, compareVotes]);

  // KPIs dinámicos
  const kpis: KPICard[] = useMemo(() => {
    const currentTotal = currentVotes.reduce((s, v) => s + v.votes, 0);
    const compareTotal = compareVotes.reduce((s, v) => s + v.votes, 0);
    const overallGrowth = compareTotal > 0 
      ? Math.round(((currentTotal - compareTotal) / compareTotal) * 100) 
      : 0;

    return [
      {
        label: "Votos Totales Comparados",
        value: `${currentTotal.toLocaleString()} vs ${compareTotal.toLocaleString()}`,
        trend: overallGrowth > 0 ? "up" : overallGrowth < 0 ? "down" : "stable",
        icon: <TrendingUp className="w-5 h-5" />,
        detail: `Variación global: ${overallGrowth > 0 ? "+" : ""}${overallGrowth}%`
      },
      {
        label: "Mesas Activas",
        value: `${new Set(currentVotes.map(v => v.mesa)).size} vs ${new Set(compareVotes.map(v => v.mesa)).size}`,
        trend: "stable",
        icon: <MapPin className="w-5 h-5" />
      },
      {
        label: "Partidos en Juego",
        value: `${new Set(currentVotes.map(v => v.partyName)).size}`,
        trend: "up",
        icon: <Users className="w-5 h-5" />
      }
    ];
  }, [currentVotes, compareVotes]);

  // Estado: Cargando
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
        <span className="ml-3 text-gray-400">Cargando datos para análisis...</span>
      </div>
    );
  }

  // Estado: Sin proyecto seleccionado
  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center bg-surface/50 rounded-xl border border-gray-700/50">
        <AlertCircle className="w-10 h-10 text-warning mb-3" />
        <p className="text-gray-300 font-medium">Seleccione una campaña en el Dashboard</p>
        <p className="text-sm text-gray-500 mt-1">El análisis comparativo requiere un proyecto activo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Selector */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Análisis Comparativo</h1>
          <p className="text-sm text-gray-400 mt-1">Crucé campañas, identifique tendencias y evalúe rendimiento histórico</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={compareProjectId}
            onChange={(e) => setCompareProjectId(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:border-accent outline-none min-w-[220px]"
          >
            <option value="">📊 Seleccionar campaña a comparar...</option>
            {projects.filter(p => p.id !== selectedProject.id).map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.year})</option>
            ))}
          </select>
          {/* Botón de exportación postergado para evitar conflictos */}
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
            title="Exportación disponible en próximo paso"
          >
            Exportar (Próximamente)
          </button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-surface/50 p-4 rounded-xl border border-gray-700/50 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              kpi.trend === "up" ? "bg-success/10 text-success" : 
              kpi.trend === "down" ? "bg-danger/10 text-danger" : "bg-gray-700/50 text-gray-300"
            }`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{kpi.value}</p>
              {kpi.detail && <p className="text-xs text-gray-500 mt-1">{kpi.detail}</p>}
            </div>
          </div>
        ))}
      </section>

      {/* Chart & Table Grid */}
      {!compareProject ? (
        <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">Seleccione una campaña anterior para iniciar la comparativa</p>
          <p className="text-sm text-gray-500 mt-1">Los datos se actualizarán automáticamente al elegir un proyecto.</p>
        </div>
      ) : (
        <>
          {/* Gráfica Comparativa */}
          <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Distribución de Votos por Partido</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#374151" vertical={false} />
                <XAxis dataKey="party" stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} tickFormatter={(v) => `${v/100}k`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="current" name="Campaña Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compare" name="Campaña Comparada" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla Detallada */}
          <div className="bg-surface/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
              <h3 className="font-semibold text-white">Detalle por Partido</h3>
              <span className="text-xs text-gray-500">{comparisonData.length} partidos registrados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Partido</th>
                    <th className="px-4 py-3 text-right font-medium">Actual</th>
                    <th className="px-4 py-3 text-right font-medium">Anterior</th>
                    <th className="px-4 py-3 text-center font-medium">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {comparisonData.map((row) => (
                    <tr key={row.party} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-200">{row.party}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{row.current.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{row.compare.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          row.growth > 0 ? "bg-success/10 text-success" : 
                          row.growth < 0 ? "bg-danger/10 text-danger" : "bg-gray-700 text-gray-300"
                        }`}>
                          {row.growth > 0 ? <ArrowUp className="w-3 h-3" /> : row.growth < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {row.growth > 0 ? "+" : ""}{row.growth}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {comparisonData.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Sin datos comparables</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}