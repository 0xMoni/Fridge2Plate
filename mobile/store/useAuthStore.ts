import { create } from 'zustand';
import type { User } from '../types';
import { signIn, signUp, signOutUser } from '../services/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, loading: false }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signIn(email, password);
      // User state will be set by onAuthStateChanged listener
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign in';
      set({ error: message, loading: false });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      await signUp(email, password, displayName);
      // User state will be set by onAuthStateChanged listener
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOutUser();
      set({ user: null, loading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign out';
      set({ error: message, loading: false });
    }
  },

  clearError: () => set({ error: null }),

  setLoading: (loading) => set({ loading }),
}));
