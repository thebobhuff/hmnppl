"""Pydantic schemas for the ``POST /evaluate-incident`` endpoint.

These models define the wire contract for submitting an employee incident
report and receiving an AI-generated severity / category assessment.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---- Enums ----


class SeverityLevel(str, Enum):
    """Severity classification returned by the AI evaluator."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentCategory(str, Enum):
    """High-level incident categories used for routing."""

    CONDUCT = "conduct"
    SAFETY = "safety"
    HARASSMENT = "harassment"
    POLICY_VIOLATION = "policy_violation"
    PERFORMANCE = "performance"
    OTHER = "other"


# ---- Request ----


class EvaluateIncidentRequest(BaseModel):
    """Payload for incident evaluation.

    The caller supplies the raw incident text along with optional context
    fields so the AI model can produce a more accurate assessment.
    """

    incident_text: str = Field(
        ...,
        min_length=10,
        max_length=10_000,
        description="Free-text description of the incident.",
    )
    employee_id: Optional[str] = Field(
        default=None,
        description="Optional employee identifier for audit trail.",
    )
    incident_date: Optional[datetime] = Field(
        default=None,
        description="When the incident occurred (ISO 8601).",
    )
    context: Optional[str] = Field(
        default=None,
        max_length=5_000,
        description="Additional context the caller wants to supply.",
    )


# ---- Response ----


class EvaluateIncidentResponse(BaseModel):
    """AI-generated incident assessment."""

    severity: SeverityLevel = Field(
        description="Assessed severity of the incident.",
    )
    category: IncidentCategory = Field(
        description="Predicted incident category.",
    )
    summary: str = Field(
        description="Concise AI-generated summary of the incident.",
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Suggested follow-up actions.",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence score between 0 and 1.",
    )
