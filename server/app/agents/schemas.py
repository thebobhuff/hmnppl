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


# ---- Wave 6: Lijo Feature Gap Schemas ----


# Issue Similarity (L-002)

class IssueSimilarityRequest(BaseModel):
    incident_type: IncidentType
    incident_description: str = Field(..., min_length=10, max_length=10000)
    employee_history: Optional[List[Dict[str, Any]]] = Field(default=None)
    policy_context: Optional[Dict[str, Any]] = Field(default=None)


class MatchedIncident(BaseModel):
    prior_incident_type: str
    date: str
    similarity_reason: str


class IssueSimilarityResponse(BaseModel):
    is_repeat_issue: bool
    is_same_category: bool
    similarity_score: float = Field(ge=0.0, le=1.0)
    matched_incidents: List[MatchedIncident] = Field(default_factory=list)
    progression_analysis: str
    recommended_track: str
    training_relevant: bool
    training_topic: Optional[str] = Field(default=None)
    confidence: float = Field(ge=0.0, le=1.0)


# Training Gap (L-003)

class TrainingGapRequest(BaseModel):
    incidents: List[Dict[str, Any]] = Field(..., min_length=1)
    training_catalog: Optional[List[Dict[str, Any]]] = Field(default=None)
    department: Optional[str] = Field(default=None)
    time_window_days: int = Field(default=90, ge=7, le=365)


class TrainingGapItem(BaseModel):
    gap_area: str
    incident_types: List[str] = Field(default_factory=list)
    affected_count: int
    priority: str
    recommended_training: str
    estimated_impact: str


class TrainingGapResponse(BaseModel):
    gaps_found: bool
    training_gaps: List[TrainingGapItem] = Field(default_factory=list)
    systemic_issues: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    affected_departments: List[str] = Field(default_factory=list)
    priority_level: str
    confidence: float = Field(ge=0.0, le=1.0)


# Continuous Improvement (L-007)

class ContinuousImprovementRequest(BaseModel):
    incidents: Optional[List[Dict[str, Any]]] = Field(default=None)
    policies: Optional[List[Dict[str, Any]]] = Field(default=None)
    manager_stats: Optional[List[Dict[str, Any]]] = Field(default=None)
    training_gaps: Optional[List[Dict[str, Any]]] = Field(default=None)
    org_health: Optional[Dict[str, Any]] = Field(default=None)


class InsightItem(BaseModel):
    insight: str
    evidence: str
    impact: str
    type: str


class PriorityAction(BaseModel):
    action: str
    timeline: str
    effort: str
    expected_impact: str


class ContinuousImprovementResponse(BaseModel):
    insights: List[InsightItem] = Field(default_factory=list)
    process_recommendations: List[str] = Field(default_factory=list)
    policy_recommendations: List[str] = Field(default_factory=list)
    manager_recommendations: List[str] = Field(default_factory=list)
    overall_assessment: str
    priority_actions: List[PriorityAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


# Manager Pushback (L-009)

class ManagerPushbackRequest(BaseModel):
    requested_action: str = Field(..., min_length=3, max_length=200)
    incident_type: IncidentType
    incident_description: str = Field(..., min_length=10, max_length=10000)
    employee_history: Optional[List[Dict[str, Any]]] = Field(default=None)
    policy_context: Optional[Dict[str, Any]] = Field(default=None)
    manager_notes: Optional[str] = Field(default=None, max_length=5000)


class ManagerPushbackResponse(BaseModel):
    is_appropriate: bool
    proportionality_score: float = Field(ge=0.0, le=1.0)
    pushback_required: bool
    pushback_message: str
    suggested_alternative: str
    reasoning: str
    legal_risk_flag: bool
    progressive_discipline_step: str
    confidence: float = Field(ge=0.0, le=1.0)
