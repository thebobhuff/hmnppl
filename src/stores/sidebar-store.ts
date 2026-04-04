// ============================================
// HMN — Sidebar Store (Zustand)
// Persists collapsed state to localStorage
// ============================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  /** Whether the sidebar is collapsed (desktop/laptop) */
  collapsed: boolean;
  /** Whether the mobile drawer is open */
  mobileOpen: boolean;
  /** Whether the laptop hover-expanded state is active */
  hoverExpanded: boolean;

  // Actions
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
  setHoverExpanded: (expanded: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      hoverExpanded: false,

      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),

      setCollapsed: (collapsed) => set({ collapsed }),

      toggleMobileOpen: () => set((state) => ({ mobileOpen: !state.mobileOpen })),

      setMobileOpen: (mobileOpen) => set({ mobileOpen }),

      setHoverExpanded: (hoverExpanded) => set({ hoverExpanded }),
    }),
    {
      name: "hmn-sidebar",
      // Only persist the collapsed state, not transient UI state
      partialize: (state) => ({ collapsed: state.collapsed }),
    },
  ),
);
