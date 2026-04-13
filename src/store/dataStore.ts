import { create } from "zustand";
import type { Project, VoteRecord } from "../models/types";
import { mockProjects, mockVotes } from "../data/mockData";
import { getProjects, getVotesByProject, getVotesFiltered } from "../services/firestoreService";

export interface FilterState {
  department?: string;
  municipality?: string;
  partyId?: string;
  candidateId?: string;
}

interface DataState {
  projects: Project[];
  selectedProject: Project | null;
  votes: VoteRecord[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
  previousVotes: VoteRecord[];

  setProjects: (p: Project[]) => void;
  setSelectedProject: (p: Project | null) => void;
  setVotes: (v: VoteRecord[]) => void;
  setFilters: (f: Partial<FilterState>) => void;
  
  loadMockData: () => void;
  loadFirestoreProjects: () => Promise<void>;
  loadFirestoreVotes: (projectId: string) => Promise<void>;
  loadFilteredVotes: (projectId: string, filters: FilterState) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  projects: [],
  selectedProject: null,
  votes: [],
  loading: false,
  error: null,
  filters: {},
  previousVotes: [],

  setProjects: (p) => set({ projects: p, error: null }),
  setSelectedProject: (p) => set({ selectedProject: p, error: null, filters: {} }),
  setVotes: (v) => set({ votes: v, error: null }),
  setFilters: (f) => set(state => ({ filters: { ...state.filters, ...f } })),
  setPreviousVotes: (v: VoteRecord[]) => set({ previousVotes: v }),

  loadMockData: () => set({ 
    projects: mockProjects, 
    selectedProject: mockProjects[0], 
    votes: mockVotes,
    loading: false, 
    error: null 
  }),

  loadFirestoreProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await getProjects();
      set({ projects, loading: false });
      const current = get().selectedProject;
      if (!current && projects.length > 0) set({ selectedProject: projects[0] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar proyectos";
      set({ error: message, loading: false });
    }
  },

  loadFirestoreVotes: async (projectId: string) => {
    set({ loading: true, error: null, filters: {} });
    try {
      const votes = await getVotesByProject(projectId);
      set({ votes, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar votos";
      set({ error: message, loading: false });
    }
  },

  loadFilteredVotes: async (projectId: string, filters: FilterState) => {
    set({ loading: true, error: null });
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "")
      );
      const votes = await getVotesFiltered(projectId, cleanFilters as Parameters<typeof getVotesFiltered>[1]);
      set({ votes, loading: false, filters });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error aplicando filtros";
      set({ error: message, loading: false });
    }
  }
}));