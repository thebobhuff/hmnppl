"""Incident factory function.

Creates incident records (and optionally incident_witnesses) using
the service-role connection (bypasses RLS).
"""

from __future__ import annotations

from typing import Any

import json

import psycopg2.extras


def create_incident(
    cur: psycopg2.extras.RealDictCursor,
    *,
    id: str | None = None,
    company_id: str,
    employee_id: str,
    reporter_id: str,
    reference_number: str = "INC-0001",
    type: str = "tardiness",
    description: str = "Test incident for RLS validation",
    incident_date: str = "2025-01-15",
    severity: str = "low",
    status: str = "pending_hr_review",
    union_involved: bool = False,
    ai_confidence_score: float | None = None,
    ai_evaluation_status: str | None = None,
    ai_recommendation: dict | None = None,
    linked_policy_id: str | None = None,
    previous_incident_count: int = 0,
    witnesses: list[str] | None = None,
) -> dict[str, Any]:
    """Insert an incident and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        id: Optional fixed UUID.
        company_id: The tenant/company UUID.
        employee_id: The employee the incident is about.
        reporter_id: The user who reported the incident.
        reference_number: Human-readable reference (unique per company).
        type: incident_type enum value.
        description: Incident description.
        incident_date: ISO date string.
        severity: incident_severity enum value.
        status: incident_status enum value.
        union_involved: Whether a union is involved.
        ai_confidence_score: AI confidence score (0.00-1.00).
        ai_evaluation_status: AI evaluation status.
        ai_recommendation: AI recommendation JSONB.
        linked_policy_id: UUID of the linked policy.
        previous_incident_count: Count of prior incidents for this employee.
        witnesses: List of user UUIDs to add as incident_witnesses.

    Returns:
        Dict with all incident columns.
    """
    cols = [
        "company_id",
        "employee_id",
        "reported_by",
        "reference_number",
        "type",
        "description",
        "incident_date",
        "severity",
        "status",
        "union_involved",
        "previous_incident_count",
    ]
    vals = [
        company_id,
        employee_id,
        reporter_id,
        reference_number,
        type,
        description,
        incident_date,
        severity,
        status,
        union_involved,
        previous_incident_count,
    ]

    if id is not None:
        cols.insert(0, "id")
        vals.insert(0, id)
    if ai_confidence_score is not None:
        cols.append("ai_confidence_score")
        vals.append(ai_confidence_score)
    if ai_evaluation_status is not None:
        cols.append("ai_evaluation_status")
        vals.append(ai_evaluation_status)
    if ai_recommendation is not None:
        cols.append("ai_recommendation")
        vals.append(json.dumps(ai_recommendation))
    if linked_policy_id is not None:
        cols.append("linked_policy_id")
        vals.append(linked_policy_id)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO incidents ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    incident = dict(cur.fetchone())

    # Add witnesses if provided
    if witnesses:
        for witness_id in witnesses:
            cur.execute(
                "INSERT INTO incident_witnesses (incident_id, user_id) VALUES (%s, %s);",
                (incident["id"], witness_id),
            )

    return incident


def create_disciplinary_action(
    cur: psycopg2.extras.RealDictCursor,
    *,
    incident_id: str,
    company_id: str,
    employee_id: str,
    action_type: str = "verbal_warning",
    status: str = "pending_approval",
    document_id: str | None = None,
    approved_by: str | None = None,
    follow_up_actions: list[dict] | None = None,
    rejection_reason: str | None = None,
) -> dict[str, Any]:
    """Insert a disciplinary_action and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        incident_id: The parent incident UUID (UNIQUE constraint).
        company_id: The tenant/company UUID.
        employee_id: The employee UUID.
        action_type: action_type enum value.
        status: action_status enum value.
        document_id: Optional linked document UUID.
        approved_by: Optional approver user UUID.
        follow_up_actions: JSONB array of follow-up actions.
        rejection_reason: Optional rejection reason text.

    Returns:
        Dict with all disciplinary_action columns.
    """
    cols = [
        "incident_id",
        "company_id",
        "employee_id",
        "action_type",
        "status",
    ]
    vals = [
        incident_id,
        company_id,
        employee_id,
        action_type,
        status,
    ]

    if document_id is not None:
        cols.append("document_id")
        vals.append(document_id)
    if approved_by is not None:
        cols.append("approved_by")
        vals.append(approved_by)
    if follow_up_actions is not None:
        cols.append("follow_up_actions")
        vals.append(json.dumps(follow_up_actions))
    if rejection_reason is not None:
        cols.append("rejection_reason")
        vals.append(rejection_reason)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO disciplinary_actions ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    return dict(cur.fetchone())
