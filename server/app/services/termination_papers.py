"""State-Specific Termination Paperwork Service.

Generates state-specific termination documents based on jurisdiction.
Per Lijo Joseph's requirements:
- California: separation notification, Cal OSHA documentation, Cobra
- All states: final paycheck considerations, etc.
"""

from __future__ import annotations

import logging
from typing import Any
from datetime import date, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class StateCode(str, Enum):
    CALIFORNIA = "CA"
    TEXAS = "TX"
    NEW_YORK = "NY"
    FLORIDA = "FL"
    WASHINGTON = "WA"
    ILLINOIS = "IL"
    MASSACHUSETTS = "MA"
    PENNSYLVANIA = "PA"
    OHIO = "OH"
    GEORGIA = "GA"
    DEFAULT = "OTHER"


class TerminationReason(str, Enum):
    PERFORMANCE = "performance"
    CONDUCT = "conduct"
    ATTENDANCE = "attendance"
    REDUCTION_IN_FORCE = "reduction_in_force"
    VIOLATION = "violation"
    OTHER = "other"


def get_state_requirements(state_code: str) -> dict[str, Any]:
    """Get termination requirements for a given state."""

    state_requirements = {
        StateCode.CALIFORNIA.value: {
            "requires_separation_notice": True,
            "requires_osha_notification": True,
            "requires_cobra_notice": True,
            "final_pay_deadline": "immediately",
            "waiting_period_for_unemployment": "1 week",
            "required_forms": [
                "DE 678 (Wage Breakdown)",
                "COBRA Notice",
                "EDD Notice",
                "Cal/OSHA Form 300 (if workplace illness/injury)",
            ],
            "special_rules": [
                "Pay must include accrued vacation",
                "Immediate termination allowed for cause",
                "PIP required before termination for performance",
            ],
        },
        StateCode.TEXAS.value: {
            "requires_separation_notice": False,
            "requires_osha_notification": False,
            "requires_cobra_notice": True,
            "final_pay_deadline": "next pay period",
            "waiting_period_for_unemployment": "1 week",
            "required_forms": ["COBRA Notice"],
            "special_rules": ["No state income tax", "At-will employment"],
        },
        StateCode.NEW_YORK.value: {
            "requires_separation_notice": True,
            "requires_osha_notification": False,
            "requires_cobra_notice": True,
            "final_pay_deadline": "next pay period",
            "waiting_period_for_unemployment": "1 week",
            "required_forms": [
                "COBRA Notice",
                "NYS-45 (if applicable)",
            ],
            "special_rules": [
                "Accrued vacation must be paid",
                "Final paycheck includes accrued but unused vacation",
            ],
        },
        StateCode.FLORIDA.value: {
            "requires_separation_notice": False,
            "requires_osha_notification": False,
            "requires_cobra_notice": True,
            "final_pay_deadline": "next pay period",
            "waiting_period_for_unemployment": "1 week",
            "required_forms": ["COBRA Notice"],
            "special_rules": ["At-will employment", "No state income tax"],
        },
        StateCode.WASHINGTON.value: {
            "requires_separation_notice": True,
            "requires_osha_notification": True,
            "requires_cobra_notice": True,
            "final_pay_deadline": "next pay period",
            "waiting_period_for_unemployment": "1 week",
            "required_forms": [
                "COBRA Notice",
                "WA Paid Family Leave notice",
            ],
            "special_rules": ["PIP recommended before termination"],
        },
    }

    default_requirements = {
        "requires_separation_notice": False,
        "requires_osha_notification": False,
        "requires_cobra_notice": True,
        "final_pay_deadline": "next pay period",
        "waiting_period_for_unemployment": "1 week",
        "required_forms": ["COBRA Notice"],
        "special_rules": ["At-will employment"],
    }

    return state_requirements.get(state_code, default_requirements)


def build_termination_package(
    employee_name: str,
    employee_address: str,
    employee_id: str,
    termination_date: date,
    termination_reason: str,
    state_code: str,
    company_name: str = "The Company",
    manager_name: str = "Manager",
    hr_rep_name: str = "HR Representative",
) -> dict[str, Any]:
    """Build a complete termination documentation package."""

    requirements = get_state_requirements(state_code)
    documents = []

    # Base separation notice (all states)
    if requirements.get("requires_separation_notice"):
        documents.append(
            _build_separation_notice(
                employee_name,
                employee_address,
                termination_date,
                termination_reason,
                company_name,
                state_code,
            )
        )

    # California-specific documents
    if state_code == StateCode.CALIFORNIA.value:
        documents.append(
            _build_california_death_form(employee_name, termination_date, company_name)
        )
        documents.append(
            _build_california_osha_notice(employee_name, termination_date, company_name)
        )
        documents.append(
            _build_california_cobra_notice(
                employee_name, employee_address, termination_date, company_name
            )
        )

    # COBRA notice (federal requirement)
    if requirements.get("requires_cobra_notice"):
        documents.append(
            _build_cobra_notice(
                employee_name, employee_address, termination_date, company_name
            )
        )

    # Final paycheck notice
    documents.append(
        _build_final_paycheck_notice(
            employee_name,
            termination_date,
            requirements.get("final_pay_deadline", "next pay period"),
            company_name,
        )
    )

    return {
        "package_type": "termination",
        "state": state_code,
        "documents": documents,
        "required_forms": requirements.get("required_forms", []),
        "special_rules": requirements.get("special_rules", []),
        "metadata": {
            "employee_name": employee_name,
            "termination_date": termination_date.isoformat(),
            "termination_reason": termination_reason,
            "generated_at": date.today().isoformat(),
        },
    }


def _build_separation_notice(
    employee_name: str,
    employee_address: str,
    termination_date: date,
    reason: str,
    company_name: str,
    state: str,
) -> dict[str, Any]:
    return {
        "type": "separation_notice",
        "title": f"Employment Separation Notice — {state}",
        "content": f"""NOTICE OF EMPLOYMENT SEPARATION

Date: {termination_date.strftime("%B %d, %Y")}

Employee: {employee_name}
Address: {employee_address}

Effective Date of Separation: {termination_date.strftime("%B %d, %Y")}

Reason for Separation: {reason.replace("_", " ").title()}

This notice is provided in compliance with state requirements.

FINAL PAYMENT:
Your final paycheck will be issued according to state law.

CONTINUED HEALTH COVERAGE:
Information about continuing health coverage will be provided under separate cover (COBRA).

UNEMPLOYMENT INSURANCE:
You may be eligible for unemployment insurance benefits. Contact your state's unemployment office.

{company_name}
""",
    }


def _build_california_death_form(
    employee_name: str,
    termination_date: date,
    company_name: str,
) -> dict[str, Any]:
    return {
        "type": "california_death_form",
        "title": "California Form DE 232 (Record of Employment)",
        "content": f"""CALIFORNIA EMPLOYMENT DEVELOPMENT DEPARTMENT
RECORD OF EMPLOYMENT (DE 232)

Employee: {employee_name}
Separation Date: {termination_date.strftime("%B %d, %Y")}

Reason for Separation: [To be completed]

Wage Information:
- Last Day Worked: {termination_date.strftime("%B %d, %Y")}
- Final Pay Date: Per California law
- Wages Paid at Separation: $0.00
- Vacation/Paid Time Off: [To be calculated]

Employer: {company_name}

---
Complete and submit to EDD within 48 hours of separation.
""",
    }


def _build_california_osha_notice(
    employee_name: str,
    termination_date: date,
    company_name: str,
) -> dict[str, Any]:
    return {
        "type": "california_osha_notice",
        "title": "Cal/OSHA Notice Requirements",
        "content": f"""CAL/OSHA WORKPLACE SAFETY NOTICE

Date: {termination_date.strftime("%B %d, %Y")}

This notice confirms that employment has been terminated.

Note: If this termination is related to a workplace illness or injury,
Cal/OSHA Form 300 must be completed and maintained.

Employer: {company_name}
Employee: {employee_name}

---
For workplace safety compliance questions, contact Cal/OSHA.
""",
    }


def _build_california_cobra_notice(
    employee_name: str,
    employee_address: str,
    termination_date: date,
    company_name: str,
) -> dict[str, Any]:
    return {
        "type": "cobra_notice",
        "title": "California COBRA Continuation Coverage Notice",
        "content": f"""IMPORTANT NOTICE OF CONTINUATION COVERAGE RIGHTS

Date: {termination_date.strftime("%B %d, %Y")}

To: {employee_name}
Address: {employee_address}

RE: Continuation of Group Health Coverage

Dear {employee_name}:

Your group health coverage will end on {termination_date.strftime("%B %d, %Y")}.
Under the Consolidated Omnibus Budget Reconciliation Act (COBRA), you have the right
to continue this coverage for a limited period.

CALIFORNIA SPECIFIC:
California law provides additional continuation coverage rights beyond federal COBRA.
You may be eligible for coverage through Cal-COBRA.

IMPORTANT DEADLINES:
- You have 60 days to elect COBRA coverage
- If you do not elect coverage within 60 days, your rights to continue coverage will end

To elect coverage, contact:
[HR Department Contact Information]

{company_name}
""",
    }


def _build_cobra_notice(
    employee_name: str,
    employee_address: str,
    termination_date: date,
    company_name: str,
) -> dict[str, Any]:
    return {
        "type": "cobra_notice",
        "title": "COBRA Continuation Coverage Notice",
        "content": f"""IMPORTANT NOTICE OF CONTINUATION COVERAGE RIGHTS

Date: {termination_date.strftime("%B %d, %Y")}

To: {employee_name}
Address: {employee_address}

RE: Continuation of Group Health Coverage Under COBRA

Dear {employee_name}:

Your group health coverage will end on {termination_date.strftime("%B %d, %Y")} due to
your termination of employment.

WHAT IS COBRA?
COBRA is a federal law that allows you to continue your group health coverage for
a limited period of time after your employment ends.

HOW LONG CAN YOU CONTINUE COVERAGE?
- Generally 18 months for termination
- Can be extended to 29 months if you are disabled

WHAT YOU NEED TO DO:
- You have 60 days from the date you receive this notice to elect coverage
- If you have questions, contact your Plan Administrator

IMPORTANT:
If you do not elect COBRA coverage within 60 days, you will lose all rights to
continue your group health coverage.

{company_name}
""",
    }


def _build_final_paycheck_notice(
    employee_name: str,
    termination_date: date,
    deadline: str,
    company_name: str,
) -> dict[str, Any]:
    return {
        "type": "final_paycheck_notice",
        "title": "Final Paycheck Information",
        "content": f"""FINAL PAYCHECK INFORMATION

Date: {termination_date.strftime("%B %d, %Y")}

Employee: {employee_name}

Your final paycheck will be issued: {deadline}

This paycheck will include:
- Wages earned through your last day of employment
- Any accrued but unused vacation/PTO (if applicable)
- Any earned commissions or bonuses (if applicable)

Direct deposit will be processed according to your existing authorization.

If you have questions about your final paycheck, please contact Payroll.

{company_name}
""",
    }


def get_state_list() -> list[dict[str, str]]:
    """Return list of supported states with their codes."""
    return [
        {"code": "CA", "name": "California"},
        {"code": "TX", "name": "Texas"},
        {"code": "NY", "name": "New York"},
        {"code": "FL", "name": "Florida"},
        {"code": "WA", "name": "Washington"},
        {"code": "IL", "name": "Illinois"},
        {"code": "MA", "name": "Massachusetts"},
        {"code": "PA", "name": "Pennsylvania"},
        {"code": "OH", "name": "Ohio"},
        {"code": "GA", "name": "Georgia"},
    ]
