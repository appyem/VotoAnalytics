import type { VoteRecord, Project } from "../models/types";

export interface AIInsight {
  id: string;
  type: "strategy" | "warning" | "opportunity";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  metric?: string;
}

export const generateRuleBasedInsights = (
  votes: VoteRecord[],
  _projects: Project[],
  selectedProject: Project | null
): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  if (!selectedProject || votes.length === 0) {
    insights.push({
      id: "no-data",
      type: "opportunity",
      title: "Datos insuficientes para análisis",
      description: "Cargue al menos 10 mesas con información territorial y de candidatos para activar el motor de insights.",
      priority: "medium"
    });
    return insights;
  }

  // 1. Integridad de Datos
  const missingFields = votes.filter(v => !v.mesa || !v.partyId || !v.candidateId).length;
  if (missingFields > votes.length * 0.1) {
    insights.push({
      id: "data-quality",
      type: "warning",
      title: "Integridad de Datos Baja",
      description: `El ${Math.round((missingFields / votes.length) * 100)}% de los registros tienen campos obligatorios vacíos. Revise la carga masiva o ingrese manualmente las actas pendientes.`,
      priority: "high",
      metric: `${Math.round((missingFields / votes.length) * 100)}% incompleto`
    });
  }

  // 2. Concentración Territorial
  const munMap = new Map<string, number>();
  votes.forEach(v => munMap.set(v.municipality, (munMap.get(v.municipality) || 0) + v.votes));
  const sortedMuns = Array.from(munMap.entries()).sort((a, b) => b[1] - a[1]);
  
  if (sortedMuns.length > 0) {
    const totalVotes = votes.reduce((sum, v) => sum + v.votes, 0);
    const topMun = sortedMuns[0];
    const pct = Math.round((topMun[1] / totalVotes) * 100);
    
    if (pct > 30) {
      insights.push({
        id: "geo-concentration",
        type: "opportunity",
        title: "Alta Concentración Territorial",
        description: `${topMun[0]} concentra el ${pct}% del voto total. Estrategia: Blindar mesas clave y ampliar cobertura en municipios vecinos para evitar dependencia geográfica.`,
        priority: "medium",
        metric: `${topMun[0]} (${pct}%)`
      });
    }
  }

  // 3. Desempeño por Partido vs Promedio
  const partyMap = new Map<string, number>();
  votes.forEach(v => partyMap.set(v.partyName, (partyMap.get(v.partyName) || 0) + v.votes));
  const totalPartyVotes = votes.reduce((sum, v) => sum + v.votes, 0);
  const avgParty = partyMap.size > 0 ? totalPartyVotes / partyMap.size : 0;

  Array.from(partyMap.entries()).forEach(([name, total]) => {
    const diff = total - avgParty;
    const pctDiff = avgParty > 0 ? Math.round((diff / avgParty) * 100) : 0;

    if (pctDiff > 20) {
      insights.push({
        id: `party-high-${name.replace(/\s/g, "-")}`,
        type: "strategy",
        title: `Desempeño Superior: ${name}`,
        description: `Supera el promedio general en +${pctDiff}%. Mantener estructura actual y replicar tácticas de movilización en otros territorios.`,
        priority: "medium",
        metric: `+${pctDiff}% vs promedio`
      });
    } else if (pctDiff < -20) {
      insights.push({
        id: `party-low-${name.replace(/\s/g, "-")}`,
        type: "warning",
        title: `Caída Crítica: ${name}`,
        description: `Por debajo del promedio en ${Math.abs(pctDiff)}%. Revisar estructura de líderes, cobertura de mesas y propaganda en zonas débiles.`,
        priority: "high",
        metric: `${Math.abs(pctDiff)}% bajo promedio`
      });
    }
  });

  // 4. Impacto de Líderes de Campaña
  const votesWithLeaders = votes.filter(v => v.leaderIds.length > 0);
  const votesWithout = votes.filter(v => v.leaderIds.length === 0);
  
  const avgWith = votesWithLeaders.length > 0 ? votesWithLeaders.reduce((s, v) => s + v.votes, 0) / votesWithLeaders.length : 0;
  const avgWithout = votesWithout.length > 0 ? votesWithout.reduce((s, v) => s + v.votes, 0) / votesWithout.length : 0;

  if (avgWith > avgWithout * 1.2 && votesWithLeaders.length > 5) {
    const efficiency = avgWithout > 0 ? Math.round(((avgWith / avgWithout) - 1) * 100) : 0;
    insights.push({
      id: "leadership-impact",
      type: "strategy",
      title: "Alto Impacto de Líderes Asignados",
      description: `Las mesas con líderes promedian ${Math.round(avgWith)} votos vs ${Math.round(avgWithout)} sin líderes. Recomendación: Asignar equipo territorial a las ${votesWithout.length} mesas descubiertas de inmediato.`,
      priority: "high",
      metric: `+${efficiency}% eficiencia`
    });
  }

  // 5. Cobertura Inicial
  const uniqueMesas = new Set(votes.map(v => v.mesa)).size;
  if (uniqueMesas < 25) {
    insights.push({
      id: "low-coverage",
      type: "opportunity",
      title: "Fase de Carga Inicial Detectada",
      description: `Solo ${uniqueMesas} mesas reportadas. Priorice la carga de actas para activar comparativas precisas y evitar sesgos por muestra pequeña.`,
      priority: "low",
      metric: `${uniqueMesas} mesas`
    });
  }

  // Ordenar por prioridad
  const prioOrder = { high: 3, medium: 2, low: 1 };
  return insights.sort((a, b) => prioOrder[b.priority] - prioOrder[a.priority]);
};