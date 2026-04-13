import { create } from "zustand";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import type { User } from "firebase/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, pass) => {
    await signInWithEmailAndPassword(auth, email, pass);
    set({ loading: false });
  },
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
  init: () => {
    onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
  }
}));