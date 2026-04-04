// ============================================
// HMN — Auth Store (Zustand)
// Temporary mock store; will be replaced with Supabase auth
// ============================================

import { create } from "zustand";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  /** Development helper: simulate login with a role */
  loginAs: (role: UserRole) => void;
  logout: () => void;
}

const MOCK_USERS: Record<UserRole, User> = {
  SUPER_ADMIN: {
    id: "usr_sa001",
    email: "superadmin@platform.hr",
    firstName: "Sarah",
    lastName: "Chen",
    role: "SUPER_ADMIN",
  },
  COMPANY_ADMIN: {
    id: "usr_ca001",
    email: "admin@acme.com",
    firstName: "James",
    lastName: "Wilson",
    role: "COMPANY_ADMIN",
    tenantId: "tenant_acme",
    tenantName: "Acme Corp",
  },
  HR_AGENT: {
    id: "usr_hr001",
    email: "maria@acme.com",
    firstName: "Maria",
    lastName: "Garcia",
    role: "HR_AGENT",
    tenantId: "tenant_acme",
    tenantName: "Acme Corp",
  },
  MANAGER: {
    id: "usr_mg001",
    email: "david@acme.com",
    firstName: "David",
    lastName: "Park",
    role: "MANAGER",
    tenantId: "tenant_acme",
    tenantName: "Acme Corp",
  },
  EMPLOYEE: {
    id: "usr_em001",
    email: "alex@acme.com",
    firstName: "Alex",
    lastName: "Johnson",
    role: "EMPLOYEE",
    tenantId: "tenant_acme",
    tenantName: "Acme Corp",
  },
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  loginAs: (role) => set({ user: MOCK_USERS[role], isAuthenticated: true }),

  logout: () => set({ user: null, isAuthenticated: false }),
}));
