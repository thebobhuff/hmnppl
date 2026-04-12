"""Dashboard Analytics Service.

Per Lijo Joseph's requirements:
- Track verbals per manager
- Identify problem managers or problem employees
- Hotspot employees with multiple infractions
- Organization health dashboard
- Training gap recommendations
"""

from __future__ import annotations

import logging
from typing import Any
from datetime import date, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)


def calculate_manager_stats(
    incidents: list[dict[str, Any]],
    days: int = 30,
) -> list[dict[str, Any]]:
    """Calculate disciplinary statistics per manager."""

    cutoff_date = date.today() - timedelta(days=days)
    manager_stats = defaultdict(
        lambda: {
            "verbal_count": 0,
            "written_count": 0,
            "pip_count": 0,
            "termination_count": 0,
            "total_incidents": 0,
            "employees_affected": set(),
        }
    )

    for incident in incidents:
        incident_date = incident.get("created_at", "")
        if incident_date:
            # Simple date parsing - in production would use proper datetime
            try:
                if isinstance(incident_date, str) and incident_date < str(cutoff_date):
                    continue
            except Exception:
                pass

        manager_id = incident.get("manager_id", "unknown")
        action_type = incident.get("action_type", "verbal_warning")

        manager_stats[manager_id]["total_incidents"] += 1
        manager_stats[manager_id]["employees_affected"].add(
            incident.get("employee_id", "")
        )

        if action_type == "verbal_warning":
            manager_stats[manager_id]["verbal_count"] += 1
        elif action_type == "written_warning":
            manager_stats[manager_id]["written_count"] += 1
        elif action_type == "pip":
            manager_stats[manager_id]["pip_count"] += 1
        elif action_type in ("termination_review", "termination"):
            manager_stats[manager_id]["termination_count"] += 1

    results = []
    for manager_id, stats in manager_stats.items():
        results.append(
            {
                "manager_id": manager_id,
                "verbal_count": stats["verbal_count"],
                "written_count": stats["written_count"],
                "pip_count": stats["pip_count"],
                "termination_count": stats["termination_count"],
                "total_actions": stats["total_incidents"],
                "unique_employees": len(stats["employees_affected"]),
                "severity_score": (
                    stats["verbal_count"] * 1
                    + stats["written_count"] * 3
                    + stats["pip_count"] * 5
                    + stats["termination_count"] * 10
                ),
            }
        )

    # Sort by severity score descending
    results.sort(key=lambda x: x["severity_score"], reverse=True)
    return results


def identify_problem_managers(
    manager_stats: list[dict[str, Any]],
    threshold: int = 10,
) -> list[dict[str, Any]]:
    """Identify managers with high disciplinary action counts."""

    problems = [m for m in manager_stats if m["severity_score"] >= threshold]
    return sorted(problems, key=lambda x: x["severity_score"], reverse=True)


def calculate_employee_risk_score(
    incident_history: list[dict[str, Any]],
) -> dict[str, Any]:
    """Calculate risk score for an employee based on incident history.

    Per Lijo Joseph: track escalations to identify hotspot employees.
    """

    if not incident_history:
        return {
            "risk_level": "low",
            "risk_score": 0,
            "incident_count": 0,
            "escalation_stage": 0,
            "recommendations": [
                "No disciplinary history - maintain current performance"
            ],
        }

    # Count incidents by type
    incident_types = defaultdict(int)
    for incident in incident_history:
        incident_types[incident.get("type", "unknown")] += 1

    # Calculate escalation stage
    # verbal = 1, written = 2, pip = 3, termination = 4
    max_stage = 0
    for incident in incident_history:
        action = incident.get("action_type", "verbal_warning")
        if action == "verbal_warning":
            max_stage = max(max_stage, 1)
        elif action == "written_warning":
            max_stage = max(max_stage, 2)
        elif action == "pip":
            max_stage = max(max_stage, 3)
        elif action in ("termination_review", "termination"):
            max_stage = max(max_stage, 4)

    # Calculate risk score
    risk_score = (
        len(incident_history) * 2
        + max_stage * 5
        + sum(1 for i in incident_history if i.get("is_same_issue", False)) * 3
    )

    # Determine risk level
    if risk_score >= 15 or max_stage >= 3:
        risk_level = "critical"
    elif risk_score >= 10 or max_stage == 2:
        risk_level = "high"
    elif risk_score >= 5 or max_stage == 1:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Generate recommendations
    recommendations = []
    if max_stage == 1:
        recommendations.append("Consider written warning if issue repeats")
    if max_stage == 2:
        recommendations.append("Recommend PIP - escalate to HR review")
    if max_stage >= 3:
        recommendations.append("High risk - termination review may be warranted")

    # Check for same-issue repetition
    same_issues = [i for i in incident_history if i.get("is_same_issue", False)]
    if len(same_issues) >= 2:
        recommendations.append(
            "Multiple incidents for same issue - recommend formal documentation"
        )

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "incident_count": len(incident_history),
        "escalation_stage": max_stage,
        "incident_types": dict(incident_types),
        "recommendations": recommendations,
    }


def calculate_organization_health(
    incidents: list[dict[str, Any]],
    employees: int,
    days: int = 30,
) -> dict[str, Any]:
    """Calculate overall organization disciplinary health.

    Per Lijo Joseph: "I can see the health of my organization in one shot
    from a discipline perspective."
    """

    if not incidents:
        return {
            "health_score": 100,
            "status": "excellent",
            "total_incidents": 0,
            "incidents_per_employee": 0,
            "trends": "No disciplinary incidents recorded",
        }

    cutoff_date = date.today() - timedelta(days=days)
    recent_incidents = [
        i for i in incidents if i.get("created_at", "") >= str(cutoff_date)
    ]

    # Calculate metrics
    total = len(incidents)
    recent = len(recent_incidents)

    verbal = sum(1 for i in incidents if i.get("action_type") == "verbal_warning")
    written = sum(1 for i in incidents if i.get("action_type") == "written_warning")
    pip = sum(1 for i in incidents if i.get("action_type") == "pip")
    terminations = sum(
        1
        for i in incidents
        if i.get("action_type") in ("termination_review", "termination")
    )

    # Calculate health score (0-100)
    # Lower is better
    incident_rate = recent / max(employees, 1) * 100

    if incident_rate < 1:
        health_score = 100
        status = "excellent"
    elif incident_rate < 3:
        health_score = 85
        status = "good"
    elif incident_rate < 5:
        health_score = 70
        status = "fair"
    elif incident_rate < 10:
        health_score = 50
        status = "poor"
    else:
        health_score = 25
        status = "critical"

    # Add penalty for severe incidents
    if terminations > 0:
        health_score = max(0, health_score - 10)
    if pip > 2:
        health_score = max(0, health_score - 5)

    return {
        "health_score": health_score,
        "status": status,
        "total_incidents": total,
        "recent_incidents": recent,
        "incidents_per_employee": round(incident_rate, 2),
        "breakdown": {
            "verbal_warnings": verbal,
            "written_warnings": written,
            "pip": pip,
            "terminations": terminations,
        },
        "trends": _analyze_trends(incidents),
    }


def _analyze_trends(incidents: list[dict[str, Any]]) -> str:
    """Analyze trends in incident data."""

    if len(incidents) < 3:
        return "Insufficient data for trend analysis"

    # Group by type
    type_counts = defaultdict(int)
    for incident in incidents:
        type_counts[incident.get("type", "unknown")] += 1

    # Find most common
    if type_counts:
        most_common = max(type_counts.items(), key=lambda x: x[1])
        return f"Most common issue: {most_common[0].replace('_', ' ')} ({most_common[1]} incidents)"

    return "No trend data available"


def identify_training_gaps(
    incidents: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Identify training gaps based on incident patterns.

    Per Lijo Joseph: "if I'm playing this out, I'm having onboarding issues...
    Maybe my training on onboarding sucks and maybe I need that recommendation."
    """

    # Group incidents by category
    category_issues = defaultdict(list)

    for incident in incidents:
        category = incident.get("category", "general")
        category_issues[category].append(incident)

    gaps = []
    for category, category_incidents in category_issues.items():
        if len(category_incidents) >= 2:
            gaps.append(
                {
                    "category": category,
                    "incident_count": len(category_incidents),
                    "recommendation": f"Review and update {category} training program",
                    "priority": "high" if len(category_incidents) >= 5 else "medium",
                    "affected_employees": len(
                        set(i.get("employee_id") for i in category_incidents)
                    ),
                }
            )

    # Sort by incident count
    gaps.sort(key=lambda x: x["incident_count"], reverse=True)
    return gaps


def format_dashboard_summary(
    manager_stats: list[dict[str, Any]],
    org_health: dict[str, Any],
    problem_managers: list[dict[str, Any]],
    training_gaps: list[dict[str, Any]],
) -> dict[str, Any]:
    """Format complete dashboard summary for HR."""

    return {
        "organization_health": org_health,
        "manager_performance": {
            "total_managers": len(manager_stats),
            "problem_managers": problem_managers,
            "top_performers": manager_stats[-3:] if len(manager_stats) >= 3 else [],
        },
        "training_insights": {
            "identified_gaps": training_gaps,
            "total_gaps": len(training_gaps),
        },
        "alerts": _generate_alerts(problem_managers, org_health, training_gaps),
    }


def _generate_alerts(
    problem_managers: list[dict[str, Any]],
    org_health: dict[str, Any],
    training_gaps: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Generate alerts based on dashboard data."""

    alerts = []

    # Organization health alerts
    if org_health.get("status") == "critical":
        alerts.append(
            {
                "type": "organization_health",
                "severity": "critical",
                "message": f"Organization health is critical (score: {org_health.get('health_score')})",
            }
        )
    elif org_health.get("status") == "poor":
        alerts.append(
            {
                "type": "organization_health",
                "severity": "warning",
                "message": "Organization health needs attention",
            }
        )

    # Problem manager alerts
    for manager in problem_managers[:3]:  # Top 3
        alerts.append(
            {
                "type": "problem_manager",
                "severity": "warning",
                "message": f"Manager {manager.get('manager_id')} has {manager.get('total_actions')} actions this period",
            }
        )

    # Training gap alerts
    for gap in training_gaps[:2]:  # Top 2
        alerts.append(
            {
                "type": "training_gap",
                "severity": "info",
                "message": f"Training gap identified: {gap.get('category')}",
            }
        )

    return alerts
