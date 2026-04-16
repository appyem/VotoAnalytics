// ============================================================================
// SERVICIO DE IA: Groq API + Llama 3.1 (Análisis Electoral Profesional)
// ============================================================================

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// 🔹 Tipos estrictos para el análisis enriquecido
export interface ChartDataPoint {
  label: string;
  value: number;
  target?: number;
  color?: string;
}

export interface TerritorialAnalysis {
  currentVotes: number;
  targetVotes: number;
  gap: number;
  growthPercentage: number;
  keyPuestos: Array<{ name: string; votes: number; potential: number }>;
  chartData: ChartDataPoint[];
}

export interface Recommendation {
  action: string;
  justification: string;
  dataSource: string;
  expectedImpact: number;
  roi: number; // votos por recurso invertido
  priority: "high" | "medium" | "low";
}

export interface AIAnalysisResult {
  executiveSummary: {
    totalGap: number;
    growthPercentage: number;
    intervenableMesas: number;
    totalMesas: number;
    confidenceLevel: "high" | "medium" | "low";
  };
  territorialAnalysis: {
    urban: TerritorialAnalysis;
    rural: TerritorialAnalysis & { byCorregimiento: Record<string, TerritorialAnalysis> };
  };
  allianceAnalysis: {
    transferableVotes: number;
    keyAllies: string[];
    riskFactors: string[];
  };
  strategies: {
    urban: string[];
    rural: string[];
  };
  recommendations: Recommendation[];
  chartSeries: {
    barComparison: ChartDataPoint[];
    pieDistribution: ChartDataPoint[];
    lineProjection: ChartDataPoint[];
    radarStrengths: ChartDataPoint[];
  };
}

export const analyzeElectionStrategy = async (
  contextNotes: string,
  votes: any[],
  projectName: string
): Promise<AIAnalysisResult> => {
  if (!GROQ_API_KEY) {
    throw new Error("Falta VITE_GROQ_API_KEY en .env.local");
  }

  // 🔹 Preparar datos reales para el análisis (resumen estructurado)
  const partyMap = new Map<string, number>();
  const candidateMap = new Map<string, number>();
  const puestoMap = new Map<string, { votes: number; mesaCount: number }>();
  let urbanVotes = 0, ruralVotes = 0, withLeaders = 0;

  votes.forEach(v => {
    // Partidos
    const party = v.partyName || "N/A";
    partyMap.set(party, (partyMap.get(party) || 0) + v.votes);
    
    // Candidatos
    const candidate = v.candidateName || "N/A";
    candidateMap.set(candidate, (candidateMap.get(candidate) || 0) + v.votes);
    
    // Puestos de votación
    const puesto = v.puesto || "Desconocido";
    const puestoData = puestoMap.get(puesto) || { votes: 0, mesaCount: 0 };
    puestoMap.set(puesto, {
      votes: puestoData.votes + v.votes,
      mesaCount: puestoData.mesaCount + 1
    });
    
    // Territorio
    if (v.corregimiento) ruralVotes += v.votes; else urbanVotes += v.votes;
    
    // Líderes
    if (Array.isArray(v.leaderIds) && v.leaderIds.length > 0) withLeaders++;
  });

  const dataSummary = {
    totalVotes: votes.reduce((s: number, v: any) => s + v.votes, 0),
    totalMesas: votes.length,
    topParties: Array.from(partyMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    topCandidates: Array.from(candidateMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    topPuestos: Array.from(puestoMap.entries()).sort((a, b) => b[1].votes - a[1].votes).slice(0, 10),
    territorialSplit: { urban: urbanVotes, rural: ruralVotes },
    leadershipCoverage: { totalMesas: votes.length, withLeaders, without: votes.length - withLeaders },
    avgVotesPerMesa: Math.round(votes.reduce((s: number, v: any) => s + v.votes, 0) / votes.length)
  };

  // 🔹 Prompt optimizado para solicitar JSON estructurado con datos para gráficos
  const prompt = `
Eres un estratega político senior especializado en análisis electoral basado en DATOS REALES.

CONTEXTO DEL USUARIO (lenguaje natural):
${contextNotes}

DATOS REALES DEL PROYECTO "${projectName}":
${JSON.stringify(dataSummary, null, 2)}

INSTRUCCIONES CRÍTICAS:
1. Usa EXCLUSIVAMENTE los datos proporcionados para cálculos. No inventes cifras.
2. Si un candidato futuro no está en los datos, usa los votos de sus aliados como línea base.
3. Calcula la brecha REAL: (meta - votos_actuales). Meta típica: +20% sobre líder actual.
4. Identifica mesas intervenibles: aquellas con margen <50 votos entre primeros puestos.
5. Para cada recomendación, calcula ROI: votos esperados / recursos necesarios.

FORMATO DE RESPUESTA (JSON ESTRICTO - sin markdown, sin texto adicional):
{
  "executiveSummary": {
    "totalGap": <número>,
    "growthPercentage": <número con 1 decimal>,
    "intervenableMesas": <número>,
    "totalMesas": <número>,
    "confidenceLevel": "high" | "medium" | "low"
  },
  "territorialAnalysis": {
    "urban": {
      "currentVotes": <número>,
      "targetVotes": <número>,
      "gap": <número>,
      "growthPercentage": <número>,
      "keyPuestos": [{"name": "string", "votes": number, "potential": number}],
      "chartData": [{"label": "string", "value": number, "target": number}]
    },
    "rural": {
      "currentVotes": <número>,
      "targetVotes": <número>,
      "gap": <número>,
      "growthPercentage": <número>,
      "keyPuestos": [...],
      "chartData": [...],
      "byCorregimiento": {
        "<nombre_corregimiento>": {
          "currentVotes": <número>,
          "targetVotes": <número>,
          "gap": <número>,
          "growthPercentage": <número>,
          "chartData": [...]
        }
      }
    }
  },
  "allianceAnalysis": {
    "transferableVotes": <número estimado>,
    "keyAllies": ["nombre1", "nombre2"],
    "riskFactors": ["factor1", "factor2"]
  },
  "strategies": {
    "urban": ["estrategia1", "estrategia2"],
    "rural": ["estrategia1", "estrategia2"]
  },
  "recommendations": [
    {
      "action": "acción concreta",
      "justification": "por qué esta acción",
      "dataSource": "dato específico que respalda",
      "expectedImpact": <votos esperados>,
      "roi": <votos por recurso>,
      "priority": "high" | "medium" | "low"
    }
  ],
  "chartSeries": {
    "barComparison": [{"label": "Candidato/Partido", "value": votos_actuales, "target": votos_meta}],
    "pieDistribution": [{"label": "Urbano/Rural", "value": porcentaje}],
    "lineProjection": [{"label": "Mes", "value": votos_proyectados}],
    "radarStrengths": [{"label": "Factor", "value": puntuación_0_100"}]
  }
}

EJEMPLO DE CÁLCULO REAL:
- Si líder actual tiene 2,400 votos y meta es +20% → target = 2,880 → gap = 480 votos
- Si hay 23 mesas con margen <50 votos → intervenableMesas = 23
- Si asignar 1 líder genera ~45 votos en promedio → ROI = 45

Responde SOLO con el JSON válido.
`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.15, // Más determinista para cálculos
      max_tokens: 2500, // Más espacio para JSON estructurado
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Sin detalle');
    throw new Error(`Error Groq (${response.status}): ${err}`);
  }

  const data = await response.json();
  let raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("La IA no devolvió respuesta válida");

  // 🔹 Limpieza robusta de markdown
  raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  
  try {
    const result = JSON.parse(raw) as AIAnalysisResult;
    
    // 🔹 Validación mínima de estructura
    if (!result.executiveSummary || !result.territorialAnalysis) {
      throw new Error("Respuesta de IA con estructura incompleta");
    }
    
    return result;
  } catch (parseError) {
    console.error("Error parseando JSON de IA:", raw.substring(0, 200));
    throw new Error("Formato JSON inválido. Reformule el contexto y reintente.");
  }
};