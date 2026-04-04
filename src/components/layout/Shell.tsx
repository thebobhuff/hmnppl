// ============================================
// HMN — Shell Component
// Top-level layout wrapper for authenticated pages
// Composes Sidebar + Header + main content area
// ============================================

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { BreadcrumbProvider } from "@/hooks/use-breadcrumbs";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginAs = useAuthStore((s) => s.loginAs);

  // Auto-login for development (will be replaced by Supabase auth guard)
  useEffect(() => {
    if (!isAuthenticated) {
      loginAs("COMPANY_ADMIN");
    }
  }, [isAuthenticated, loginAs]);

  return (
    <BreadcrumbProvider>
      <div className="min-h-screen bg-page">
        <Sidebar />
        <Header />
        {children}
      </div>
    </BreadcrumbProvider>
  );
}
