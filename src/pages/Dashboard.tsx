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
  ChevronDown, Search, SlidersHorizontal, Eye, AlertCircle, CheckCircle,
  Trophy, Target, Building2, Hash, Loader2
} from "lucide-react";

  

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];



// ============================================================================
// NUEVOS COMPONENTES PARA RANKINGS PROFESIONALES
// ============================================================================

const RankingCard = ({ title, icon, items, type }: { 
  title: string; 
  icon: React.ReactNode; 
  items: Array<{ name: string; votes: number; party?: string; candidate?: string; puesto?: string; mesa?: string }>; 
  type: "candidate" | "party" | "puesto" | "mesa" 
}) => (
  <div className="bg-surface/50 rounded-xl border border-gray-700/50 p-4 hover:border-gray-600/50 transition-colors">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-accent/10 rounded-lg">{icon}</div>
      <h4 className="font-semibold text-white text-sm">{title}</h4>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? "bg-yellow-500/20 text-yellow-400" : 
                i === 1 ? "bg-gray-400/20 text-gray-300" : 
                i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-gray-700 text-gray-400"
              }`}>{i + 1}</span>
              <span className="truncate text-gray-200 font-medium">{item.name}</span>
            </div>
            <span className="font-semibold text-accent">{item.votes.toLocaleString()}</span>
          </div>
          {/* 🔹 Detalles adicionales para tipo "mesa" */}
          {type === "mesa" && (item.puesto || item.party || item.candidate) && (
            <div className="pl-7 space-y-0.5 text-[10px] text-gray-400">
              {item.puesto && <div className="truncate">📍 {item.puesto}</div>}
              {item.party && <div className="truncate">🎖️ {item.party}</div>}
              {item.candidate && <div className="truncate">👤 {item.candidate}</div>}
            </div>
          )}
          {/* 🔹 Partido para candidatos */}
          {type === "candidate" && item.party && (
            <div className="pl-7 text-[10px] text-gray-500 truncate">{item.party}</div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const TerritoryStrengthCard = ({ territory, data }: { 
  territory: string; 
  data: { 
    totalVotes: number; 
    topParty: string; 
    topCandidate: string;
    partiesRanked: Array<{ name: string; votes: number }>;
    candidatesRanked: Array<{ name: string; votes: number }>;
  } 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-surface/30 rounded-lg p-3 border border-gray-700/30 hover:border-accent/30 transition-colors">
      {/* Header clickable */}
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs font-medium text-gray-300 truncate">{territory}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded">{data.totalVotes.toLocaleString()} votos</span>
          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Top resumen */}
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-gray-500">🏆 Partido:</span>
          <span className="text-gray-300 truncate ml-2">{data.topParty || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">👤 Candidato:</span>
          <span className="text-gray-300 truncate ml-2">{data.topCandidate || "-"}</span>
        </div>
      </div>
      
      {/* 🔹 Rankings completos (colapsables) */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-700/30 space-y-3">
          {/* Partidos */}
          <div>
            <div className="text-[10px] font-medium text-gray-400 mb-1">Partidos (mayor → menor)</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {data.partiesRanked.map((p, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="text-gray-500 truncate">{i+1}. {p.name}</span>
                  <span className="text-accent font-medium">{p.votes.toLocaleString()}</span>
                </div>
              ))}
              {data.partiesRanked.length === 0 && <span className="text-[10px] text-gray-600">Sin datos</span>}
            </div>
          </div>
          
          {/* Candidatos */}
          <div>
            <div className="text-[10px] font-medium text-gray-400 mb-1">Candidatos (mayor → menor)</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {data.candidatesRanked.map((c, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="text-gray-500 truncate">{i+1}. {c.name}</span>
                  <span className="text-accent font-medium">{c.votes.toLocaleString()}</span>
                </div>
              ))}
              {data.candidatesRanked.length === 0 && <span className="text-[10px] text-gray-600">Sin datos</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





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
const FilterPanel = ({ isOpen, onClose, tempFilters, setTempFilters, onApply, corregimientos }: { 
  isOpen: boolean; 
  onClose: () => void; 
  tempFilters: { department?: string; municipality?: string; corregimiento?: string; partyId?: string }; 
  setTempFilters: (f: { department?: string; municipality?: string; corregimiento?: string; partyId?: string }) => void;
  onApply: () => void;
  corregimientos: string[];  // 🔹 NUEVO: lista de corregimientos para el select
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


                    {/* 🔹 NUEVO: Filtro por Corregimiento */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Corregimiento</label>
            <select 
              value={tempFilters.corregimiento || ""} 
              onChange={(e) => setTempFilters({ ...tempFilters, corregimiento: e.target.value || undefined })}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-accent outline-none"
            >
              <option value="">Todos (incluye urbano)</option>
              {corregimientos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500">Dejar vacío para incluir casco urbano + todos los corregimientos</p>
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

    // 🔹 NUEVO: Rankings estratégicos
  const [_strategicRankings, setStrategicRankings] = useState<{
    topCandidates: Array<{ name: string; votes: number; party: string }>;
    topParties: Array<{ name: string; votes: number }>;
    topPuestos: Array<{ name: string; votes: number; municipality: string; corregimiento?: string }>;
    topMesas: Array<{ mesa: string; puesto: string; votes: number; party: string; candidate: string }>;
    byCorregimiento: Record<string, { totalVotes: number; topParty: string; topCandidate: string }>;
  } | null>(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);

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

    // Cargar votos + rankings cuando cambia proyecto
  useEffect(() => {
    if (selectedProject?.id && !useMock) {
      // Cargar votos base
      loadFirestoreVotes(selectedProject.id);
      
      // Cargar rankings estratégicos
      const loadRankings = async () => {
        setRankingsLoading(true);
        try {
          const { getStrategicRankings } = await import("../services/firestoreService");
          const rankings = await getStrategicRankings(selectedProject.id);
          setStrategicRankings(rankings);
        } catch (err) {
          console.warn("No se pudieron cargar rankings:", err);
        } finally {
          setRankingsLoading(false);
        }
      };
      loadRankings();
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
        // Limpiar filtros vacíos antes de enviar
        const cleanFilters = Object.fromEntries(
          Object.entries(tempFilters).filter(([_, v]) => v !== undefined && v !== "")
        );
        (store as any).loadFilteredVotes(selectedProject.id, cleanFilters);
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

      // 🔹 NUEVO: Votos por Candidato (ordenado descendente)
  const votesByCandidate = useMemo(() => {
    const map = new Map<string, { votes: number; party: string }>();
    filteredVotes.forEach((v: any) => {
      if (v.candidateName?.trim()) {
        const key = v.candidateName.toUpperCase();
        const existing = map.get(key) || { votes: 0, party: v.partyName || "" };
        map.set(key, { votes: existing.votes + v.votes, party: existing.party || v.partyName || "" });
      }
    });
    return Array.from(map.entries())
      .map(([candidate, data]) => ({ candidate, votes: data.votes, party: data.party }))
      .sort((a, b) => b.votes - a.votes);
  }, [filteredVotes]);

  // 🔹 NUEVO: Votos por Puesto de Votación (ordenado descendente)
  const votesByPuesto = useMemo(() => {
    const map = new Map<string, { votes: number; municipality: string; corregimiento?: string }>();
    filteredVotes.forEach((v: any) => {
      if (v.puesto?.trim()) {
        const key = v.puesto.toUpperCase();
        const existing = map.get(key) || { votes: 0, municipality: v.municipality || "", corregimiento: v.corregimiento };
        map.set(key, { 
          votes: existing.votes + v.votes, 
          municipality: existing.municipality, 
          corregimiento: existing.corregimiento 
        });
      }
    });
    return Array.from(map.entries())
      .map(([puesto, data]) => ({ puesto, votes: data.votes, municipality: data.municipality, corregimiento: data.corregimiento }))
      .sort((a, b) => b.votes - a.votes);
  }, [filteredVotes]);

  // 🔹 NUEVO: Votos por Mesa (ordenado descendente)
  const votesByMesa = useMemo(() => {
    return [...filteredVotes]
      .sort((a: any, b: any) => b.votes - a.votes)
      .map((v: any) => ({
        mesa: v.mesa,
        puesto: v.puesto,
        party: v.partyName || "",
        candidate: v.candidateName || "",
        votes: v.votes
      }));
  }, [filteredVotes]);

  // 🔹 NUEVO: Inteligencia Territorial por Corregimiento
  const territorialIntelligence = useMemo(() => {
    const corrMap = new Map<string, { 
      totalVotes: number; 
      parties: Map<string, number>; 
      candidates: Map<string, number> 
    }>();
    
    filteredVotes.forEach((v: any) => {
      const key = (v.corregimiento?.trim() || v.municipality)?.toUpperCase() || "SIN UBICACIÓN";
      const existing = corrMap.get(key) || { 
        totalVotes: 0, 
        parties: new Map<string, number>(), 
        candidates: new Map<string, number>() 
      };
      
      existing.totalVotes += v.votes;
      if (v.partyName?.trim()) {
        const pKey = v.partyName.toUpperCase();
        existing.parties.set(pKey, (existing.parties.get(pKey) || 0) + v.votes);
      }
      if (v.candidateName?.trim()) {
        const cKey = v.candidateName.toUpperCase();
        existing.candidates.set(cKey, (existing.candidates.get(cKey) || 0) + v.votes);
      }
      corrMap.set(key, existing);
    });
    
    const result: Record<string, { 
      totalVotes: number; 
      topParty: string; 
      topCandidate: string;
      partiesRanked: Array<{ name: string; votes: number }>;
      candidatesRanked: Array<{ name: string; votes: number }>;
    }> = {};
    
    corrMap.forEach((data, key) => {
      // Rankings ordenados descendente
      const partiesRanked = Array.from(data.parties.entries())
        .map(([name, votes]) => ({ name, votes }))
        .sort((a, b) => b.votes - a.votes);
      const candidatesRanked = Array.from(data.candidates.entries())
        .map(([name, votes]) => ({ name, votes }))
        .sort((a, b) => b.votes - a.votes);
      
      result[key] = { 
        totalVotes: data.totalVotes, 
        topParty: partiesRanked[0]?.name || "", 
        topCandidate: candidatesRanked[0]?.name || "",
        partiesRanked,
        candidatesRanked
      };
    });
    
    return result;
  }, [filteredVotes]);

  // 🔹 NUEVO: Extraer corregimientos únicos para el filtro
  const availableCorregimientos = useMemo(() => {
    const corrs = new Set(filteredVotes.map((v: any) => v.corregimiento).filter(Boolean));
    return Array.from(corrs).sort() as string[];
  }, [filteredVotes]);

  // 🔹 Crecimiento (simulado para MVP)
  const growthData = useMemo(() => {
    if (!selectedProject || projects.length < 2) return [];
    return votesByParty.map(({ party, votes: partyVotes }) => ({
      party,
      current: partyVotes,
      previous: Math.round(partyVotes * 0.85),
      growth: Math.round((Math.random() - 0.3) * 40)
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

            {/* 🔹 NUEVA SECCIÓN: Rankings Profesionales Top 5 */}
      <section className="bg-surface/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" /> Rankings Estratégicos Top 5
          </h3>
          {rankingsLoading && <span className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Calculando...</span>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RankingCard title="🏆 Candidatos" icon={<Users className="w-4 h-4" />} items={votesByCandidate.slice(0, 5).map((c: any) => ({ name: c.candidate, votes: c.votes, party: c.party }))} type="candidate" />
          <RankingCard title="🎖️ Partidos" icon={<Award className="w-4 h-4" />} items={votesByParty.slice(0, 5).map((p: any) => ({ name: p.party, votes: p.votes }))} type="party" />
          <RankingCard title="🏢 Puestos de Votación" icon={<Building2 className="w-4 h-4" />} items={votesByPuesto.slice(0, 5).map(p => ({ name: p.puesto, votes: p.votes }))} type="puesto" />
          <RankingCard title="🗳️ Mesas Destacadas" icon={<Hash className="w-4 h-4" />} items={votesByMesa.slice(0, 5).map((m: any) => ({ 
          name: `Mesa ${m.mesa}`, 
          votes: m.votes, 
          party: m.party,
          candidate: m.candidate,
          puesto: m.puesto,
          mesa: m.mesa
        }))} type="mesa" />
        </div>
      </section>


            {/* 🔹 NUEVA SECCIÓN: Inteligencia Territorial */}
      <section className="bg-surface/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" /> Inteligencia Territorial
          </h3>
          <span className="text-xs text-gray-500">{Object.keys(territorialIntelligence).length} sectores analizados</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(territorialIntelligence).map(([territory, data]: [string, { 
            totalVotes: number; 
            topParty: string; 
            topCandidate: string;
            partiesRanked: Array<{ name: string; votes: number }>;
            candidatesRanked: Array<{ name: string; votes: number }>;
          }]) => (
            <TerritoryStrengthCard key={territory} territory={territory} data={data} />
          ))}
                    {Object.keys(territorialIntelligence).length === 0 && (
            <p className="text-sm text-gray-500 col-span-full text-center py-4">Sin datos territoriales disponibles</p>
          )}
        </div>
        
        {/* Leyenda de interpretación */}
        <div className="mt-4 pt-3 border-t border-gray-700/50 text-[10px] text-gray-500 flex flex-wrap gap-4">
          <span>🏆 <strong>Partido fuerte:</strong> Mayor votación en el sector</span>
          <span>👤 <strong>Candidato fuerte:</strong> Mayor votación individual en el sector</span>
          <span>💡 <strong>Estrategia:</strong> Fortalezca donde su candidato sea débil y el rival sea fuerte</span>
        </div>
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

           {/* ===== RESUMEN ESTRATÉGICO POR PUESTO (REEMPLAZA TABLA CRUDA) ===== */}
      <section className="bg-surface/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" /> Resumen Estratégico por Puesto
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Votación exacta agrupada • Ranking por influencia territorial</p>
          </div>
          <span className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full border border-accent/30">
            {votesByPuesto.length} puestos activos
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Puesto / Corregimiento</th>
                <th className="px-4 py-3 text-right font-medium">Votos Totales</th>
                <th className="px-4 py-3 text-right font-medium">% del Total</th>
                <th className="px-4 py-3 text-left font-medium">Partido Líder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {votesByPuesto.map((item, idx) => {
                const pct = totalVotes > 0 ? ((item.votes / totalVotes) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={item.puesto} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-gray-200 font-medium">{item.puesto}</div>
                      {item.corregimiento && <div className="text-[10px] text-accent/80 mt-0.5">📍 {item.corregimiento}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-white">{item.votes.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(Number(pct), 100)}%` }} />
                        </div>
                        <span className="text-gray-300 text-xs">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-300">
                      <span className="px-2 py-0.5 bg-gray-800 rounded text-xs border border-gray-700">
                        {/* Se calcula dinámicamente en el render */}
                        🏆 {(() => {
                          const partyMap = new Map<string, number>();
                          filteredVotes.filter(v => v.puesto === item.puesto).forEach(v => {
                            partyMap.set(v.partyName || "N/A", (partyMap.get(v.partyName) || 0) + v.votes);
                          });
                          return Array.from(partyMap.entries()).sort((a,b) => b[1]-a[1])[0]?.[0] || "N/A";
                        })()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {votesByPuesto.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Sin datos territoriales cargados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-gray-700/50 bg-gray-800/20 text-xs text-gray-500 flex items-center justify-between">
          <span>📊 Agrupación exacta por puesto de votación • Sin datos crudos irrelevantes</span>
          <span>{votesByPuesto.length} sectores analizados</span>
        </div>
      </section>

            {/* Filter Panel Modal */}
      <FilterPanel 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        tempFilters={tempFilters}
        setTempFilters={setTempFilters}
        onApply={handleApplyFilters}
        corregimientos={availableCorregimientos}  // 🔹 NUEVO: pasar lista de corregimientos
      />
    </div>
  );
}