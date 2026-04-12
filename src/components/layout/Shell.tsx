// ============================================
// HMN — Shell Component
// Top-level layout wrapper for authenticated pages
// Composes Sidebar + Header + main content area
// ============================================

"use client";

import { ConversationalHelpdesk } from "@/components/domain/ConversationalHelpdesk";
import { BreadcrumbProvider } from "@/hooks/use-breadcrumbs";
import { usersAPI } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * Authenticated app shell.
 * Wraps all pages that require a logged-in user.
 *
 * Usage:
 * ```tsx
 * // In layout.tsx
 * <Shell>
 *   {children}
 * </Shell>
 * ```
 *
 * Pages set breadcrumbs via usePageBreadcrumbs hook:
 * ```tsx
 * usePageBreadcrumbs([
 *   { label: "Home", href: "/dashboard" },
 *   { label: "Team" },
 * ])
 * ```
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;

    async function hydrateUser() {
      try {
        const data = await usersAPI.me();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    }

    hydrateUser();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return (
    <BreadcrumbProvider>
      <div className="min-h-screen bg-page">
        <Sidebar />
        <Header />
        {children}
        <ConversationalHelpdesk />
      </div>
    </BreadcrumbProvider>
  );
}
