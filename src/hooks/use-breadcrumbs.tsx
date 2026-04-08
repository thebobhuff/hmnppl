// ============================================
// HMN — Breadcrumb Context
// Allows pages to set breadcrumbs that appear in the Header
// ============================================

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { BreadcrumbItem } from "@/types";

interface BreadcrumbContextValue {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/** Read breadcrumbs and the setter from context */
export function useBreadcrumbs() {
  return useContext(BreadcrumbContext);
}

/**
 * Declarative hook: set breadcrumbs from a page component.
 * Automatically clears breadcrumbs on unmount.
 *
 * @example
 * usePageBreadcrumbs([
 *   { label: "Home", href: "/dashboard" },
 *   { label: "Team" },
 * ])
 */
export function usePageBreadcrumbs(items: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useBreadcrumbs();

  const itemsJson = JSON.stringify(items);

  useEffect(() => {
    setBreadcrumbs(items);
    return () => setBreadcrumbs([]);
  }, [itemsJson, setBreadcrumbs]);
}
