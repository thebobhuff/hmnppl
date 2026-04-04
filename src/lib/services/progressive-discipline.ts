/**
 * Progressive Discipline Enforcement — server-side rule engine.
 *
 * Ensures that disciplinary actions follow the progressive discipline ladder:
 *   1. Verbal Warning
 *   2. Written Warning
 *   3. Performance Improvement Plan (PIP)
 *   4. Termination Review
 *
 * Blocks skipping steps unless explicitly overridden by HR with justification.
 * Tracks cooling-off periods between escalation levels.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DisciplineLevel =
  | "verbal_warning"
  | "written_warning"
  | "pip"
  | "termination_review";

export const DISCIPLINE_LADDER: DisciplineLevel[] = [
  "verbal_warning",
  "written_warning",
  "pip",
  "termination_review",
];

export const COOLING_OFF_PERIODS: Record<DisciplineLevel, number> = {
  verbal_warning: 30, // days before next escalation
  written_warning: 60,
  pip: 90,
  termination_review: 0,
};

export interface DisciplineCheck {
  allowed: boolean;
  currentLevel: DisciplineLevel | null;
  recommendedLevel: DisciplineLevel;
  coolingOffRemaining: number;
  requiresJustification: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Core Logic
// ---------------------------------------------------------------------------

/**
 * Checks if a proposed disciplinary action is allowed under progressive discipline rules.
 *
 * @param companyId - The company ID
 * @param employeeId - The employee ID
 * @param proposedAction - The proposed disciplinary action type
 * @returns DisciplineCheck result with recommendation and any blockers
 */
export async function checkProgressiveDiscipline(
  companyId: string,
  employeeId: string,
  proposedAction: DisciplineLevel,
): Promise<DisciplineCheck> {
  const supabase = createAdminClient();

  // 1. Get all past disciplinary actions for this employee
  const { data: pastActions, error } = await supabase
    .from("disciplinary_actions")
    .select("id, action_type, status, created_at, resolved_at")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to check discipline history: ${error.message}`);
  }

  // 2. Determine current level
  const resolvedActions =
    pastActions?.filter((a) => a.status === "approved" || a.status === "resolved") ?? [];
  const currentLevel =
    resolvedActions.length > 0
      ? (resolvedActions[0].action_type as DisciplineLevel)
      : null;

  const currentLevelIndex = currentLevel ? DISCIPLINE_LADDER.indexOf(currentLevel) : -1;
  const proposedLevelIndex = DISCIPLINE_LADDER.indexOf(proposedAction);

  // 3. Check if skipping steps
  const requiresJustification = proposedLevelIndex > currentLevelIndex + 1;

  // 4. Check cooling-off period
  let coolingOffRemaining = 0;
  if (currentLevel && resolvedActions.length > 0) {
    const lastActionDate = new Date(
      resolvedActions[0].resolved_at ?? resolvedActions[0].created_at,
    );
    const coolingPeriod = COOLING_OFF_PERIODS[currentLevel];
    const coolingEnd = new Date(lastActionDate);
    coolingEnd.setDate(coolingEnd.getDate() + coolingPeriod);

    const now = new Date();
    if (now < coolingEnd) {
      coolingOffRemaining = Math.ceil(
        (coolingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    }
  }

  // 5. Determine recommendation
  const recommendedLevel = currentLevel
    ? DISCIPLINE_LADDER[Math.min(currentLevelIndex + 1, DISCIPLINE_LADDER.length - 1)]
    : "verbal_warning";

  // 6. Build result
  const result: DisciplineCheck = {
    allowed: true,
    currentLevel,
    recommendedLevel,
    coolingOffRemaining,
    requiresJustification,
  };

  // Block if trying to skip steps without justification
  if (requiresJustification) {
    result.allowed = false;
    result.reason = `Cannot skip from ${currentLevel?.replace(/_/g, " ") ?? "no prior actions"} to ${proposedAction.replace(/_/g, " ")}. Must follow progressive discipline ladder. Recommended: ${recommendedLevel.replace(/_/g, " ")}.`;
  }

  // Warn if still in cooling-off period
  if (coolingOffRemaining > 0 && !requiresJustification) {
    result.reason = `Still within cooling-off period (${coolingOffRemaining} days remaining). Recommended to wait or provide justification.`;
  }

  return result;
}

/**
 * Gets the next recommended discipline level based on employee history.
 */
export async function getNextDisciplineLevel(
  companyId: string,
  employeeId: string,
): Promise<{ level: DisciplineLevel; incidentCount: number }> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("disciplinary_actions")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("status", "approved");

  const incidentCount = count ?? 0;
  const levelIndex = Math.min(incidentCount, DISCIPLINE_LADDER.length - 1);

  return {
    level: DISCIPLINE_LADDER[levelIndex],
    incidentCount,
  };
}
