import type { AIRecommendation, AnalysisResult } from "../models/types";

export const generateRecommendations = (data: AnalysisResult): AIRecommendation[] => {
  const recs: AIRecommendation[] = [];

  // Ejemplo de lógica estructurada (en Fase 2 se conectará a OpenAI)
  const topGrowth = data.growthByParty.find(p => p.growth > 10);
  if (topGrowth) {
    recs.push({
      id: "r1",
      type: "opportunity",
      title: "Crecimiento Sostenido",
      description: `El partido ${topGrowth.party} muestra un crecimiento superior al 10%. Refuerza campañas en corregimientos con alta densidad de votantes jóvenes.`,
      priority: "high"
    });
  }

  if (data.weakMesas.length > 3) {
    recs.push({
      id: "r2",
      type: "warning",
      title: "Mesas Críticas",
      description: `Se identificaron ${data.weakMesas.length} mesas con votación decreciente. Se recomienda activar brigadas de terreno y logística de transporte.`,
      priority: "medium"
    });
  }

  return recs;
};