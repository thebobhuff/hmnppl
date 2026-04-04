// ============================================
// HMN — Onboarding Page Client
// "use client" wrapper to handle hydration for
// Zustand persisted state
// ============================================

"use client";

import { useEffect, useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client component that wraps the OnboardingWizard.
 * Handles hydration mismatch from Zustand persist by deferring
 * render until the client has mounted.
 */
export function OnboardingPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Show skeleton while Zustand rehydrates from localStorage
    return (
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Logo skeleton */}
        <div className="text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto mt-2 h-4 w-64" />
        </div>

        {/* Step indicator skeleton */}
        <div className="flex items-center justify-between gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Progress bar skeleton */}
        <Skeleton className="h-2 w-full rounded-full" />

        {/* Content card skeleton */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <OnboardingWizard />;
}
