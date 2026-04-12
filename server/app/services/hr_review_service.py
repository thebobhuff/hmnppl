"""HR Review Workflow Service.

Handles the review queue for disciplinary actions that require HR approval.
"""

from __future__ import annotations

import logging
from typing import Any
from enum import Enum

logger = logging.getLogger(__name__)


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVISION_REQUESTED = "revision_requested"


class ActionType(str, Enum):
    VERBAL_WARNING = "verbal_warning"
    WRITTEN_WARNING = "written_warning"
    PIP = "pip"
    TERMINATION_REVIEW = "termination_review"


def requires_hr_review(action_type: str, escalation_level: str | None = None) -> bool:
    """Determine if an action type requires HR review.

    Per Lijo Joseph's requirements:
    - Verbal warnings: don't need HR review
    - Written warnings+: require HR review
    - High-risk incidents: bypass agent, direct to HR
    """
    if action_type == ActionType.VERBAL_WARNING.value:
        return False
    return True


def get_review_deadline(action_type: str) -> int:
    """Get the review deadline in hours for each action type."""
    deadlines = {
        ActionType.VERBAL_WARNING.value: 0,  # No review needed
        ActionType.WRITTEN_WARNING.value: 48,  # 48 hours
        ActionType.PIP.value: 72,  # 72 hours (3 days)
        ActionType.TERMINATION_REVIEW.value: 24,  # 24 hours - urgent
    }
    return deadlines.get(action_type, 48)


def format_review_notification(
    action_type: str,
    employee_name: str,
    manager_name: str,
    incident_summary: str,
) -> dict[str, Any]:
    """Format notification for HR review queue."""
    action_labels = {
        ActionType.VERBAL_WARNING.value: "Verbal Warning",
        ActionType.WRITTEN_WARNING.value: "Written Warning",
        ActionType.PIP.value: "Performance Improvement Plan",
        ActionType.TERMINATION_REVIEW.value: "Termination Review",
    }

    return {
        "title": f"HR Review Required: {action_labels.get(action_type, action_type)}",
        "employee": employee_name,
        "manager": manager_name,
        "incident_summary": incident_summary[:500],
        "action_type": action_type,
        "deadline_hours": get_review_deadline(action_type),
    }
