import type { Project, VoteRecord } from "../models/types";

export const mockProjects: Project[] = [
  { id: "p1", name: "Elecciones Legislativas 2022", type: "congreso", year: 2022, createdAt: "2022-03-15" },
  { id: "p2", name: "Elecciones Legislativas 2026", type: "congreso", year: 2026, createdAt: "2026-03-20" }
];

export const mockVotes: VoteRecord[] = [
  // Periodo 2022
  { id: "v1", department: "Antioquia", municipality: "Medellín", corregimiento: "Centro", puesto: "IE San José", mesa: "001", partyId: "pa1", partyName: "Partido A", candidateId: "c1", candidateName: "Carlos M", leaderIds: ["l1"], votes: 450, projectId: "p1" },
  { id: "v2", department: "Antioquia", municipality: "Medellín", corregimiento: "Centro", puesto: "IE San José", mesa: "002", partyId: "pb1", partyName: "Partido B", candidateId: "c2", candidateName: "Ana R", leaderIds: ["l2"], votes: 320, projectId: "p1" },
  { id: "v3", department: "Cundinamarca", municipality: "Bogotá", corregimiento: "Suba", puesto: "Col Suba", mesa: "010", partyId: "pa1", partyName: "Partido A", candidateId: "c1", candidateName: "Carlos M", leaderIds: ["l1"], votes: 510, projectId: "p1" },
  // Periodo 2026
  { id: "v4", department: "Antioquia", municipality: "Medellín", corregimiento: "Centro", puesto: "IE San José", mesa: "001", partyId: "pa1", partyName: "Partido A", candidateId: "c3", candidateName: "Carlos M", leaderIds: ["l1", "l3"], votes: 520, projectId: "p2" },
  { id: "v5", department: "Antioquia", municipality: "Medellín", corregimiento: "Centro", puesto: "IE San José", mesa: "002", partyId: "pb1", partyName: "Partido B", candidateId: "c4", candidateName: "Luis P", leaderIds: ["l2"], votes: 290, projectId: "p2" },
  { id: "v6", department: "Cundinamarca", municipality: "Bogotá", corregimiento: "Suba", puesto: "Col Suba", mesa: "010", partyId: "pa1", partyName: "Partido A", candidateId: "c3", candidateName: "Carlos M", leaderIds: ["l1", "l3"], votes: 630, projectId: "p2" }
];