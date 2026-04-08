"""Disciplinary Interview Agent — automated initial interview and documentation.

Conducts a multi-step interview with the manager to:
1. Document the incident systematically
2. Coach the manager on appropriate language
3. Track training history
4. Build a continuous record for formal write-ups or PIPs

Per Lijo Joseph's requirements:
- For verbal warnings: agent handles the full interview without HR review
- For written warnings or higher: flag that HR review is required
- Agent coaches managers on empathy while maintaining standards
- Agent tracks training documentation for future PIPs
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_disciplinary_interview_prompt
from app.agents.schemas import InterviewStep

logger = logging.getLogger(__name__)

STEP_ORDER = [
    InterviewStep.INTRODUCTION,
    InterviewStep.INCIDENT_DESCRIPTION,
    InterviewStep.EMPLOYEE_RESPONSE,
    InterviewStep.PRIOR_CONTEXT,
    InterviewStep.TRAINING_REVIEW,
    InterviewStep.RESOLUTION,
]


class DisciplinaryInterviewAgent(BaseAgent):
    """Conducts automated disciplinary interviews with managers."""

    async def run(
        self,
        incident_type: str,
        incident_description: str,
        manager_name: str | None = None,
        employee_name: str | None = None,
        current_step: str = "introduction",
        prior_responses: dict[str, Any] | None = None,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        if session_id is None:
            session_id = str(uuid.uuid4())[:8]

        messages = build_disciplinary_interview_prompt(
            incident_type=incident_type,
            incident_description=incident_description,
            manager_name=manager_name,
            employee_name=employee_name,
            current_step=current_step,
            prior_responses=prior_responses,
            session_id=session_id,
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.3,
            max_tokens=1500,
        )

        parsed = self._parse_json(result["content"])

        # Determine next step
        interview_complete = parsed.get("interview_complete", False)
        next_step = parsed.get("next_step")

        if not interview_complete and next_step is None:
            current_idx = (
                STEP_ORDER.index(InterviewStep(current_step))
                if current_step in [s.value for s in STEP_ORDER]
                else 0
            )
            if current_idx < len(STEP_ORDER) - 1:
                next_step = STEP_ORDER[current_idx + 1].value
            else:
                interview_complete = True
                next_step = None

        return {
            "session_id": parsed.get("session_id", session_id),
            "current_step": parsed.get("current_step", current_step),
            "agent_message": parsed.get("agent_message", ""),
            "agent_question": parsed.get("agent_question", ""),
            "coaching_for_manager": parsed.get("coaching_for_manager"),
            "documentation_collected": parsed.get("documentation_collected", {}),
            "interview_complete": interview_complete,
            "next_step": next_step,
            "requires_hr_review": parsed.get("requires_hr_review", False),
        }
