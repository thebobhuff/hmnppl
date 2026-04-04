"""Output Validator — validates AI responses against expected schemas.

Ensures AI-generated outputs:
  - Match expected structure
  - Contain no fabricated policy references
  - Have valid action types
  - Are not empty or nonsensical
"""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

VALID_ACTION_TYPES = {
    "verbal_warning",
    "written_warning",
    "pip",
    "termination_review",
}

VALID_SEVERITY_LEVELS = {"low", "medium", "high", "critical"}


class OutputValidationError(Exception):
    """Raised when AI output fails validation."""

    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__(f"Output validation failed: {'; '.join(errors)}")


def validate_evaluation_output(
    output: dict[str, Any],
    policy_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Validate the output of the incident evaluation endpoint.

    Args:
        output: Raw AI output dictionary
        policy_context: Optional policy context for reference validation

    Returns:
        Validated and normalized output

    Raises:
        OutputValidationError: If output fails validation
    """
    errors = []

    # Required fields
    required_fields = ["confidence", "recommendation", "reasoning"]
    for field in required_fields:
        if field not in output:
            errors.append(f"Missing required field: {field}")

    if errors:
        raise OutputValidationError(errors)

    # Validate confidence score
    confidence = output.get("confidence")
    if confidence is not None:
        try:
            confidence_val = float(confidence)
            if not (0.0 <= confidence_val <= 1.0):
                errors.append(
                    f"Confidence score must be between 0.0 and 1.0, got {confidence_val}"
                )
            output["confidence"] = confidence_val
        except (ValueError, TypeError):
            errors.append(
                f"Confidence score must be a number, got {type(confidence).__name__}"
            )

    # Validate recommendation structure
    recommendation = output.get("recommendation", {})
    if isinstance(recommendation, dict):
        action_type = recommendation.get("action_type")
        if action_type and action_type not in VALID_ACTION_TYPES:
            errors.append(
                f"Invalid action_type: {action_type}. Must be one of: {', '.join(sorted(VALID_ACTION_TYPES))}"
            )

        severity = recommendation.get("severity")
        if severity and severity not in VALID_SEVERITY_LEVELS:
            errors.append(
                f"Invalid severity: {severity}. Must be one of: {', '.join(sorted(VALID_SEVERITY_LEVELS))}"
            )

    # Validate reasoning is not empty
    reasoning = output.get("reasoning", "")
    if isinstance(reasoning, str) and len(reasoning.strip()) < 10:
        errors.append("Reasoning must be at least 10 characters")

    # Check for fabricated policy references if policy context provided
    if policy_context:
        policy_refs = output.get("policy_references", [])
        if isinstance(policy_refs, list):
            valid_policy_ids = {policy_context.get("policy_id")}
            for ref in policy_refs:
                if isinstance(ref, dict):
                    ref_id = ref.get("policy_id")
                    if ref_id and ref_id not in valid_policy_ids:
                        errors.append(f"Fabricated policy reference: {ref_id}")

    if errors:
        raise OutputValidationError(errors)

    return output


def validate_document_output(
    output: dict[str, Any],
    policy_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Validate the output of the document generation endpoint.

    Args:
        output: Raw AI output dictionary
        policy_context: Optional policy context for reference validation

    Returns:
        Validated and normalized output

    Raises:
        OutputValidationError: If output fails validation
    """
    errors = []

    # Required fields
    required_fields = ["document_content", "action_type"]
    for field in required_fields:
        if field not in output:
            errors.append(f"Missing required field: {field}")

    if errors:
        raise OutputValidationError(errors)

    # Validate document content is not empty
    content = output.get("document_content", "")
    if isinstance(content, str) and len(content.strip()) < 50:
        errors.append("Document content must be at least 50 characters")

    # Validate action type
    action_type = output.get("action_type")
    if action_type and action_type not in VALID_ACTION_TYPES:
        errors.append(
            f"Invalid action_type: {action_type}. Must be one of: {', '.join(sorted(VALID_ACTION_TYPES))}"
        )

    # Validate policy references if context provided
    if policy_context:
        policy_refs = output.get("policy_references", [])
        if isinstance(policy_refs, list):
            valid_policy_ids = {policy_context.get("policy_id")}
            for ref in policy_refs:
                if isinstance(ref, dict):
                    ref_id = ref.get("policy_id")
                    if ref_id and ref_id not in valid_policy_ids:
                        errors.append(f"Fabricated policy reference: {ref_id}")

    if errors:
        raise OutputValidationError(errors)

    return output


def parse_json_output(raw: str) -> dict[str, Any]:
    """Parse a JSON string from AI output, handling common formatting issues.

    Tries:
      1. Direct JSON parse
      2. Extract JSON from markdown code blocks
      3. Extract JSON between first { and last }

    Args:
        raw: Raw AI output string

    Returns:
        Parsed JSON dictionary

    Raises:
        ValueError: If no valid JSON can be extracted
    """
    # Try direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Try markdown code block
    import re

    code_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try extract between first { and last }
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from AI output: {raw[:200]}...")
