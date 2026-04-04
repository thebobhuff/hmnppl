"""Company factory function.

Creates a company record using the service-role connection (bypasses RLS)
and returns the created row as a dict.
"""

from __future__ import annotations

from typing import Any

import psycopg2.extras


def create_company(
    cur: psycopg2.extras.RealDictCursor,
    *,
    name: str = "TestCo Alpha",
    id: str | None = None,
    industry: str = "Technology",
    size: str = "51-200",
    country: str = "US",
    region: str = "California",
    subscription_tier: str = "professional",
    ai_confidence_threshold: float = 0.85,
    dispute_enabled: bool = True,
    settings: dict | None = None,
    onboarding_completed: bool = True,
) -> dict[str, Any]:
    """Insert a company and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        name: Company display name.
        id: Optional fixed UUID.  If omitted, one is generated.
        industry: Industry category.
        size: Company size range.
        country: ISO 3166-1 alpha-2 country code.
        region: State/province/region.
        subscription_tier: Billing tier.
        ai_confidence_threshold: Minimum AI confidence for auto-approval.
        dispute_enabled: Whether employees can dispute actions.
        settings: JSONB settings blob (merged with defaults).
        onboarding_completed: Whether onboarding is complete.

    Returns:
        Dict with all company columns.
    """
    import json

    default_settings = {
        "notification_prefs": {},
        "feature_flags": {
            "ai_auto_generate": False,
            "ai_meeting_summary": False,
            "employee_dispute": True,
            "microsoft_sso": False,
            "e_signature_v2": False,
        },
        "ai_monthly_budget_usd": 50,
    }
    if settings:
        default_settings.update(settings)

    cols = [
        "name",
        "industry",
        "size",
        "country",
        "region",
        "subscription_tier",
        "ai_confidence_threshold",
        "dispute_enabled",
        "settings",
        "onboarding_completed",
    ]
    vals = [
        name,
        industry,
        size,
        country,
        region,
        subscription_tier,
        ai_confidence_threshold,
        dispute_enabled,
        json.dumps(default_settings),
        onboarding_completed,
    ]

    if id is not None:
        cols.insert(0, "id")
        vals.insert(0, id)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO companies ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    return dict(cur.fetchone())
