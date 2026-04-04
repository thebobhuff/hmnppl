/**
 * Feature Flags — centralized toggle system for gradual rollout.
 *
 * Supports:
 *   - Boolean flags (on/off)
 *   - Percentage rollout (A/B testing)
 *   - User-targeted flags (specific users/roles)
 *
 * Flags are evaluated client-side for UI features and server-side
 * for API behavior. In production, flags would be fetched from
 * Supabase or a feature flag service (LaunchDarkly, Unleash).
 */

"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatureFlag {
  /** Unique flag key */
  key: string;
  /** Human-readable description */
  description: string;
  /** Whether the flag is enabled globally */
  enabled: boolean;
  /** If set, only users in this list can access the feature */
  allowedUsers?: string[];
  /** If set, only users with these roles can access the feature */
  allowedRoles?: string[];
  /** If set, percentage of users who see the feature (0-100) */
  rolloutPercentage?: number;
}

// ---------------------------------------------------------------------------
// Default Flags
// ---------------------------------------------------------------------------

export const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: "ai_auto_generate",
    description: "Auto-generate disciplinary documents when AI confidence exceeds threshold",
    enabled: true,
    allowedRoles: ["company_admin", "hr_agent"],
  },
  {
    key: "employee_disputes",
    description: "Allow employees to dispute signed documents",
    enabled: true,
  },
  {
    key: "ai_meeting_summaries",
    description: "Generate AI summaries after disciplinary meetings",
    enabled: true,
    rolloutPercentage: 80,
  },
  {
    key: "progressive_discipline",
    description: "Enforce progressive discipline ladder automatically",
    enabled: true,
    allowedRoles: ["company_admin", "hr_agent"],
  },
  {
    key: "microsoft_sso",
    description: "Microsoft Azure AD single sign-on",
    enabled: false,
  },
  {
    key: "ai_cost_alerts",
    description: "Send budget alerts when AI spending exceeds thresholds",
    enabled: true,
    allowedRoles: ["super_admin", "company_admin"],
  },
  {
    key: "new_dashboard",
    description: "New role-adaptive dashboard layout",
    enabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "notification_center",
    description: "In-app notification bell and dropdown",
    enabled: true,
    rolloutPercentage: 100,
  },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FeatureFlagsContextValue {
  flags: FeatureFlag[];
  isEnabled: (key: string, userId?: string, userRole?: string) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: DEFAULT_FLAGS,
  isEnabled: () => false,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function FeatureFlagsProvider({
  children,
  flags = DEFAULT_FLAGS,
}: {
  children: ReactNode;
  flags?: FeatureFlag[];
}) {
  const value = useMemo(() => {
    const flagMap = new Map(flags.map((f) => [f.key, f]));

    function isEnabled(key: string, userId?: string, userRole?: string): boolean {
      const flag = flagMap.get(key);
      if (!flag) return false;
      if (!flag.enabled) return false;

      // Role check
      if (flag.allowedRoles?.length && userRole && !flag.allowedRoles.includes(userRole)) {
        return false;
      }

      // User allowlist
      if (flag.allowedUsers?.length && userId && !flag.allowedUsers.includes(userId)) {
        return false;
      }

      // Rollout percentage (deterministic based on user ID)
      if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
        if (!userId) return false;
        const hash = simpleHash(userId);
        const bucket = hash % 100;
        return bucket < flag.rolloutPercentage;
      }

      return true;
    }

    return { flags, isEnabled };
  }, [flags]);

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFeatureFlag(key: string): boolean {
  const { isEnabled } = useContext(FeatureFlagsContext);
  // In production, pass userId and userRole from auth context
  return isEnabled(key);
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

// ---------------------------------------------------------------------------
// Guard Component
// ---------------------------------------------------------------------------

export function FeatureGuard({
  flag,
  fallback = null,
  children,
}: {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const enabled = useFeatureFlag(flag);
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple hash function for deterministic user bucketing */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
