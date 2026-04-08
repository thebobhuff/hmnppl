"""Agent Router — FastAPI router for all agent endpoints.

Endpoints:
  POST /agents/classify-risk      — Classify incident risk level
  POST /agents/route-escalation   — Determine escalation level
  POST /agents/interview          — Conduct disciplinary interview (multi-step)
  POST /agents/coach-manager      — Coach manager on disciplinary conversation
  POST /agents/check-language     — Review document for legal language risks
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.core.security import validate_api_key
from app.agents.schemas import (
    RiskClassifierRequest,
    RiskClassifierResponse,
    EscalationRouterRequest,
    EscalationRouterResponse,
    DisciplinaryInterviewRequest,
    DisciplinaryInterviewResponse,
    ManagerCoachRequest,
    ManagerCoachResponse,
    LanguageCheckerRequest,
    LanguageCheckerResponse,
)
from app.agents.risk_classifier import RiskClassifierAgent
from app.agents.escalation_router import EscalationRouterAgent
from app.agents.disciplinary_interview import DisciplinaryInterviewAgent
from app.agents.manager_coach import ManagerCoachAgent
from app.agents.language_checker import LanguageCheckerAgent

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
    dependencies=[Depends(validate_api_key)],
)


@router.post("/classify-risk", response_model=RiskClassifierResponse)
async def classify_risk(
    body: RiskClassifierRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Classify the risk level of an incident and determine if HR bypass is needed."""
    start_time = time.monotonic()

    try:
        agent = RiskClassifierAgent(settings)
        result = await agent.run(
            incident_type=body.incident_type.value,
            incident_description=body.incident_description,
            severity=body.severity or "medium",
            employee_role=body.employee_role,
            department=body.department,
            involves_protected_class=body.involves_protected_class or False,
            additional_context=body.additional_context,
        )

        elapsed = time.monotonic() - start_time
        logger.info(
            "Risk classification completed: risk=%s, bypass=%s, latency=%.0fms",
            result["risk_level"],
            result["bypasses_agent"],
            elapsed * 1000,
        )

        return result

    except Exception as exc:
        logger.exception("Risk classification failed")
        raise HTTPException(
            status_code=500,
            detail=f"Risk classification failed: {str(exc)}",
        )


@router.post("/route-escalation", response_model=EscalationRouterResponse)
async def route_escalation(
    body: EscalationRouterRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Determine the appropriate escalation level for a disciplinary incident."""
    start_time = time.monotonic()

    try:
        agent = EscalationRouterAgent(settings)
        result = await agent.run(
            incident_type=body.incident_type.value,
            incident_description=body.incident_description,
            previous_incident_count=body.previous_incident_count,
            previous_incidents=body.previous_incidents,
            employee_training_history=body.employee_training_history,
            severity=body.severity or "medium",
            manager_notes=body.manager_notes,
            policy_context=body.policy_context,
        )

        elapsed = time.monotonic() - start_time
        logger.info(
            "Escalation routing completed: level=%s, hr_review=%s, latency=%.0fms",
            result["escalation_level"],
            result["requires_hr_review"],
            elapsed * 1000,
        )

        return result

    except Exception as exc:
        logger.exception("Escalation routing failed")
        raise HTTPException(
            status_code=500,
            detail=f"Escalation routing failed: {str(exc)}",
        )


@router.post("/interview", response_model=DisciplinaryInterviewResponse)
async def conduct_interview(
    body: DisciplinaryInterviewRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Conduct a step in the disciplinary interview workflow."""
    start_time = time.monotonic()

    try:
        agent = DisciplinaryInterviewAgent(settings)
        result = await agent.run(
            incident_type=body.incident_type.value,
            incident_description=body.incident_description,
            manager_name=body.manager_name,
            employee_name=body.employee_name,
            current_step=body.current_step.value
            if body.current_step
            else "introduction",
            prior_responses=body.prior_responses,
            session_id=body.session_id,
        )

        elapsed = time.monotonic() - start_time
        logger.info(
            "Interview step completed: step=%s, complete=%s, latency=%.0fms",
            result["current_step"],
            result["interview_complete"],
            elapsed * 1000,
        )

        return result

    except Exception as exc:
        logger.exception("Interview step failed")
        raise HTTPException(
            status_code=500,
            detail=f"Interview step failed: {str(exc)}",
        )


@router.post("/coach-manager", response_model=ManagerCoachResponse)
async def coach_manager(
    body: ManagerCoachRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Coach a manager on handling a disciplinary conversation."""
    start_time = time.monotonic()

    try:
        agent = ManagerCoachAgent(settings)
        result = await agent.run(
            incident_type=body.incident_type.value,
            incident_description=body.incident_description,
            escalation_level=body.escalation_level or "verbal_warning",
            manager_communication_style=body.manager_communication_style,
            employee_context=body.employee_context,
            specific_concern=body.specific_concern,
            training_history=body.training_history,
        )

        elapsed = time.monotonic() - start_time
        logger.info(
            "Manager coaching completed: topics=%d, latency=%.0fms",
            len(result.get("suggested_language", [])),
            elapsed * 1000,
        )

        return result

    except Exception as exc:
        logger.exception("Manager coaching failed")
        raise HTTPException(
            status_code=500,
            detail=f"Manager coaching failed: {str(exc)}",
        )


@router.post("/check-language", response_model=LanguageCheckerResponse)
async def check_language(
    body: LanguageCheckerRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Review a disciplinary document for legal language risks."""
    start_time = time.monotonic()

    try:
        agent = LanguageCheckerAgent(settings)
        result = await agent.run(
            document_content=body.document_content,
            document_type=body.document_type or "disciplinary",
            escalation_level=body.escalation_level,
            state_jurisdiction=body.state_jurisdiction,
        )

        elapsed = time.monotonic() - start_time
        logger.info(
            "Language check completed: sound=%s, hot_spots=%d, latency=%.0fms",
            result["is_legally_sound"],
            len(result.get("hot_spots", [])),
            elapsed * 1000,
        )

        return result

    except Exception as exc:
        logger.exception("Language check failed")
        raise HTTPException(
            status_code=500,
            detail=f"Language check failed: {str(exc)}",
        )


# ============================================================================
# Policy Chat Agent
# ============================================================================

from pydantic import BaseModel


class PolicyChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str
    history: list[dict[str, str]] | None = None
    context: dict[str, Any] | None = None


class PolicyCreationRequest(BaseModel):
    conversation_id: str | None = None
    message: str
    history: list[dict[str, str]] | None = None
    context: dict[str, Any] | None = None


@router.post("/policy-chat")
async def policy_chat(
    body: PolicyChatRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Chat with the policy assistant about policies."""
    from app.agents.policy_chat import PolicyChatAgent

    start_time = time.monotonic()

    try:
        agent = PolicyChatAgent(settings)
        result = await agent.chat(
            message=body.message,
            history=body.history or [],
            context=body.context or {},
            conversation_id=body.conversation_id,
        )

        elapsed = time.monotonic() - start_time
        logger.info(
            "Policy chat completed: latency=%.0fms",
            elapsed * 1000,
        )

        return result

    except Exception as exc:
        logger.exception("Policy chat failed")
        raise HTTPException(
            status_code=500,
            detail=f"Policy chat failed: {str(exc)}",
        )


@router.post("/policy-creation")
async def policy_creation(
    body: PolicyCreationRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Interview the user and generate a policy draft."""
    from app.agents.policy_creation_agent import PolicyCreationAgent

    start_time = time.monotonic()

    try:
        agent = PolicyCreationAgent(settings)
        result = await agent.run(
            message=body.message,
            history=body.history or [],
            context=body.context or {},
            conversation_id=body.conversation_id,
        )

        elapsed = time.monotonic() - start_time
        logger.info(
            "Policy creation completed: draft=%s, latency=%.0fms",
            bool(result.get("policy_draft")),
            elapsed * 1000,
        )

        return result

    except Exception as exc:
        logger.exception("Policy creation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Policy creation failed: {str(exc)}",
        )
