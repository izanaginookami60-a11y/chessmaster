import { create } from "zustand";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/types/user";

interface AuthState {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean; // true until the first onAuthStateChanged fires
  setFirebaseUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  isLoading: true,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ firebaseUser: null, profile: null, isLoading: false }),
}));
