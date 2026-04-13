import { useEffect, useMemo, useState, useCallback } from "react";
import { useDataStore } from "../store/dataStore";
import KPIGrid from "../components/charts/KPIGrid";
import TrafficLight from "../components/charts/TrafficLight";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from "recharts";
import { 
  Download, RefreshCw, Filter, TrendingUp, Users, MapPin, Award,
  ChevronDown, Search, SlidersHorizontal, Eye, AlertCircle, CheckCircle
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-medium text-gray-300 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// Filter Panel Component
const FilterPanel = ({ isOpen, onClose, tempFilters, setTempFilters, onApply }: { 
  isOpen: boolean; 
  onClose: () => void; 
  tempFilters: { department?: string; municipality?: string; partyId?: string }; 
  setTempFilters: (f: { department?: string; municipality?: string; partyId?: string }) => void;
  onApply: () => void;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-64 w-80 bg-surface border-r border-gray-700 p-6 overflow-y-auto animate-slide-in-left">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Filtros Avanzados</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Departamento */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Departamento</label>
            <select 
              value={tempFilters.department || ""} 
              onChange={(e) => setTempFilters({ ...tempFilters, department: e.target.value || undefined })}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-accent outline-none"
            >
              <option value="">Todos</option>
              <option value="Caldas">Caldas</option>
            </select>
          </div>
          
          {/* Municipio */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Municipio</label>
            <input 
              type="text" 
              placeholder="Ej: Filadelfia"
              value={tempFilters.municipality || ""}
              onChange={(e) => setTempFilters({ ...tempFilters, municipality: e.target.value })}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-accent outline-none"
            />
          </div>
          
          {/* Partido */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Partido Político</label>
            <input 
              type="text" 
              placeholder="ID o Nombre del partido"
              value={tempFilters.partyId || ""}
              onChange={(e) => setTempFilters({ ...tempFilters, partyId: e.target.value })}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-accent outline-none"
            />
          </div>
          
          {/* Botones */}
          <div className="flex gap-2">
            <button 
              onClick={() => { setTempFilters({}); }}
              className="flex-1 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Limpiar
            </button>
            <button 
              onClick={onApply}
              className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error Banner Component
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
    <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm font-medium text-danger">Error de conexión</p>
      <p className="text-sm text-gray-400 mt-1">{message}</p>
    </div>
    <button 
      onClick={onRetry}
      className="px-3 py-1.5 text-xs font-medium text-white bg-danger hover:bg-danger/90 rounded-lg transition-colors"
    >
      Reintentar
    </button>
  </div>
);

// Loading Skeleton Component
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Header Skeleton */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-gray-800">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-800 rounded" />
        <div className="h-4 w-64 bg-gray-800 rounded" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-64 bg-gray-800 rounded-lg" />
        <div className="h-9 w-9 bg-gray-800 rounded-lg" />
        <div className="h-9 w-9 bg-gray-800 rounded-lg" />
        <div className="h-9 w-24 bg-gray-800 rounded-lg" />
      </div>
    </div>
    
    {/* KPIs Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface/50 rounded-xl p-5 border border-gray-700/50">
          <div className="h-4 w-24 bg-gray-800 rounded mb-3" />
          <div className="h-8 w-20 bg-gray-800 rounded mb-2" />
          <div className="h-3 w-16 bg-gray-800 rounded" />
        </div>
      ))}
    </div>
    
    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-surface/50 rounded-xl p-5 border border-gray-700/50 h-72" />
      <div className="bg-surface/50 rounded-xl p-5 border border-gray-700/50 h-72" />
      <div className="lg:col-span-3 bg-surface/50 rounded-xl p-5 border border-gray-700/50 h-80" />
    </div>
    
    {/* Table Skeleton */}
    <div className="bg-surface/50 rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="p-4 border-b border-gray-700/50">
        <div className="h-5 w-48 bg-gray-800 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-800 rounded" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-16 bg-gray-800 rounded" />
            <div className="h-4 w-24 bg-gray-800 rounded" />
            <div className="h-4 w-32 bg-gray-800 rounded" />
            <div className="h-4 w-20 bg-gray-800 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { 
    projects, 
    selectedProject, 
    votes, 
    loading, 
    error,
    loadMockData, 
    loadFirestoreProjects, 
    loadFirestoreVotes,
    setSelectedProject 
  } = useDataStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [useMock, setUseMock] = useState(false); // Toggle para desarrollo
  const [tempFilters, setTempFilters] = useState<{ department?: string; municipality?: string; partyId?: string }>({});

  // Cargar datos al montar componente
  useEffect(() => {
    const initializeData = async () => {
      if (useMock) {
        loadMockData();
      } else {
        await loadFirestoreProjects();
      }
    };
    initializeData();
  }, [useMock, loadMockData, loadFirestoreProjects]);

  // Cargar votos cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (selectedProject?.id && !useMock) {
      loadFirestoreVotes(selectedProject.id);
    }
  }, [selectedProject?.id, useMock, loadFirestoreVotes]);

  // Handler para refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (useMock) {
        loadMockData();
      } else if (selectedProject?.id) {
        await loadFirestoreProjects();
        await loadFirestoreVotes(selectedProject.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle entre modo mock y Firestore (para desarrollo)
  const toggleDataSource = () => {
    setUseMock(prev => !prev);
    if (!useMock) {
      loadMockData();
    } else {
      loadFirestoreProjects();
    }
  };

    // Handler para aplicar filtros
  const handleApplyFilters = useCallback(() => {
    if (selectedProject?.id) {
      const store = useDataStore.getState();
      if ('loadFilteredVotes' in store) {
        (store as any).loadFilteredVotes(selectedProject.id, tempFilters);
      }
    }
    setShowFilters(false);
  }, [selectedProject?.id, tempFilters]);

  // Filtrar votos del proyecto seleccionado
  const filteredVotes = useMemo(
    () => votes.filter((v) => v.projectId === selectedProject?.id),
    [votes, selectedProject]
  );

  // KPIs dinámicos
  const totalVotes = filteredVotes.reduce((sum, v) => sum + v.votes, 0);
  const activeMesas = new Set(filteredVotes.map((v) => v.mesa)).size;
  const totalLeaders = new Set(filteredVotes.flatMap((v) => v.leaderIds)).size;
  const avgVotesPerMesa = activeMesas > 0 ? Math.round(totalVotes / activeMesas) : 0;
  const participationRate = totalVotes > 0 ? Math.min(100, Math.round((totalVotes / (activeMesas * 500)) * 100)) : 0;

  // Datos para gráficas
  const votesByParty = useMemo(() => {
    const map = new Map<string, number>();
    filteredVotes.forEach((v) => map.set(v.partyName, (map.get(v.partyName) || 0) + v.votes));
    return Array.from(map.entries())
      .map(([party, votes]) => ({ party, votes }))
      .sort((a, b) => b.votes - a.votes);
  }, [filteredVotes]);

  const votesByDept = useMemo(() => {
    const map = new Map<string, number>();
    filteredVotes.forEach((v) => map.set(v.department, (map.get(v.department) || 0) + v.votes));
    return Array.from(map.entries())
      .map(([department, votes]) => ({ department, votes }))
      .sort((a, b) => b.votes - a.votes);
  }, [filteredVotes]);

    const growthData = useMemo(() => {
    if (!selectedProject || projects.length < 2) return [];
    
    // MVP: mostrar distribución actual con crecimiento simulado
    // Esto se reemplazará con comparación real cuando activemos previousVotes en el store
    return votesByParty.map(({ party, votes: partyVotes }) => ({
      party,
      current: partyVotes,
      previous: Math.round(partyVotes * 0.85), // Simulación temporal
      growth: Math.round((Math.random() - 0.3) * 40) // Simulación temporal
    })).sort((a, b) => b.growth - a.growth);
  }, [votesByParty, selectedProject, projects.length]);

  // Estado: Loading inicial
  if (loading && projects.length === 0) {
    return <DashboardSkeleton />;
  }

  // Estado: Error de conexión
  if (error && projects.length === 0 && !useMock) {
    return (
      <div className="flex items-center justify-center h-96">
        <ErrorBanner message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  // Estado: Sin proyectos disponibles
  if (projects.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <div className="p-4 bg-warning/10 rounded-full">
          <AlertCircle className="w-8 h-8 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">No hay proyectos disponibles</h3>
          <p className="text-sm text-gray-400 mt-1">Cree su primera elección en el panel de administración</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors"
          >
            Reintentar carga
          </button>
          <button 
            onClick={toggleDataSource}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors"
          >
            Usar datos de prueba
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ===== ERROR BANNER (si hay error pero hay datos) ===== */}
      {error && !loading && (
        <ErrorBanner message={error} onRetry={handleRefresh} />
      )}

      {/* ===== DATA SOURCE TOGGLE (para desarrollo) ===== */}
      <div className="flex items-center justify-end">
        <button
          onClick={toggleDataSource}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            useMock 
              ? "bg-warning/20 text-warning border border-warning/30" 
              : "bg-success/20 text-success border border-success/30"
          }`}
          title={useMock ? "Usando datos mock" : "Usando Firestore real"}
        >
          {useMock ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {useMock ? "Modo Prueba" : "Firestore Activo"}
        </button>
      </div>
      
      {/* ===== PAGE HEADER ===== */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Dashboard Estratégico</h1>
            <span className="px-2.5 py-1 bg-accent/15 text-accent text-xs font-semibold rounded-full border border-accent/30">
              {selectedProject?.year}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1.5">
            {selectedProject?.name} • 
            <span className="text-gray-500">
              {loading ? "Actualizando..." : "Actualizado hace 2 min"}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar mesa, candidato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg 
                       text-sm text-gray-200 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                       transition-all"
            />
          </div>
          
          {/* Project Selector */}
          <select
            value={selectedProject?.id || ""}
            onChange={(e) => {
              const proj = projects.find((p) => p.id === e.target.value);
              if (proj) setSelectedProject(proj);
            }}
            disabled={loading}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent 
                     cursor-pointer hover:border-gray-600 transition-colors min-w-[180px]
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-surface">{p.name} ({p.year})</option>
            ))}
          </select>
          
          {/* Actions */}
          <button
                        onClick={() => { setTempFilters({}); setShowFilters(true); }}
            disabled={loading}
            className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 
                     hover:text-white hover:border-gray-600 disabled:opacity-50 transition-colors"
            title="Filtros avanzados"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 
                     hover:text-white hover:border-gray-600 disabled:opacity-50 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            className="flex items-center gap-2 px-3.5 py-2 bg-accent hover:bg-accent/90 text-white 
                     text-sm font-medium rounded-lg transition-colors shadow-lg shadow-accent/20"
            title="Exportar reporte"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* ===== KPIs GRID ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="md:col-span-2 lg:col-span-1">
          <KPIGrid 
            title="Votos Totales" 
            value={totalVotes.toLocaleString()} 
            trend="up" 
            icon={<Award className="w-5 h-5" />}
            subtitle={`+${Math.round(totalVotes * 0.12).toLocaleString()} vs periodo anterior`}
            highlight
          />
        </div>
        <KPIGrid 
          title="Mesas Activas" 
          value={activeMesas.toString()} 
          trend="stable" 
          icon={<MapPin className="w-5 h-5" />}
          subtitle={`${Math.round((activeMesas / 120) * 100)}% de cobertura`}
        />
        <KPIGrid 
          title="Promedio/Mesa" 
          value={avgVotesPerMesa.toLocaleString()} 
          trend="up" 
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={`+${Math.round(avgVotesPerMesa * 0.08)} vs promedio nacional`}
        />
        <KPIGrid 
          title="Líderes Activos" 
          value={totalLeaders.toString()} 
          trend={totalLeaders > 20 ? "up" : "down"} 
          icon={<Users className="w-5 h-5" />}
          subtitle={`${participationRate}% tasa de participación`}
        />
      </section>

      {/* ===== STATUS BAR ===== */}
      <section className="bg-surface/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-300">Estado por Partido:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-full">
                <TrafficLight status="up" /> 
                <span className="text-sm text-gray-200">Alto <span className="text-gray-500">({votesByParty.filter(p => p.votes > 400).length})</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-full">
                <TrafficLight status="stable" /> 
                <span className="text-sm text-gray-200">Medio <span className="text-gray-500">({votesByParty.filter(p => p.votes > 200 && p.votes <= 400).length})</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/30 rounded-full">
                <TrafficLight status="down" /> 
                <span className="text-sm text-gray-200">Bajo <span className="text-gray-500">({votesByParty.filter(p => p.votes <= 200).length})</span></span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-accent transition-colors group"
          >
            <Filter className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Filtros avanzados</span>
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      </section>

      {/* ===== CHARTS GRID ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-surface/50 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors group">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Votos por Partido</h3>
              <p className="text-xs text-gray-500 mt-0.5">Distribución actual de sufragios</p>
            </div>
            <button className="text-xs text-gray-500 hover:text-accent transition-colors flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              Detalles
            </button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={votesByParty} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#374151" vertical={false} />
              <XAxis dataKey="party" stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#374151' }} />
              <YAxis stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#374151' }} tickFormatter={(value) => `${value/100}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
              <Bar dataKey="votes" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} animationDuration={500} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-surface/50 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Distribución Departamental</h3>
              <p className="text-xs text-gray-500 mt-0.5">Porcentaje por región</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
              {votesByDept.length} deptos
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={votesByDept} dataKey="votes" nameKey="department" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3} label={({ percent }) => percent > 0.12 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                {votesByDept.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={40} formatter={(value) => <span className="text-xs text-gray-400">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="lg:col-span-3 bg-surface/50 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Comparación de Crecimiento</h3>
              <p className="text-xs text-gray-500 mt-0.5">Evolución vs periodo anterior por partido</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-1 bg-blue-500 rounded" /> <span className="text-gray-400">Actual</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-1 bg-amber-500 rounded" /> <span className="text-gray-400">Anterior</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={growthData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#374151" vertical={false} />
              <XAxis dataKey="party" stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#374151' }} />
              <YAxis stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#374151' }} tickFormatter={(value) => `${value/100}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-xs text-gray-400">{value}</span>} />
              <Area type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorCurrent)" name="Actual" animationDuration={500} />
              <Area type="monotone" dataKey="previous" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorPrevious)" name="Anterior" animationDuration={500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== DATA TABLE ===== */}
      <section className="bg-surface/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">Últimos Registros Cargados</h3>
            <p className="text-xs text-gray-500 mt-0.5">{filteredVotes.length} registros totales • Ordenados por fecha</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              Exportar CSV
            </button>
            <button className="px-3 py-1.5 text-xs text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors font-medium">
              Ver todos →
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Mesa</th>
                <th className="px-4 py-3 text-left font-medium">Partido</th>
                <th className="px-4 py-3 text-left font-medium">Candidato</th>
                <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                <th className="px-4 py-3 text-right font-medium">Votos</th>
                <th className="px-4 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {filteredVotes.slice(0, 8).map((v, index) => (
                <tr key={v.id} className="hover:bg-gray-800/20 transition-colors group">
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-800 rounded-md text-xs font-mono text-gray-300 border border-gray-700">
                      {v.mesa}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-gray-200 font-medium">{v.partyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-300">{v.candidateName}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">
                    <span className="block">{v.municipality}</span>
                    <span className="text-gray-500">{v.department}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-semibold text-accent">{v.votes.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button className="p-1.5 text-gray-500 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No hay registros para este proyecto
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="p-3 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between text-xs text-gray-500">
          <span>Mostrando 1-{Math.min(8, filteredVotes.length)} de {filteredVotes.length} registros</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded hover:bg-gray-700 transition-colors disabled:opacity-50" disabled>←</button>
            <button className="px-2.5 py-1 bg-accent text-white rounded">1</button>
            <button className="px-2.5 py-1 rounded hover:bg-gray-700 transition-colors">2</button>
            <button className="px-2.5 py-1 rounded hover:bg-gray-700 transition-colors">3</button>
            <span className="px-1">...</span>
            <button className="px-2.5 py-1 rounded hover:bg-gray-700 transition-colors">→</button>
          </div>
        </div>
      </section>

      {/* Filter Panel Modal */}
      <FilterPanel 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        tempFilters={tempFilters}
        setTempFilters={setTempFilters}
        onApply={handleApplyFilters}
        />
    </div>
  );
}