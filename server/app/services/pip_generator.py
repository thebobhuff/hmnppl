"""PIP Document Generator — creates formal Performance Improvement Plans.

Generates legally-sound PIP documents with:
- Specific performance deficiencies
- Improvement goals with measurable criteria
- Timeline for improvement
- Consequences of failure to improve
- Training provided
- Sign-off sections
"""

from __future__ import annotations

import logging
from typing import Any
from datetime import date, timedelta

logger = logging.getLogger(__name__)


def build_pip_document(
    employee_name: str,
    employee_title: str,
    department: str,
    manager_name: str,
    hr_rep_name: str,
    incident_summary: str,
    performance_issues: list[dict[str, Any]],
    improvement_goals: list[dict[str, Any]],
    training_provided: list[dict[str, Any]],
    start_date: date,
    review_period_days: int = 30,
    company_name: str = "The Company",
) -> dict[str, Any]:
    """Build a complete PIP document structure."""

    end_date = start_date + timedelta(days=review_period_days)

    document_sections = [
        _build_header(company_name, start_date),
        _build_employee_section(employee_name, employee_title, department),
        _build_purpose_section(incident_summary),
        _build_performance_issues_section(performance_issues),
        _build_improvement_goals_section(improvement_goals),
        _build_training_section(training_provided),
        _build_timeline_section(start_date, end_date, review_period_days),
        _build_consequences_section(),
        _build_acknowledgment_section(employee_name, manager_name, hr_rep_name),
    ]

    full_content = "\n\n".join(document_sections)

    return {
        "document_type": "pip",
        "title": "Performance Improvement Plan",
        "content": full_content,
        "sections": document_sections,
        "metadata": {
            "employee_name": employee_name,
            "manager_name": manager_name,
            "hr_rep_name": hr_rep_name,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "review_period_days": review_period_days,
        },
    }


def _build_header(company_name: str, effective_date: date) -> str:
    return f"""CONFIDENTIAL — PERFORMANCE IMPROVEMENT PLAN

{company_name}
Effective Date: {effective_date.strftime("%B %d, %Y")}

This Performance Improvement Plan ("PIP") outlines the expectations and requirements
for your continued employment. Please review this document carefully."""


def _build_employee_section(name: str, title: str, dept: str) -> str:
    return f"""EMPLOYEE INFORMATION

Employee Name: {name}
Job Title: {title}
Department: {dept}"""


def _build_purpose_section(summary: str) -> str:
    return f"""PURPOSE OF THIS IMPROVEMENT PLAN

This PIP is being implemented due to the following performance concerns:

{summary}

The purpose of this plan is to provide you with clear expectations, specific goals,
and a timeline to demonstrate sustained improvement in your job performance."""


def _build_performance_issues_section(issues: list[dict[str, Any]]) -> str:
    if not issues:
        return "PERFORMANCE CONCERNS\n[To be completed based on incident details]"

    content = "PERFORMANCE CONCERNS\n"
    for i, issue in enumerate(issues, 1):
        content += f"""
{i}. {issue.get("description", "Performance issue")}
   - Area: {issue.get("area", "General")}
   - Impact: {issue.get("impact", "See description")}
"""
    return content


def _build_goals_section(goals: list[dict[str, Any]]) -> str:
    if not goals:
        return "IMPROVEMENT GOALS\n[To be completed based on specific goals]"

    content = "IMPROVEMENT GOALS AND MEASURABLE CRITERIA\n"
    for i, goal in enumerate(goals, 1):
        content += f"""
{i}. {goal.get("description", "Goal description")}
   - Measurable Criteria: {goal.get("criteria", "As determined by manager")}
   - Target Date: {goal.get("target_date", "End of PIP period")}
"""
    return content


def _build_training_section(training: list[dict[str, Any]]) -> str:
    if not training:
        return "TRAINING PROVIDED\n[To be completed based on training history]"

    content = "TRAINING AND SUPPORT PROVIDED\n"
    for i, t in enumerate(training, 1):
        content += f"""
{i}. {t.get("type", "Training")}
   - Date Completed: {t.get("date_completed", "N/A")}
   - Provider: {t.get("provider", "Company")}
"""
    return content


def _build_timeline_section(start: date, end: date, days: int) -> str:
    return f"""TIMELINE AND REVIEW SCHEDULE

Start Date: {start.strftime("%B %d, %Y")}
End Date: {end.strftime("%B %d, %Y")}
Review Period: {days} days

Review Meetings:
- Week 1: Initial check-in to review understanding of expectations
- Week 2: Progress review meeting
- Week 3: Mid-point review
- Final: Comprehensive review at end of PIP period"""


def _build_consequences_section() -> str:
    return """CONSEQUENCES

If satisfactory improvement is not achieved by the end of the review period,
further disciplinary action up to and including termination of employment may result.

By signing below, you acknowledge receipt of this Performance Improvement Plan.
This does not constitute a guarantee of continued employment."""


def _build_acknowledgment_section(employee: str, manager: str, hr: str) -> str:
    return f"""ACKNOWLEDGMENT AND SIGNATURES

Employee Signature: _________________________    Date: ____________
Printed Name: {employee}

Manager Signature: _________________________    Date: ____________
Printed Name: {manager}

HR Representative: _________________________    Date: ____________
Printed Name: {hr}

---
CONFIDENTIAL — FOR HR FILES ONLY"""


def build_pip_from_interview_data(
    interview_data: dict[str, Any],
    escalation_data: dict[str, Any],
) -> dict[str, Any]:
    """Build PIP document from agent interview and escalation data."""

    # Extract key information from interview
    employee_name = interview_data.get("employee_name", "Employee")
    manager_name = interview_data.get("manager_name", "Manager")
    incident_summary = interview_data.get("incident_description", "")

    # Build performance issues from interview findings
    performance_issues = [
        {
            "description": "Performance concern identified",
            "area": escalation_data.get("escalation_level", "general"),
            "impact": "See incident description",
        }
    ]

    # Build improvement goals
    improvement_goals = [
        {
            "description": "Meet attendance expectations",
            "criteria": "Zero unexcused absences for 30 days",
            "target_date": "End of PIP",
        }
    ]

    # Get training gaps from escalation
    training_gaps = escalation_data.get("training_gaps", [])
    training_provided = [
        {"type": gap, "date_completed": "N/A", "provider": "Company"}
        for gap in training_gaps
    ]

    return build_pip_document(
        employee_name=employee_name,
        employee_title="Employee",
        department="TBD",
        manager_name=manager_name,
        hr_rep_name="HR Representative",
        incident_summary=incident_summary,
        performance_issues=performance_issues,
        improvement_goals=improvement_goals,
        training_provided=training_provided,
        start_date=date.today(),
        review_period_days=30,
    )
