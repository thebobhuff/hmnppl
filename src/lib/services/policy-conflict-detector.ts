/**
 * Policy conflict detector.
 *
 * Analyzes policy rules for overlapping trigger+condition combinations
 * that could cause ambiguous AI evaluation. Blocks activation when
 * conflicts are detected.
 */
import type { PolicyRule, PolicyConflict } from "@/lib/validations/policy";

/**
 * Detects conflicts between rules in a policy.
 *
 * Two rules conflict when they have overlapping triggers (same incident type)
 * and could match the same incident scenario.
 */
export function detectRuleConflicts(rules: PolicyRule[]): PolicyConflict[] {
  const conflicts: PolicyConflict[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i];
      const ruleB = rules[j];

      // Check for overlapping triggers
      const overlappingTriggers = findOverlappingTriggers(ruleA.triggers, ruleB.triggers);
      if (overlappingTriggers.length > 0) {
        conflicts.push({
          rule_id_1: ruleA.id ?? `rule-${i}`,
          rule_id_2: ruleB.id ?? `rule-${j}`,
          rule_name_1: ruleA.name,
          rule_name_2: ruleB.name,
          conflict_type: "overlapping_trigger",
          description: `Rules "${ruleA.name}" and "${ruleB.name}" have overlapping triggers for: ${overlappingTriggers.join(", ")}`,
          severity: "error",
        });
      }

      // Check for contradictory actions on same trigger
      const contradictoryActions = findContradictoryActions(ruleA, ruleB);
      if (contradictoryActions) {
        conflicts.push({
          rule_id_1: ruleA.id ?? `rule-${i}`,
          rule_id_2: ruleB.id ?? `rule-${j}`,
          rule_name_1: ruleA.name,
          rule_name_2: ruleB.name,
          conflict_type: "contradictory_action",
          description: `Rules "${ruleA.name}" and "${ruleB.name}" prescribe different actions for the same scenario`,
          severity: "warning",
        });
      }
    }
  }

  return conflicts;
}

/**
 * Finds overlapping trigger types between two rule sets.
 */
function findOverlappingTriggers(
  triggersA: PolicyRule["triggers"],
  triggersB: PolicyRule["triggers"],
): string[] {
  const typesA = new Set(
    triggersA.filter((t) => t.field === "type").map((t) => String(t.value)),
  );
  const typesB = new Set(
    triggersB.filter((t) => t.field === "type").map((t) => String(t.value)),
  );

  const overlapping: string[] = [];
  for (const type of typesA) {
    if (typesB.has(type)) {
      overlapping.push(type);
    }
  }

  return overlapping;
}

/**
 * Checks if two rules with overlapping triggers have contradictory actions.
 */
function findContradictoryActions(ruleA: PolicyRule, ruleB: PolicyRule): boolean {
  const overlappingTriggers = findOverlappingTriggers(ruleA.triggers, ruleB.triggers);
  if (overlappingTriggers.length === 0) return false;

  // Check if escalation ladders conflict (same level, different action types)
  const ladderA = new Map(
    ruleA.escalation_ladder.map((step) => [step.level, step.action_type]),
  );
  const ladderB = new Map(
    ruleB.escalation_ladder.map((step) => [step.level, step.action_type]),
  );

  for (const [level, actionA] of ladderA) {
    const actionB = ladderB.get(level);
    if (actionB && actionA !== actionB) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a new policy conflicts with existing active policies.
 *
 * Compares the new policy's rules against all active policies' rules
 * to find cross-policy conflicts.
 */
export function detectCrossPolicyConflicts(
  newRules: PolicyRule[],
  existingPolicies: Array<{ id: string; title: string; rules: PolicyRule[] }>,
): Array<PolicyConflict & { existing_policy_id: string; existing_policy_title: string }> {
  const conflicts: Array<
    PolicyConflict & { existing_policy_id: string; existing_policy_title: string }
  > = [];

  for (const existingPolicy of existingPolicies) {
    for (const newRule of newRules) {
      for (const existingRule of existingPolicy.rules) {
        const overlappingTriggers = findOverlappingTriggers(
          newRule.triggers,
          existingRule.triggers,
        );

        if (overlappingTriggers.length > 0) {
          conflicts.push({
            rule_id_1: newRule.id ?? "new-rule",
            rule_id_2: existingRule.id ?? `existing-rule`,
            rule_name_1: newRule.name,
            rule_name_2: existingRule.name,
            conflict_type: "overlapping_trigger",
            description: `New rule "${newRule.name}" overlaps with "${existingRule.name}" in policy "${existingPolicy.title}"`,
            severity: "warning",
            existing_policy_id: existingPolicy.id,
            existing_policy_title: existingPolicy.title,
          });
        }
      }
    }
  }

  return conflicts;
}
