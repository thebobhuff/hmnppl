"""Policy factory function.

Creates a policy and optionally a policy_version record using the
service-role connection (bypasses RLS).
"""

from __future__ import annotations

from typing import Any

import json

import psycopg2.extras


def create_policy(
    cur: psycopg2.extras.RealDictCursor,
    *,
    id: str | None = None,
    company_id: str,
    category: str = "attendance",
    title: str = "Test Attendance Policy",
    summary: str | None = None,
    content: str = "## Test Policy\n\nThis is a test policy.",
    rules: list[dict] | None = None,
    severity_levels: dict | None = None,
    is_active: bool = True,
    version: int = 1,
    effective_date: str | None = None,
    created_by: str | None = None,
) -> dict[str, Any]:
    """Insert a policy and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        id: Optional fixed UUID.
        company_id: The tenant/company UUID.
        category: Policy category.
        title: Policy title.
        summary: Short summary.
        content: Full policy text.
        rules: JSONB rules array (defaults to a single test rule).
        severity_levels: JSONB severity mapping.
        is_active: Whether the policy is active.
        version: Policy version number.
        effective_date: ISO date string.
        created_by: User UUID who created the policy.

    Returns:
        Dict with all policy columns.
    """
    if rules is None:
        rules = [
            {
                "id": "TEST-01",
                "description": "Test rule for unit testing",
                "threshold_count": 1,
                "severity": "low",
            }
        ]
    if summary is None:
        summary = f"Test policy for {category}"

    cols = [
        "company_id",
        "category",
        "title",
        "summary",
        "content",
        "rules",
        "is_active",
        "version",
    ]
    vals = [
        company_id,
        category,
        title,
        summary,
        content,
        json.dumps(rules),
        is_active,
        version,
    ]

    if id is not None:
        cols.insert(0, "id")
        vals.insert(0, id)
    if severity_levels is not None:
        cols.append("severity_levels")
        vals.append(json.dumps(severity_levels))
    if effective_date is not None:
        cols.append("effective_date")
        vals.append(effective_date)
    if created_by is not None:
        cols.append("created_by")
        vals.append(created_by)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO policies ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    return dict(cur.fetchone())


def create_policy_version(
    cur: psycopg2.extras.RealDictCursor,
    *,
    policy_id: str,
    version: int = 1,
    content: str = "## Version 1\n\nInitial version.",
    rules: list[dict] | None = None,
    severity_levels: dict | None = None,
    created_by: str | None = None,
) -> dict[str, Any]:
    """Insert a policy_version and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        policy_id: The parent policy UUID.
        version: Version number.
        content: Policy content at this version.
        rules: JSONB rules snapshot.
        severity_levels: JSONB severity mapping snapshot.
        created_by: User UUID.

    Returns:
        Dict with all policy_version columns.
    """
    if rules is None:
        rules = [
            {
                "id": "TEST-01",
                "description": "Test rule",
                "threshold_count": 1,
                "severity": "low",
            }
        ]

    cols = ["policy_id", "version", "content", "rules"]
    vals = [policy_id, version, content, json.dumps(rules)]

    if severity_levels is not None:
        cols.append("severity_levels")
        vals.append(json.dumps(severity_levels))
    if created_by is not None:
        cols.append("created_by")
        vals.append(created_by)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO policy_versions ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    return dict(cur.fetchone())
