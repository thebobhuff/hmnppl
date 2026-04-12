"""Wave 6 Agent API Routes - Lijo Feature Gap endpoints.

New endpoints for:
- L-002: Issue Similarity Detection
- L-003: Training Gap Analysis
- L-007: Continuous Improvement Insights
- L-009: Manager Pushback Evaluation
"""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException
from typing import Any

from app.core.config import Settings, get_settings
from app.core.security import validate_api_key
from app.agents.schemas import (
    IssueSimilarityRequest,
    IssueSimilarityResponse,
    TrainingGapRequest,
    TrainingGapResponse,
    ContinuousImprovementRequest,
    ContinuousImprovementResponse,
    ManagerPushbackRequest,
    ManagerPushbackResponse,
)
from app.agents.issue_similarity import IssueSimilarityAgent
from app.agents.training_gap import TrainingGapAgent
from app.agents.continuous_improvement import ContinuousImprovementAgent
from app.agents.manager_pushback import ManagerPushbackAgent

router = APIRouter(
    prefix="/agents/wave6",
    tags=["agents", "wave6"],
    dependencies=[Depends(validate_api_key)],
)

logger = logging.getLogger(__name__)


@router.post("/issue-similarity", response_model=IssueSimilarityResponse)
async def detect_issue_similarity(
    body: IssueSimilarityRequest,
    settings: Settings = Depends(get_settings),
):
    """L-002: Detect if a new incident is a repeat offense or new issue type."""
    start_time = time.monotonic()

    try:
        agent = IssueSimilarityAgent(settings)
        result = await agent.run(
            incident_type=body.incident_type.value,
            incident_description=body.incident_description,
            employee_history=body.employee_history,
            policy_context=body.policy_context,
        )

        elapsed = time.monotonic() - start_time
        logger.info(f"issue-similarity completed in {elapsed:.2f}s")

        return result

    except Exception as e:
        logger.exception("Issue similarity agent failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/training-gaps", response_model=TrainingGapResponse)
async def analyze_training_gaps(
    body: TrainingGapRequest,
    settings: Settings = Depends(get_settings),
):
    """L-003: Analyze incidents for systemic training gaps."""
    start_time = time.monotonic()

    try:
        agent = TrainingGapAgent(settings)
        result = await agent.run(
            incidents=body.incidents,
            training_catalog=body.training_catalog,
            department=body.department,
            time_window_days=body.time_window_days,
        )

        elapsed = time.monotonic() - start_time
        logger.info(f"training-gaps completed in {elapsed:.2f}s")

        return result

    except Exception as e:
        logger.exception("Training gap agent failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/continuous-improvement", response_model=ContinuousImprovementResponse)
async def generate_improvement_insights(
    body: ContinuousImprovementRequest,
    settings: Settings = Depends(get_settings),
):
    """L-007: Generate continuous improvement insights from organizational data."""
    start_time = time.monotonic()

    try:
        agent = ContinuousImprovementAgent(settings)
        result = await agent.run(
            incidents=body.incidents or [],
            policies=body.policies or [],
            manager_stats=body.manager_stats or [],
            training_gaps=body.training_gaps or [],
            org_health=body.org_health,
        )

        elapsed = time.monotonic() - start_time
        logger.info(f"continuous-improvement completed in {elapsed:.2f}s")

        return result

    except Exception as e:
        logger.exception("Continuous improvement agent failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pushback", response_model=ManagerPushbackResponse)
async def evaluate_manager_pushback(
    body: ManagerPushbackRequest,
    settings: Settings = Depends(get_settings),
):
    """L-009: Evaluate if a manager's requested discipline action is proportional."""
    start_time = time.monotonic()

    try:
        agent = ManagerPushbackAgent(settings)
        result = await agent.run(
            requested_action=body.requested_action,
            incident_type=body.incident_type.value,
            incident_description=body.incident_description,
            employee_history=body.employee_history,
            policy_context=body.policy_context,
            manager_notes=body.manager_notes,
        )

        elapsed = time.monotonic() - start_time
        logger.info(f"pushback evaluation completed in {elapsed:.2f}s")

        return result

    except Exception as e:
        logger.exception("Manager pushback agent failed")
        raise HTTPException(status_code=500, detail=str(e))
