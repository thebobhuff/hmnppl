// ============================================
// HMN — Breakpoint Hook
// Responsive breakpoint detection
// ============================================

"use client";

import { useState, useEffect } from "react";
import type { Breakpoint } from "@/types";

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
} as const;

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.laptop) return "laptop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    // Set initial breakpoint on mount
    setBreakpoint(getBreakpoint(window.innerWidth));

    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    // Debounce resize events for performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoint;
}

/**
 * Returns true when the viewport matches the given breakpoint or wider.
 */
export function useIsAboveBreakpoint(bp: Breakpoint): boolean {
  const current = useBreakpoint();
  const order: Breakpoint[] = ["mobile", "tablet", "laptop", "desktop"];
  return order.indexOf(current) >= order.indexOf(bp);
}
