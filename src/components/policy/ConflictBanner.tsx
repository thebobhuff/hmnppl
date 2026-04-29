/**
 * ConflictBanner — Shows overlapping/conflicting policy rules.
 *
 * Used in the Policy Builder (Step 2) to surface rule conflicts
 * in real-time before attempting to activate a policy.
 */
"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface PolicyRule {
  id: string;
  name: string;
  triggerType: string;
  severity: string;
  actionType: string;
  escalationLevel: number;
  description: string;
}

export interface ConflictItem {
  type: "overlapping_trigger" | "duplicate_action" | "gap_in_escalation";
  message: string;
  affectedRules: string[];
  severity: "error" | "warning";
}

interface ConflictBannerProps {
  conflicts: ConflictItem[];
  onDismiss?: () => void;
}

export function ConflictBanner({ conflicts, onDismiss }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  const errors = conflicts.filter((c) => c.severity === "error");
  const warnings = conflicts.filter((c) => c.severity === "warning");

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Card className="border-brand-error/30 bg-brand-error/5 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-error" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-brand-error">
                  Rule Conflicts Detected
                </h4>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="text-xs text-text-tertiary hover:text-text-primary"
                  >
                    Dismiss
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                These conflicts must be resolved before the policy can be activated.
              </p>
              <ul className="mt-3 space-y-2">
                {errors.map((conflict, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-error" />
                    <span className="text-sm text-text-secondary">{conflict.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {warnings.length > 0 && (
        <Card className="border-brand-warning/30 bg-brand-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-warning" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-brand-warning">Warnings</h4>
              <ul className="mt-2 space-y-1.5">
                {warnings.map((conflict, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-warning" />
                    <span className="text-sm text-text-secondary">{conflict.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Detects conflicts between a set of rules within a single policy.
 * Checks for: duplicate triggers, overlapping severities, gaps in escalation ladder.
 */
export function detectRuleConflicts(
  rules: PolicyRule[],
  existingPolicies?: Array<{ id: string; title: string; rules: PolicyRule[] }>,
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  // 1. Check for duplicate trigger+severity combinations
  const triggerSeverityMap = new Map<string, string[]>();
  for (const rule of rules) {
    const key = `${rule.triggerType}::${rule.severity}`;
    if (!triggerSeverityMap.has(key)) {
      triggerSeverityMap.set(key, []);
    }
    triggerSeverityMap.get(key)!.push(rule.name || rule.id);
  }

  for (const [key, ruleIds] of triggerSeverityMap) {
    if (ruleIds.length > 1) {
      const [triggerType, severity] = key.split("::");
      conflicts.push({
        type: "overlapping_trigger",
        message: `Multiple rules (${ruleIds.join(", ")}) respond to ${triggerType} at ${severity} severity. Only the highest escalation level will apply.`,
        affectedRules: ruleIds,
        severity: "error",
      });
    }
  }

  // 2. Check for missing escalation levels (gaps)
  const levels = rules.map((r) => r.escalationLevel).filter((l) => l > 0).sort((a, b) => a - b);
  if (levels.length > 1) {
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        const missingLevels: number[] = [];
        for (let l = levels[i - 1] + 1; l < levels[i]; l++) {
          missingLevels.push(l);
        }
        conflicts.push({
          type: "gap_in_escalation",
          message: `Escalation gap: no rule defined for level(s) ${missingLevels.join(", ")}. Employees progressing through these levels will not have matching rules.`,
          affectedRules: [],
          severity: "warning",
        });
      }
    }
  }

  // 3. Check for overlapping trigger types across existing policies
  if (existingPolicies && existingPolicies.length > 0) {
    const newTriggers = new Set(rules.map((r) => r.triggerType));
    for (const policy of existingPolicies) {
      for (const newRule of rules) {
        for (const existingRule of policy.rules) {
          if (
            newRule.triggerType === existingRule.triggerType &&
            newRule.severity === existingRule.severity
          ) {
            conflicts.push({
              type: "overlapping_trigger",
              message: `Rule "${newRule.name || newRule.id}" overlaps with policy "${policy.title}" (rule: ${existingRule.name || existingRule.id}). Both policies may respond to the same incident.`,
              affectedRules: [newRule.name || newRule.id, existingRule.name || existingRule.id],
              severity: "error",
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Returns a plain English explanation of what a set of rules means for AI evaluation.
 */
export function generatePlainEnglishSummary(rules: PolicyRule[], threshold: number): string {
  if (rules.length === 0) {
    return "This policy has no rules defined. It will not be used for AI evaluation.";
  }

  const sortedRules = [...rules].sort((a, b) => a.escalationLevel - b.escalationLevel);

  const sentences: string[] = [];

  sentences.push(
    `When a manager reports an incident, the AI will check if it matches any of ${rules.length} rule(s) defined in this policy.`,
  );

  const levelMap: Record<number, string> = {
    1: "first offense (verbal warning)",
    2: "second offense (written warning)",
    3: "third offense (PIP)",
    4: "fourth offense (termination review)",
  };

  const triggerDescriptions: Record<string, string> = {
    tardiness: "late arrivals or early departures",
    absence: "unexcused absences or no-call/no-shows",
    insubordination: "refusal to follow management instructions",
    performance: "failing to meet performance standards",
    misconduct: "inappropriate workplace behavior",
    policy_violation: "breaches of company policy",
    safety_violation: "unsafe work practices",
    harassment: "harassment or discrimination",
    violence: "threats or physical harm",
  };

  for (const rule of sortedRules) {
    const level = rule.escalationLevel;
    const trigger = triggerDescriptions[rule.triggerType] ?? rule.triggerType;
    const severity = rule.severity;
    const consequence = levelMap[level] ?? `level ${level} (${rule.actionType.replace(/_/g, " ")})`;

    sentences.push(
      `For ${trigger} at ${severity} severity, the AI will recommend ${consequence}.`,
    );
  }

  sentences.push(
    `AI will auto-generate a disciplinary document only when its confidence score is at least ${threshold}%. Below this threshold, the case goes to HR for manual review.`,
  );

  return sentences.join(" ");
}