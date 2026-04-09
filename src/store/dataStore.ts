import { create } from "zustand";
import { Project, VoteRecord } from "../models/types";

interface DataState {
  projects: Project[];
  selectedProject: Project | null;
  votes: VoteRecord[];
  setProjects: (p: Project[]) => void;
  setSelectedProject: (p: Project | null) => void;
  setVotes: (v: VoteRecord[]) => void;
}

export const useDataStore = create<DataState>((set) => ({
  projects: [],
  selectedProject: null,
  votes: [],
  setProjects: (p) => set({ projects: p }),
  setSelectedProject: (p) => set({ selectedProject: p }),
  setVotes: (v) => set({ votes: v })
}));