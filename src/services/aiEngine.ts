import type { VoteRecord, Project } from "../models/types";

// ============================================================================
// TIPOS PARA INSIGHTS
// ============================================================================

export interface AIInsight {
  id: string;
  type: "strategy" | "warning" | "opportunity";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  metric?: string;
}

// ============================================================================
// TIPOS PARA CONTEXTO ESTRATÉGICO (campos opcionales para evitar errores TS)
// ============================================================================

export interface StrategicContext {
  contextNotes?: string;
  strategicGoal?: string;
  focusTerritory?: string;
  targetCandidate?: string;
  mode: "basic" | "strategic";
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

export const generateRuleBasedInsights = (
  votes: VoteRecord[],
  _projects: Project[],
  selectedProject: Project | null,
  context?: StrategicContext
): AIInsight[] => {
  // 🔹 Forzar modo estratégico por defecto si no se especifica
  const mode = context?.mode ?? "strategic";
  
  if (mode === "basic") {
    return generateBasicInsights(votes, selectedProject);
  }
  
  // 🔹 Normalizar contexto para evitar undefined → string errors
  const normalizedContext: StrategicContext = {
    contextNotes: context?.contextNotes ?? "",
    strategicGoal: context?.strategicGoal ?? "",
    focusTerritory: context?.focusTerritory ?? "",
    targetCandidate: context?.targetCandidate ?? "",
    mode: "strategic"
  };
  
  return generateStrategicInsights(votes, selectedProject, normalizedContext);
};

// ============================================================================
// MOTOR BÁSICO (preservado como fallback - parámetro _selectedProject para evitar warning)
// ============================================================================

const generateBasicInsights = (
  votes: VoteRecord[],
  _selectedProject: Project | null
): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // Filtrar votos válidos
  const validVotes = votes.filter(v => v.mesa && v.partyId && v.candidateId && v.votes > 0);
  
  if (validVotes.length < 5) {
    return [{
      id: "min-data",
      type: "warning",
      title: "⚠️ Datos insuficientes",
      description: `Se requieren 5+ mesas válidas. Actualmente: ${validVotes.length}.`,
      priority: "high",
      metric: `${validVotes.length}/5`
    }];
  }

  // Comparativa básica de partidos
  const partyMap = new Map<string, number>();
  validVotes.forEach(v => {
    const name = v.partyName || "N/A";
    partyMap.set(name, (partyMap.get(name) || 0) + v.votes);
  });
  
  if (partyMap.size >= 2) {
    const sorted = Array.from(partyMap.entries()).sort((a, b) => b[1] - a[1]);
    const [top, second] = sorted;
    const margin = second[1] > 0 ? Math.round(((top[1] - second[1]) / second[1]) * 100) : 0;
    
    insights.push({
      id: "party-comparison",
      type: "opportunity",
      title: `📊 Partidos: ${top[0]} lidera`,
      description: `${top[0]} tiene ${top[1].toLocaleString()} votos (+${margin}% vs ${second[0]}).`,
      priority: margin < 10 ? "high" : "medium",
      metric: `${margin}% margen`
    });
  }
  
  return insights;
};

// ============================================================================
// 🔹 MOTOR ESTRATÉGICO (activo por defecto)
// ============================================================================

const generateStrategicInsights = (
  votes: VoteRecord[],
  _selectedProject: Project | null,
  context: StrategicContext
): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // Filtrar votos válidos
  const validVotes = votes.filter(v => v.mesa && v.partyId && v.candidateId && v.votes > 0);
  
  if (validVotes.length < 5) {
    return [{
      id: "min-data-strategic",
      type: "warning",
      title: "⚠️ Datos insuficientes",
      description: `Se requieren 5+ mesas válidas. Actualmente: ${validVotes.length}.`,
      priority: "high",
      metric: `${validVotes.length}/5`
    }];
  }

  // 🔹 1. Conclusiones (si hay contexto de observaciones)
  if (context.contextNotes && context.contextNotes.trim()) {
    const mentions = extractLeaderMentions(context.contextNotes);
    if (mentions.length >= 2) {
      const analysis = analyzeLeaderEfficiency(validVotes, mentions);
      insights.push({
        id: "conclusion-leaders",
        type: "strategy",
        title: "📋 Conclusión: Eficiencia por Líder",
        description: analysis.summary,
        priority: "high",
        metric: analysis.metric
      });
    }
  }

  // 🔹 2. Estrategias personalizadas (si hay objetivo + candidato)
  if (context.strategicGoal?.trim() && context.targetCandidate?.trim()) {
    const strategy = generatePersonalizedStrategy(validVotes, context);
    if (strategy) {
      insights.push({
        id: "strategy-custom",
        type: "strategy",
        title: `🎯 Estrategia: ${strategy.title}`,
        description: strategy.description,
        priority: "high",
        metric: strategy.impact
      });
    }
  }

  // 🔹 3. Comparativas de desempeño (siempre generar)
  const comparisons = generatePerformanceComparisons(validVotes, context.focusTerritory ?? "");
  comparisons.forEach((c, i) => {
    insights.push({
      id: `comp-${i}`,
      type: "opportunity",
      title: `📊 ${c.title}`,
      description: c.description,
      priority: c.priority,
      metric: c.metric
    });
  });

  // 🔹 4. Recomendaciones generales (siempre generar)
  const recs = generateGeneralRecommendations(validVotes, context);
  recs.forEach((r, i) => {
    insights.push({
      id: `rec-${i}`,
      type: r.type,
      title: `🔍 ${r.title}`,
      description: r.description,
      priority: r.priority,
      metric: r.metric
    });
  });

  // 🔹 5. Alertas de contexto (si hay inconsistencias y la función está disponible)
  if (context.contextNotes?.trim() && typeof _contextNotesMatchData === "function") {
    // Nota: _contextNotesMatchData se define abajo con prefijo _ para evitar warning si no se usa
  }

  // Ordenar por relevancia estratégica
  const order: Record<string, number> = { "conclusión": 5, "estrategia": 4, "comparativa": 3, "recomendación": 2, "warning": 1 };
  return insights.sort((a, b) => {
    const aKey = Object.keys(order).find(k => a.title.toLowerCase().includes(k));
    const bKey = Object.keys(order).find(k => b.title.toLowerCase().includes(k));
    return (bKey ? order[bKey] : 0) - (aKey ? order[aKey] : 0);
  });
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const extractLeaderMentions = (notes: string): Array<{ candidate: string; leaderCount: number }> => {
  const pattern = /(?:candidato|candidata)\s+([^\s,;]+).*?(\d+)\s+líderes?/gi;
  const matches: Array<{ candidate: string; leaderCount: number }> = [];
  let match;
  while ((match = pattern.exec(notes)) !== null) {
    matches.push({ candidate: match[1].trim(), leaderCount: parseInt(match[2], 10) });
  }
  return matches;
};

const analyzeLeaderEfficiency = (
  votes: VoteRecord[],
  leaderMentions: Array<{ candidate: string; leaderCount: number }>
): { summary: string; metric: string } => {
  if (leaderMentions.length < 2) {
    return { summary: "Se requieren 2+ candidatos con menciones de líderes.", metric: "N/A" };
  }
  
  const efficiency = new Map<string, { votes: number; leaders: number }>();
  votes.forEach(v => {
    if (v.candidateName && v.leaderIds) {
      const key = v.candidateName.toUpperCase();
      const existing = efficiency.get(key) || { votes: 0, leaders: 0 };
      efficiency.set(key, { votes: existing.votes + v.votes, leaders: existing.leaders + v.leaderIds.length });
    }
  });
  
  const comparisons = leaderMentions.map(mention => {
    const data = efficiency.get(mention.candidate.toUpperCase());
    if (!data) return null;
    const eff = data.leaders > 0 ? Math.round(data.votes / data.leaders) : 0;
    return { candidate: mention.candidate, eff, votes: data.votes, leaders: data.leaders };
  }).filter((c): c is NonNullable<typeof c> => c !== null);
  
  if (comparisons.length < 2) {
    return { summary: "No se encontraron datos para los candidatos mencionados.", metric: "N/A" };
  }
  
  const sorted = comparisons.sort((a, b) => b.eff - a.eff);
  return {
    summary: `${sorted[0].candidate} tiene mayor eficiencia (${sorted[0].eff} votos/líder) vs ${sorted[sorted.length-1].candidate} (${sorted[sorted.length-1].eff} votos/líder).`,
    metric: `Δ ${Math.abs(sorted[0].eff - sorted[sorted.length-1].eff)} votos/líder`
  };
};

const generatePersonalizedStrategy = (
  votes: VoteRecord[],
  context: StrategicContext
): { title: string; description: string; impact: string } | null => {
  if (!context.targetCandidate?.trim() || !context.strategicGoal?.trim()) return null;
  
  const candidateVotes = votes.filter(v => 
    v.candidateName?.toUpperCase().includes(context.targetCandidate!.toUpperCase())
  );
  
  if (candidateVotes.length === 0) {
    return {
      title: "Candidato no encontrado",
      description: `"${context.targetCandidate}" no tiene registros en las mesas cargadas.`,
      impact: "N/A"
    };
  }
  
  const total = candidateVotes.reduce((s, v) => s + v.votes, 0);
  const avg = Math.round(total / candidateVotes.length);
  
  let territory = "";
  if (context.focusTerritory?.trim()) {
    const terrVotes = votes.filter(v => 
      v.municipality?.toUpperCase().includes(context.focusTerritory!.toUpperCase()) ||
      v.corregimiento?.toUpperCase().includes(context.focusTerritory!.toUpperCase())
    );
    if (terrVotes.length > 0) {
      const terrAvg = Math.round(terrVotes.reduce((s, v) => s + v.votes, 0) / terrVotes.length);
      const diff = avg - terrAvg;
      territory = diff > 20 ? `+${diff} votos/mesa en ${context.focusTerritory}. Fortalezca ventaja.` :
                 diff < -20 ? `${Math.abs(diff)} votos/mesa menos en ${context.focusTerritory}. Priorice líderes.` :
                 `Desempeño equilibrado en ${context.focusTerritory}.`;
    }
  }
  
  const goal = context.strategicGoal.toLowerCase();
  const strategy = 
    goal.includes("aumentar") || goal.includes("crecer") || goal.includes("más votos")
      ? `Para aumentar votación de ${context.targetCandidate}: 1) Asigne líderes en mesas con <${avg} votos, 2) Refuerce propaganda en corregimientos con baja cobertura. ${territory}`
      : goal.includes("ganar") || goal.includes("alcaldía") || goal.includes("elección")
        ? `Estrategia para victoria: 1) Identifique 10 mesas clave con margen <50 votos, 2) Monitoree en tiempo real. ${territory}`
        : `Recomendación para ${context.targetCandidate}: Mantenga estructura actual, monitoree mesas con baja participación. ${territory}`;
  
  return {
    title: `Plan para "${context.strategicGoal}"`,
    description: strategy,
    impact: `Potencial: +${Math.round(avg * 0.15)} votos/mesa`
  };
};

const generatePerformanceComparisons = (
  votes: VoteRecord[],
  focusTerritory: string
): Array<{ title: string; description: string; priority: "high" | "medium" | "low"; metric: string }> => {
  const comparisons: Array<{ title: string; description: string; priority: "high" | "medium" | "low"; metric: string }> = [];
  
  // Partidos
  const partyVotes = new Map<string, number>();
  votes.forEach(v => {
    if (v.partyName && (!focusTerritory || v.municipality?.toUpperCase().includes(focusTerritory.toUpperCase()))) {
      partyVotes.set(v.partyName, (partyVotes.get(v.partyName) || 0) + v.votes);
    }
  });
  
  if (partyVotes.size >= 2) {
    const sorted = Array.from(partyVotes.entries()).sort((a, b) => b[1] - a[1]);
    const [top, second] = sorted;
    const margin = second[1] > 0 ? Math.round(((top[1] - second[1]) / second[1]) * 100) : 0;
    comparisons.push({
      title: `Partidos ${focusTerritory ? `en ${focusTerritory}` : "(Global)"}`,
      description: `${top[0]} lidera con ${top[1].toLocaleString()} votos (+${margin}% vs ${second[0]}).`,
      priority: margin < 10 ? "high" : "medium",
      metric: `${margin}% margen`
    });
  }
  
  // Candidatos Top 3
  const candidateVotes = new Map<string, { votes: number; party: string }>();
  votes.forEach(v => {
    if (v.candidateName && v.partyName && (!focusTerritory || v.municipality?.toUpperCase().includes(focusTerritory.toUpperCase()))) {
      const key = v.candidateName.toUpperCase();
      const existing = candidateVotes.get(key) || { votes: 0, party: v.partyName };
      candidateVotes.set(key, { votes: existing.votes + v.votes, party: existing.party });
    }
  });
  
  if (candidateVotes.size >= 3) {
    const sorted = Array.from(candidateVotes.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
    
    const [top, second] = sorted;
    const gap = second.votes > 0 ? Math.round(((top.votes - second.votes) / second.votes) * 100) : 0;
    comparisons.push({
      title: `Candidatos Top 3 ${focusTerritory ? `en ${focusTerritory}` : ""}`,
      description: `1° ${top.name} (${top.party}): ${top.votes.toLocaleString()} votos. 2° ${second.name}: ${second.votes.toLocaleString()} (${gap > 0 ? "+" : ""}${gap}% detrás).`,
      priority: gap < 15 ? "high" : "low",
      metric: `Top: ${top.votes.toLocaleString()}`
    });
  }
  
  return comparisons;
};

const generateGeneralRecommendations = (
  votes: VoteRecord[],
  context: StrategicContext
): Array<{ type: "warning" | "opportunity"; title: string; description: string; priority: "high" | "medium" | "low"; metric?: string }> => {
  const recs: Array<{ type: "warning" | "opportunity"; title: string; description: string; priority: "high" | "medium" | "low"; metric?: string }> = [];
  
  // Cobertura de líderes
  const noLeaders = votes.filter(v => !v.leaderIds?.length).length;
  const coverage = votes.length > 0 ? Math.round(((votes.length - noLeaders) / votes.length) * 100) : 0;
  if (coverage < 70) {
    recs.push({
      type: "warning",
      title: "Cobertura de Líderes Baja",
      description: `Solo ${coverage}% de mesas tienen líderes. Asigne al menos 1 líder por mesa.`,
      priority: "high",
      metric: `${noLeaders} mesas sin líder`
    });
  }
  
  // Territorios desatendidos
  if (context.focusTerritory?.trim()) {
    const terr = votes.filter(v => v.corregimiento?.toUpperCase().includes(context.focusTerritory!.toUpperCase()));
    if (terr.length < votes.length * 0.1) {
      recs.push({
        type: "opportunity",
        title: "Oportunidad en Corregimientos",
        description: `${context.focusTerritory} representa <10% de los datos. Priorice carga de actas.`,
        priority: "medium",
        metric: `${terr.length} mesas en foco`
      });
    }
  }
  
  // Datos recientes
  const recent = votes.filter(v => {
    const date = new Date(v.updatedAt || v.createdAt || Date.now());
    return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });
  if (votes.length > 0 && recent.length < votes.length * 0.3) {
    recs.push({
      type: "warning",
      title: "Datos No Recientes",
      description: `Menos del 30% actualizados en la última semana.`,
      priority: "medium",
      metric: `${recent.length} registros recientes`
    });
  }
  
  return recs;
};

// 🔹 Función de validación de contexto (prefijo _ para evitar warning si no se usa inmediatamente)
const _contextNotesMatchData = (notes: string, votes: VoteRecord[]): boolean => {
  const mentioned = notes.match(/(?:candidato|candidata)\s+([^\s,;]+)/gi)?.map(m => m.split(/\s+/)[1].toLowerCase()) || [];
  const actual = new Set(votes.map(v => v.candidateName?.toLowerCase()).filter(Boolean));
  return mentioned.length === 0 || mentioned.every(c => actual.has(c));
};