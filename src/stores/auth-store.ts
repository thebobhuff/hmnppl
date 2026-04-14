import { create } from "zustand";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** Role override for Company Admins switching views */
  effectiveRole: UserRole | null;

  // Actions
  setUser: (user: User | null) => void;
  setEffectiveRole: (role: UserRole | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  effectiveRole: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setEffectiveRole: (role) => set({ effectiveRole: role }),

  logout: () => set({ user: null, isAuthenticated: false, effectiveRole: null }),
}));
