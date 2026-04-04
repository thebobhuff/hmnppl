"""Policy Engine — deterministic rule matching for incident evaluation.

This module performs DETERMINISTIC rule matching (code, not LLM).
The LLM only generates document text and confidence assessment given a matched rule.
This prevents the LLM from "deciding" which rule applies.

Architecture:
  1. Load active company policies with structured JSONB rules
  2. Match incident against rules using deterministic logic
  3. Return matched rule + escalation context
  4. LLM generates recommendation text based on matched rule
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def match_policy_rules(
    incident_type: str,
    incident_severity: str,
    previous_incident_count: int,
    policies: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """Match an incident against active company policy rules.

    Args:
        incident_type: The type of incident (e.g., "tardiness", "absence")
        incident_severity: Severity level (low, medium, high, critical)
        previous_incident_count: Number of prior incidents for this employee
        policies: List of active policy dicts with rules JSONB

    Returns:
        Matched rule info with escalation level, or None if no match
    """
    for policy in policies:
        rules = policy.get("rules", [])
        if not isinstance(rules, list):
            continue

        for rule in rules:
            if _rule_matches(
                rule=rule,
                incident_type=incident_type,
                incident_severity=incident_severity,
                previous_incident_count=previous_incident_count,
            ):
                escalation_level = _calculate_escalation(
                    rule=rule,
                    previous_incident_count=previous_incident_count,
                )

                return {
                    "policy_id": policy["id"],
                    "policy_title": policy.get("title", "Unknown Policy"),
                    "policy_category": policy.get("category", "general"),
                    "rule_id": rule.get("id", "unknown"),
                    "rule_name": rule.get("name", "Unknown Rule"),
                    "escalation_level": escalation_level,
                    "actions": rule.get("actions", []),
                    "escalation_ladder": rule.get("escalation_ladder", []),
                }

    return None


def _rule_matches(
    rule: dict[str, Any],
    incident_type: str,
    incident_severity: str,
    previous_incident_count: int,
) -> bool:
    """Check if a single rule matches the incident."""
    triggers = rule.get("triggers", [])
    conditions = rule.get("conditions", [])

    # Check triggers — at least one must match
    trigger_matched = False
    for trigger in triggers:
        if _trigger_matches(
            trigger, incident_type, incident_severity, previous_incident_count
        ):
            trigger_matched = True
            break

    if not trigger_matched:
        return False

    # Check conditions — all must match
    for condition in conditions:
        if not _condition_matches(
            condition, incident_type, incident_severity, previous_incident_count
        ):
            return False

    return True


def _trigger_matches(
    trigger: dict[str, Any],
    incident_type: str,
    incident_severity: str,
    previous_incident_count: int,
) -> bool:
    """Check if a single trigger matches the incident."""
    field = trigger.get("field", "")
    operator = trigger.get("operator", "")
    value = trigger.get("value")

    # Get the actual value from the incident context
    if field == "type":
        actual_value = incident_type
    elif field == "severity":
        actual_value = incident_severity
    elif field == "previous_incident_count":
        actual_value = previous_incident_count
    else:
        return False

    return _compare(actual_value, operator, value)


def _condition_matches(
    condition: dict[str, Any],
    incident_type: str,
    incident_severity: str,
    previous_incident_count: int,
) -> bool:
    """Check if a single condition is satisfied."""
    field = condition.get("field", "")
    operator = condition.get("operator", "")
    value = condition.get("value")

    if field == "type":
        actual_value = incident_type
    elif field == "severity":
        actual_value = incident_severity
    elif field == "previous_incident_count":
        actual_value = previous_incident_count
    else:
        return True  # Unknown condition fields pass by default

    return _compare(actual_value, operator, value)


def _compare(actual: Any, operator: str, expected: Any) -> bool:
    """Compare values using the specified operator."""
    if operator == "equals":
        return str(actual).lower() == str(expected).lower()
    elif operator == "not_equals":
        return str(actual).lower() != str(expected).lower()
    elif operator == "contains":
        return str(expected).lower() in str(actual).lower()
    elif operator == "greater_than":
        try:
            return float(actual) > float(expected)
        except (ValueError, TypeError):
            return False
    elif operator == "less_than":
        try:
            return float(actual) < float(expected)
        except (ValueError, TypeError):
            return False
    elif operator == "in":
        if isinstance(expected, list):
            return str(actual).lower() in [str(v).lower() for v in expected]
        return False
    return False


def _calculate_escalation(
    rule: dict[str, Any],
    previous_incident_count: int,
) -> int:
    """Calculate the escalation level based on the rule and incident history."""
    ladder = rule.get("escalation_ladder", [])
    if not ladder:
        return 1

    # Map previous incidents to escalation level
    # 0 priors → level 1, 1 prior → level 2, etc.
    escalation_index = min(previous_incident_count, len(ladder) - 1)
    return ladder[escalation_index].get("level", escalation_index + 1)


def get_action_type_for_escalation(
    escalation_ladder: list[dict[str, Any]],
    escalation_level: int,
) -> str:
    """Get the action type for a specific escalation level."""
    for step in escalation_ladder:
        if step.get("level") == escalation_level:
            return step.get("action_type", "verbal_warning")

    # Default to first level if not found
    return (
        escalation_ladder[0].get("action_type", "verbal_warning")
        if escalation_ladder
        else "verbal_warning"
    )
