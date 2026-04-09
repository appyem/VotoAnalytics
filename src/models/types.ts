export interface Project {
  id: string;
  name: string;
  type: "congreso" | "regional" | "local";
  year: number;
  createdAt: string;
}

export interface VoteRecord {
  id: string;
  department: string;
  municipality: string;
  corregimiento: string;
  puesto: string;
  mesa: string;
  partyId: string;
  partyName: string;
  candidateId: string;
  candidateName: string;
  leaderIds: string[];
  votes: number;
  projectId: string;
}

export interface AnalysisResult {
  growthByParty: { party: string; growth: number }[];
  growthByCandidate: { candidate: string; growth: number }[];
  topMesas: { mesa: string; votes: number }[];
  weakMesas: { mesa: string; votes: number }[];
  winnersByLevel: Record<string, string>;
}

export interface AIRecommendation {
  id: string;
  type: "strategy" | "warning" | "opportunity";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}