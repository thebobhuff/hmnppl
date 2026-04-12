"""Pydantic schemas for the agent layer endpoints."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---- Enums ----


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EscalationLevel(str, Enum):
    VERBAL_WARNING = "verbal_warning"
    WRITTEN_WARNING = "written_warning"
    PIP = "pip"
    TERMINATION_REVIEW = "termination_review"
    IMMEDIATE_HR_ESCALATION = "immediate_hr_escalation"


class IncidentType(str, Enum):
    TARDINESS = "tardiness"
    ABSENCE = "absence"
    INSUBORDINATION = "insubordination"
    PERFORMANCE = "performance"
    MISCONDUCT = "misconduct"
    SAFETY_VIOLATION = "safety_violation"
    HARASSMENT = "harassment"
    VIOLENCE = "violence"
    FINANCIAL_IMPROPRIETY = "financial_impropriety"
    QUALITY_OF_WORK = "quality_of_work"
    OTHER = "other"


class InterviewStep(str, Enum):
    INTRODUCTION = "introduction"
    INCIDENT_DESCRIPTION = "incident_description"
    EMPLOYEE_RESPONSE = "employee_response"
    PRIOR_CONTEXT = "prior_context"
    TRAINING_REVIEW = "training_review"
    RESOLUTION = "resolution"


# ---- Risk Classifier ----


class RiskClassifierRequest(BaseModel):
    incident_type: IncidentType
    incident_description: str = Field(..., min_length=10, max_length=10000)
    severity: Optional[str] = Field(default="medium")
    employee_role: Optional[str] = Field(default=None)
    department: Optional[str] = Field(default=None)
    involves_protected_class: Optional[bool] = Field(default=False)
    additional_context: Optional[str] = Field(default=None, max_length=5000)


class RiskClassifierResponse(BaseModel):
    risk_level: RiskLevel
    bypasses_agent: bool = Field(
        description="If true, incident bypasses agent loop and goes directly to HR"
    )
    bypass_reason: Optional[str] = Field(default=None)
    risk_factors: List[str] = Field(default_factory=list)
    recommended_action: str
    confidence: float = Field(ge=0.0, le=1.0)


# ---- Escalation Router ----


class EscalationRouterRequest(BaseModel):
    incident_type: IncidentType
    incident_description: str = Field(..., min_length=10, max_length=10000)
    previous_incident_count: int = Field(default=0, ge=0)
    previous_incidents: Optional[List[Dict[str, Any]]] = Field(default=None)
    employee_training_history: Optional[List[Dict[str, Any]]] = Field(default=None)
    severity: Optional[str] = Field(default="medium")
    manager_notes: Optional[str] = Field(default=None, max_length=5000)
    policy_context: Optional[Dict[str, Any]] = Field(default=None)


class EscalationRouterResponse(BaseModel):
    escalation_level: EscalationLevel
    requires_hr_review: bool
    reasoning: str
    coaching_needed: bool
    coaching_topics: List[str] = Field(default_factory=list)
    training_gaps: List[str] = Field(default_factory=list)
    recommended_next_steps: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


# ---- Disciplinary Interview ----


class DisciplinaryInterviewRequest(BaseModel):
    incident_type: IncidentType
    incident_description: str = Field(..., min_length=10, max_length=10000)
    manager_name: Optional[str] = Field(default=None)
    employee_name: Optional[str] = Field(default=None)
    current_step: Optional[InterviewStep] = Field(default=InterviewStep.INTRODUCTION)
    prior_responses: Optional[Dict[str, Any]] = Field(default=None)
    session_id: Optional[str] = Field(default=None)


class DisciplinaryInterviewResponse(BaseModel):
    session_id: str
    current_step: InterviewStep
    agent_message: str
    agent_question: str
    coaching_for_manager: Optional[str] = Field(default=None)
    documentation_collected: Dict[str, Any] = Field(default_factory=dict)
    interview_complete: bool
    next_step: Optional[InterviewStep] = Field(default=None)
    requires_hr_review: bool


# ---- Manager Coach ----


class ManagerCoachRequest(BaseModel):
    incident_type: IncidentType
    incident_description: str = Field(..., min_length=10, max_length=10000)
    escalation_level: Optional[str] = Field(default="verbal_warning")
    manager_communication_style: Optional[str] = Field(default=None)
    employee_context: Optional[str] = Field(default=None, max_length=3000)
    specific_concern: Optional[str] = Field(default=None, max_length=2000)
    training_history: Optional[List[Dict[str, Any]]] = Field(default=None)


class TrainingRecommendation(BaseModel):
    training_type: str
    reason: str
    priority: str
    suggested_timeline: Optional[str] = Field(default=None)


class ManagerCoachResponse(BaseModel):
    empathy_coaching: str
    suggested_language: List[str]
    language_to_avoid: List[str]
    conversation_structure: List[str]
    training_recommendations: List[TrainingRecommendation] = Field(default_factory=list)
    documentation_checklist: List[str] = Field(default_factory=list)
    risk_warnings: List[str] = Field(default_factory=list)


# ---- Language Checker ----


class LanguageCheckerRequest(BaseModel):
    document_content: str = Field(..., min_length=10, max_length=50000)
    document_type: Optional[str] = Field(default="disciplinary")
    escalation_level: Optional[str] = Field(default=None)
    state_jurisdiction: Optional[str] = Field(default=None)


class HotSpot(BaseModel):
    location: str
    issue: str
    severity: str
    suggestion: str


class LanguageCheckerResponse(BaseModel):
    overall_assessment: str
    hot_spots: List[HotSpot] = Field(default_factory=list)
    emotional_language_detected: bool
    legal_risk_level: RiskLevel
    protected_class_mentions: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    is_legally_sound: bool
