"""PII Sanitizer — strips/pseudonymizes sensitive data before AI calls.

Ensures no PII (SSN, salary, address, email, phone) is sent to AI providers.
Complies with NFR-010: "All PII stripped/pseudonymized before sending to AI providers."
"""

from __future__ import annotations

import re
from typing import Any

# Patterns to detect and redact PII
_PII_PATTERNS = [
    # SSN: XXX-XX-XXXX
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[SSN REDACTED]"),
    # Email addresses
    (
        re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
        "[EMAIL REDACTED]",
    ),
    # Phone numbers (various formats)
    (
        re.compile(r"\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
        "[PHONE REDACTED]",
    ),
    # US Street addresses (number + street name)
    (
        re.compile(
            r"\b\d{1,5}\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Road|Rd|Way|Court|Ct|Place|Pl)\b",
            re.IGNORECASE,
        ),
        "[ADDRESS REDACTED]",
    ),
    # Salary patterns
    (
        re.compile(
            r"\$[\d,]+(?:\.\d{2})?(?:\s*(?:per|\/)\s*(?:year|annum|month|hour|week))?",
            re.IGNORECASE,
        ),
        "[SALARY REDACTED]",
    ),
]


def sanitize_text(text: str) -> str:
    """Remove PII from free-text content.

    Args:
        text: Input text that may contain PII

    Returns:
        Text with all detected PII replaced with redaction markers
    """
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def sanitize_dict(
    data: dict[str, Any], pii_fields: set[str] | None = None
) -> dict[str, Any]:
    """Remove PII from a dictionary by redacting known PII fields.

    Args:
        data: Dictionary that may contain PII values
        pii_fields: Set of field names to always redact. Defaults to common PII fields.

    Returns:
        New dictionary with PII fields redacted
    """
    if pii_fields is None:
        pii_fields = {
            "ssn",
            "social_security",
            "salary",
            "compensation",
            "address",
            "street_address",
            "phone",
            "phone_number",
            "email",
            "date_of_birth",
            "dob",
        }

    sanitized: dict[str, Any] = {}
    for key, value in data.items():
        key_lower = key.lower()
        if key_lower in pii_fields:
            sanitized[key] = f"[{key_upper(key)} REDACTED]"
        elif isinstance(value, str):
            sanitized[key] = sanitize_text(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, pii_fields)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_dict(item, pii_fields)
                if isinstance(item, dict)
                else sanitize_text(item)
                if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            sanitized[key] = value

    return sanitized


def key_upper(key: str) -> str:
    """Convert a snake_case key to UPPER_CASE for redaction labels."""
    return key.upper().replace("_", " ")


def verify_no_pii(text: str) -> list[str]:
    """Check if text contains any PII patterns.

    Returns:
        List of detected PII types, empty if clean
    """
    detected = []
    for pattern, label in _PII_PATTERNS:
        if pattern.search(text):
            detected.append(label)
    return detected


# ---- L-010: Protected Class Guardrails ----
# Per Lijo Joseph: Agent must avoid documenting protected class info (discoverable risk)

_PROTECTED_CLASS_TERMS = [
    re.compile(r'\b(age|over\s+\d{2}|under\s+\d{2})\b', re.IGNORECASE),
    re.compile(r'\b(race|ethnicity|national\s+origin|ancestry)\b', re.IGNORECASE),
    re.compile(r'\b(gender|sex|sexual\s+orientation|pregnancy|maternity)\b', re.IGNORECASE),
    re.compile(r'\b(religion|religious|faith|creed)\b', re.IGNORECASE),
    re.compile(r'\b(disability|disabled|handicap|handicapped|impairment)\b', re.IGNORECASE),
    re.compile(r'\b(veteran|military\s+service|armed\s+forces)\b', re.IGNORECASE),
    re.compile(r'\b(genetic\s+information|dna|hereditary)\b', re.IGNORECASE),
    re.compile(r'\b(marital\s+status|married|divorced|single|widowed)\b', re.IGNORECASE),
    re.compile(r'\b(pregnant|pregnancy|maternity\s+leave|paternity)\b', re.IGNORECASE),
    re.compile(r'\b(african|asian|hispanic|latino|caucasian|native\s+american|pacific\s+islander)\b', re.IGNORECASE),
    re.compile(r'\b(muslim|christian|jewish|buddhist|hindu|sikh|atheist|agnostic)\b', re.IGNORECASE),
]

_PROTECTED_CLASS_CATEGORIES = [
    "age", "race/national_origin", "gender/sex", "religion",
    "disability", "veteran_status", "genetic_info", "marital_status",
    "pregnancy", "race_ethnicity", "religion",
]


def detect_protected_class_references(text: str) -> list[dict[str, str]]:
    """Detect protected class references in text that should not be documented."""
    findings = []
    for i, pattern in enumerate(_PROTECTED_CLASS_TERMS):
        matches = pattern.findall(text)
        if matches:
            cat = _PROTECTED_CLASS_CATEGORIES[i] if i < len(_PROTECTED_CLASS_CATEGORIES) else "protected_class"
            for match in (matches if isinstance(matches, list) else [matches]):
                term = match if isinstance(match, str) else str(match)
                findings.append({"term": term, "category": cat})
    return findings


def strip_protected_class_references(text: str) -> tuple[str, list[dict[str, str]]]:
    """Remove protected class references from text and return cleaned text + report.

    Per Lijo: protected class info is discoverable in legal proceedings.
    The agent must not document it.
    """
    findings = detect_protected_class_references(text)
    cleaned = text
    for finding in findings:
        term = finding["term"]
        cleaned = cleaned.replace(term, "[PROTECTED_INFO_REMOVED]")
    return cleaned, findings