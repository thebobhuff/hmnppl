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
  useMemo,
  type ReactNode,
} from "react";
import type { BreadcrumbItem } from "@/types";

function areBreadcrumbsEqual(a: BreadcrumbItem[], b: BreadcrumbItem[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (a[index]?.label !== b[index]?.label || a[index]?.href !== b[index]?.href) {
      return false;
    }
  }

  return true;
}

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
    setBreadcrumbsState((current) =>
      areBreadcrumbsEqual(current, items) ? current : items,
    );
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
  const itemsKey = useMemo(
    () => JSON.stringify(items.map(({ label, href }) => ({ label, href }))),
    [items],
  );

  useEffect(() => {
    setBreadcrumbs(items);
  }, [itemsKey, items, setBreadcrumbs]);

  useEffect(() => {
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);
}
