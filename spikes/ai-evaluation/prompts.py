"""Prompt templates and response schemas for AI HR Platform spike.

This module defines:
- System templates for each AI task
- Prompt builder functions that construct the messages array
- JSON Schema definitions for response validation

These templates are designed to be copied into the production service at
``server/app/services/ai/prompts.py`` after the spike is approved.
"""

from __future__ import annotations

import json
from typing import Any

# ---------------------------------------------------------------------------
# Prompt versioning
# ---------------------------------------------------------------------------

PROMPT_VERSIONS: dict[str, str] = {
    "evaluate_incident": "1.0.0",
    "generate_document": "1.0.0",
}

# ---------------------------------------------------------------------------
# System templates (immutable, server-controlled)
# ---------------------------------------------------------------------------

SYSTEM_TEMPLATE_EVALUATE = (
    "You are an HR discipline evaluation engine. "
    "Evaluate the incident against the provided policy rules. "
    "Match the incident and employee context to the FIRST policy rule "
    "whose trigger type and ALL conditions are satisfied. "
    'If no rule matches, set matched_rule to "no_action" and escalation_level to 0. '
    "Output ONLY valid JSON matching the response_schema provided in the user message. "
    "Do not include markdown fences, explanations, or any text outside the JSON object."
)

SYSTEM_TEMPLATE_DOCUMENT = (
    "You are an HR document generation engine. "
    "Generate a professional, legally-appropriate HR document based on the "
    "action type, incident details, employee context, and matched policy rule. "
    "Use formal business tone. Do not include any legally binding language "
    "that could constitute legal advice. "
    "Output ONLY valid JSON matching the response_schema provided in the user message. "
    "Do not include markdown fences, explanations, or any text outside the JSON object."
)

# ---------------------------------------------------------------------------
# Response schemas (JSON Schema)
# ---------------------------------------------------------------------------

EVALUATION_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "matched_rule",
        "escalation_level",
        "action_type",
        "confidence",
        "reasoning",
        "policy_rule_index",
    ],
    "properties": {
        "matched_rule": {
            "type": "string",
            "description": "The action type of the matched policy rule, or 'no_action'",
        },
        "escalation_level": {
            "type": "integer",
            "minimum": 0,
            "description": "Discipline escalation level (0 = no action)",
        },
        "action_type": {
            "type": "string",
            "enum": [
                "verbal_warning",
                "written_warning",
                "suspension",
                "termination",
                "no_action",
                "pip_review",
            ],
        },
        "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Model confidence score 0-100",
        },
        "reasoning": {
            "type": "string",
            "description": "Brief explanation of why this rule was matched",
        },
        "policy_rule_index": {
            "type": "integer",
            "minimum": -1,
            "description": "0-based index of the matched rule in policy_rules array, or -1 if no match",
        },
    },
    "additionalProperties": False,
}

DOCUMENT_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "document_content",
        "document_type",
        "placeholders_filled",
    ],
    "properties": {
        "document_content": {
            "type": "string",
            "description": "Full generated document text",
        },
        "document_type": {
            "type": "string",
            "enum": [
                "verbal_warning",
                "written_warning",
                "suspension_notice",
                "termination_letter",
                "pip_notice",
                "coaching_memo",
            ],
        },
        "placeholders_filled": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of template variables that were populated",
        },
        "warnings": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Non-fatal issues during generation",
        },
        "tone_score": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "How well the document matches expected professional tone",
        },
    },
    "additionalProperties": False,
}

# ---------------------------------------------------------------------------
# PII scrubbing
# ---------------------------------------------------------------------------

PII_FIELDS: set[str] = {
    "name",
    "employee_name",
    "email",
    "manager_name",
    "employee_id",
}

_pii_map: dict[str, str] = {}


def _scrub_pii(data: dict | list | str | Any) -> Any:
    """Recursively replace PII fields with placeholders.

    Populates the module-level ``_pii_map`` so that :func:`_restore_pii`
    can reverse the substitution later.

    NOTE: This is a simplified spike implementation. Production code should
    use a request-scoped PII map (not a module global) to avoid cross-request
    leaks.
    """
    if isinstance(data, dict):
        scrubbed: dict[str, Any] = {}
        for key, value in data.items():
            if key in PII_FIELDS and isinstance(value, str):
                placeholder = f"[{key.upper()}]"
                _pii_map[placeholder] = value
                scrubbed[key] = placeholder
            elif isinstance(value, (dict, list)):
                scrubbed[key] = _scrub_pii(value)
            else:
                scrubbed[key] = value
        return scrubbed
    elif isinstance(data, list):
        return [_scrub_pii(item) if isinstance(item, dict) else item for item in data]
    return data


def _restore_pii(text: str) -> str:
    """Replace placeholders with real PII values."""
    result = text
    for placeholder, real_value in _pii_map.items():
        result = result.replace(placeholder, real_value)
    return result


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------


def build_evaluation_prompt(
    incident: dict[str, Any],
    employee: dict[str, Any],
    policy_rules: list[dict[str, Any]],
) -> list[dict[str, str]]:
    """Build the messages array for the incident evaluation endpoint.

    Parameters
    ----------
    incident:
        Dict with keys ``type``, ``severity``, ``description``, ``incident_date``.
    employee:
        Dict with keys ``name``, ``prior_incidents``, ``has_active_pip``.
    policy_rules:
        List of policy rule objects with ``trigger``, ``conditions``, ``action``.

    Returns
    -------
    list[dict[str, str]]
        Messages array suitable for the OpenRouter chat completion API.
    """
    _pii_map.clear()  # Reset for this request

    scrubbed_incident = _scrub_pii(incident)
    scrubbed_employee = _scrub_pii(employee)
    # Policy rules don't contain PII but scrub for safety
    scrubbed_rules = _scrub_pii(policy_rules)

    user_payload = json.dumps(
        {
            "incident": scrubbed_incident,
            "employee_context": {
                "prior_incidents": scrubbed_employee.get("prior_incidents", 0),
                "has_active_pip": scrubbed_employee.get("has_active_pip", False),
            },
            "policy_rules": scrubbed_rules,
            "response_schema": EVALUATION_RESPONSE_SCHEMA,
        },
        indent=2,
    )

    return [
        {"role": "system", "content": SYSTEM_TEMPLATE_EVALUATE},
        {"role": "user", "content": user_payload},
    ]


def build_document_prompt(
    action_type: str,
    incident: dict[str, Any],
    employee: dict[str, Any],
    matched_policy: dict[str, Any],
) -> list[dict[str, str]]:
    """Build the messages array for the document generation endpoint.

    Parameters
    ----------
    action_type:
        The discipline action type (e.g. ``"verbal_warning"``).
    incident:
        The original incident dict.
    employee:
        The employee context dict.
    matched_policy:
        The policy rule that was matched during evaluation.

    Returns
    -------
    list[dict[str, str]]
        Messages array for the OpenRouter chat completion API.
    """
    _pii_map.clear()

    user_payload = json.dumps(
        {
            "action_type": action_type,
            "incident": _scrub_pii(incident),
            "employee_context": {
                "prior_incidents": employee.get("prior_incidents", 0),
                "has_active_pip": employee.get("has_active_pip", False),
            },
            "matched_policy": _scrub_pii(matched_policy),
            "response_schema": DOCUMENT_RESPONSE_SCHEMA,
        },
        indent=2,
    )

    return [
        {"role": "system", "content": SYSTEM_TEMPLATE_DOCUMENT},
        {"role": "user", "content": user_payload},
    ]


# ---------------------------------------------------------------------------
# Schema validation helper
# ---------------------------------------------------------------------------


def validate_evaluation_response(raw: str) -> dict[str, Any]:
    """Parse and validate an evaluation response string.

    Returns the parsed dict if valid, or raises ``ValueError``.
    """
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in AI response: {exc}") from exc

    # Basic structural validation
    required_keys = set(EVALUATION_RESPONSE_SCHEMA["required"])
    missing = required_keys - set(parsed.keys())
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    # Validate confidence range
    confidence = parsed.get("confidence", 0)
    if not (0 <= confidence <= 100):
        raise ValueError(f"Confidence {confidence} out of range [0, 100]")

    # Validate action_type enum
    valid_actions = EVALUATION_RESPONSE_SCHEMA["properties"]["action_type"]["enum"]
    if parsed.get("action_type") not in valid_actions:
        raise ValueError(
            f"Invalid action_type '{parsed.get('action_type')}'. "
            f"Expected one of: {valid_actions}"
        )

    return parsed


def validate_document_response(raw: str) -> dict[str, Any]:
    """Parse and validate a document generation response string.

    Returns the parsed dict if valid, or raises ``ValueError``.
    """
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in AI response: {exc}") from exc

    required_keys = set(DOCUMENT_RESPONSE_SCHEMA["required"])
    missing = required_keys - set(parsed.keys())
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    valid_types = DOCUMENT_RESPONSE_SCHEMA["properties"]["document_type"]["enum"]
    if parsed.get("document_type") not in valid_types:
        raise ValueError(
            f"Invalid document_type '{parsed.get('document_type')}'. "
            f"Expected one of: {valid_types}"
        )

    return parsed
