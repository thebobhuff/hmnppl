"""Multi-Layer Compliance Engine.

Supports country, state, county, and city labor law layers.
Companies operating across jurisdictions get a merged compliance view.

Layer hierarchy (most specific wins on conflict):
  country > state > county > city

Each layer can override or extend the layer above it.
"""

from __future__ import annotations
import logging
from typing import Any
from enum import Enum

logger = logging.getLogger(__name__)


class ComplianceLayer(str, Enum):
    COUNTRY = "country"
    STATE = "state"
    COUNTY = "county"
    CITY = "city"


# Precedence: higher number = more specific = wins on conflict
LAYER_PRECEDENCE = {
    ComplianceLayer.COUNTRY: 1,
    ComplianceLayer.STATE: 2,
    ComplianceLayer.COUNTY: 3,
    ComplianceLayer.CITY: 4,
}


# ---- Default Rule Sets ----

FEDERAL_US: dict[str, Any] = {
    "layer": "country",
    "jurisdiction": "US",
    "rules": {
        "minimum_wage": 7.25,
        "overtime_threshold_hours": 40,
        "overtime_rate": 1.5,
        "meal_break_required": False,
        "rest_break_required": False,
        "at_will_employment": True,
        "anti_discrimination_protected_classes": [
            "race", "color", "religion", "sex", "national_origin",
            "age", "disability", "genetic_info", "pregnancy",
        ],
        "cobra_required": True,
        "fmla_eligibility_weeks": 1250,  # hours worked in 12 months
        "fmla_leave_weeks": 12,
        "final_pay_deadline": "next_regular_payday",
        "overtime_exempt_roles": ["executive", "administrative", "professional"],
        "termination_documentation": ["COBRA Notice"],
        "new_hire_reporting_days": 20,
    },
}

STATE_RULES: dict[str, dict[str, Any]] = {
    "CA": {
        "layer": "state",
        "jurisdiction": "CA",
        "overrides": {
            "minimum_wage": 16.00,
            "meal_break_required": True,
            "meal_break_hours_threshold": 5,
            "rest_break_required": True,
            "rest_break_interval_hours": 4,
            "at_will_employment": True,
            "final_pay_deadline": "immediately",
            "anti_discrimination_protected_classes": [
                "race", "color", "religion", "sex", "national_origin",
                "age", "disability", "genetic_info", "pregnancy",
                "sexual_orientation", "gender_identity", "marital_status",
                "military_veteran", "medical_condition",
            ],
            "pregnancy_disability_leave_weeks": 4,
            "paid_sick_leave_accrual_rate": "1_hour_per_30_worked",
            "termination_documentation": [
                "COBRA Notice", "Cal-COBRA Notice", "EDD DE 232",
                "Final Paycheck (same day)",
            ],
            "new_hire_reporting_days": 20,
            "pip_required_before_termination_for_performance": True,
            "separation_notice_required": True,
        },
    },
    "TX": {
        "layer": "state",
        "jurisdiction": "TX",
        "overrides": {
            "minimum_wage": 7.25,  # follows federal
            "at_will_employment": True,
            "anti_discrimination_protected_classes": [
                "race", "color", "religion", "sex", "national_origin",
                "age", "disability",
            ],
            "final_pay_deadline": "next_pay_period",
            "termination_documentation": ["COBRA Notice"],
            "new_hire_reporting_days": 20,
        },
    },
    "NY": {
        "layer": "state",
        "jurisdiction": "NY",
        "overrides": {
            "minimum_wage": 15.00,
            "meal_break_required": True,
            "meal_break_hours_threshold": 6,
            "anti_discrimination_protected_classes": [
                "race", "color", "religion", "sex", "national_origin",
                "age", "disability", "genetic_info", "pregnancy",
                "sexual_orientation", "gender_identity", "marital_status",
                "military_status", "domestic_violence_victim",
            ],
            "paid_family_leave": True,
            "paid_family_leave_weeks": 12,
            "final_pay_deadline": "next_pay_period",
            "separation_notice_required": True,
            "termination_documentation": ["COBRA Notice", "NYS Separation Notice"],
            "new_hire_reporting_days": 20,
        },
    },
    "FL": {
        "layer": "state",
        "jurisdiction": "FL",
        "overrides": {
            "minimum_wage": 13.00,
            "at_will_employment": True,
            "final_pay_deadline": "next_pay_period",
            "termination_documentation": ["COBRA Notice"],
            "new_hire_reporting_days": 20,
        },
    },
}

# County/City overrides for specific jurisdictions
LOCAL_RULES: dict[str, dict[str, Any]] = {
    # California cities/counties with higher minimums
    "CA-SF": {  # San Francisco
        "layer": "city",
        "jurisdiction": "San Francisco, CA",
        "parent": "CA",
        "overrides": {
            "minimum_wage": 18.07,
            "paid_sick_leave": True,
            "healthcare_expenditure_required": True,
        },
    },
    "CA-LA": {  # Los Angeles
        "layer": "city",
        "jurisdiction": "Los Angeles, CA",
        "parent": "CA",
        "overrides": {
            "minimum_wage": 17.28,
            "paid_sick_leave": True,
            "fair_chance_hiring": True,  # ban the box
        },
    },
    "CA-Berkeley": {
        "layer": "city",
        "jurisdiction": "Berkeley, CA",
        "parent": "CA",
        "overrides": {
            "minimum_wage": 18.07,
        },
    },
    # NYC has its own layer on top of NY state
    "NY-NYC": {
        "layer": "city",
        "jurisdiction": "New York City, NY",
        "parent": "NY",
        "overrides": {
            "minimum_wage": 16.00,
            "paid_safe_and_sick_leave": True,
            "fair_chance_hiring": True,
            "salary_transparency_required": True,
        },
    },
    # Cook County (Chicago area)
    "IL-Cook": {
        "layer": "county",
        "jurisdiction": "Cook County, IL",
        "parent": "IL",
        "overrides": {
            "minimum_wage": 14.00,
            "paid_sick_leave": True,
        },
    },
    "IL-Chicago": {
        "layer": "city",
        "jurisdiction": "Chicago, IL",
        "parent": "IL-Cook",
        "overrides": {
            "minimum_wage": 16.20,
            "paid_sick_leave": True,
            "fair_chance_hiring": True,
        },
    },
}


class ComplianceEngine:
    """Merges compliance rules across jurisdictional layers."""

    def get_merged_rules(
        self,
        country: str = "US",
        state: str | None = None,
        county: str | None = None,
        city: str | None = None,
    ) -> dict[str, Any]:
        """Get merged compliance rules for a specific location.

        Applies layers from broad (country) to specific (city),
        with more specific layers overriding broader ones.
        """
        # Start with federal/base rules
        merged = self._get_base_rules(country)
        layers_applied = [{"layer": "country", "jurisdiction": country}]

        # Apply state override
        if state and state in STATE_RULES:
            state_rule = STATE_RULES[state]
            merged["rules"].update(state_rule.get("overrides", {}))
            layers_applied.append({"layer": "state", "jurisdiction": state})

        # Apply county/city overrides
        local_key = None
        if state and city:
            local_key = f"{state}-{city}"
        elif state and county:
            local_key = f"{state}-{county}"

        if local_key and local_key in LOCAL_RULES:
            local_rule = LOCAL_RULES[local_key]
            merged["rules"].update(local_rule.get("overrides", {}))
            layers_applied.append({
                "layer": local_rule["layer"],
                "jurisdiction": local_rule["jurisdiction"],
            })

        return {
            "merged_rules": merged["rules"],
            "layers_applied": layers_applied,
            "jurisdiction": {
                "country": country,
                "state": state,
                "county": county,
                "city": city,
            },
        }

    def get_termination_requirements(
        self,
        country: str = "US",
        state: str | None = None,
        county: str | None = None,
        city: str | None = None,
    ) -> dict[str, Any]:
        """Get termination-specific requirements for a jurisdiction."""
        merged = self.get_merged_rules(country, state, county, city)
        rules = merged["merged_rules"]

        return {
            "final_pay_deadline": rules.get("final_pay_deadline", "next_pay_period"),
            "required_documents": rules.get("termination_documentation", ["COBRA Notice"]),
            "cobra_required": rules.get("cobra_required", True),
            "pip_required_for_performance": rules.get("pip_required_before_termination_for_performance", False),
            "separation_notice_required": rules.get("separation_notice_required", False),
            "at_will": rules.get("at_will_employment", True),
            "protected_classes": rules.get("anti_discrimination_protected_classes", []),
            "layers_applied": merged["layers_applied"],
        }

    def get_minimum_wage(
        self,
        country: str = "US",
        state: str | None = None,
        county: str | None = None,
        city: str | None = None,
    ) -> dict[str, Any]:
        """Get applicable minimum wage for a jurisdiction."""
        merged = self.get_merged_rules(country, state, county, city)
        rules = merged["merged_rules"]
        return {
            "minimum_wage": rules.get("minimum_wage", 7.25),
            "jurisdiction": merged["jurisdiction"],
            "layers_applied": merged["layers_applied"],
        }

    def get_protected_classes(
        self,
        country: str = "US",
        state: str | None = None,
        county: str | None = None,
        city: str | None = None,
    ) -> dict[str, Any]:
        """Get all applicable protected classes for a jurisdiction."""
        merged = self.get_merged_rules(country, state, county, city)
        return {
            "protected_classes": merged["merged_rules"].get("anti_discrimination_protected_classes", []),
            "jurisdiction": merged["jurisdiction"],
        }

    def get_supported_jurisdictions(self) -> dict[str, Any]:
        """List all supported jurisdictions."""
        states = list(STATE_RULES.keys())
        locals_list = [
            {"code": k, "jurisdiction": v["jurisdiction"], "layer": v["layer"]}
            for k, v in LOCAL_RULES.items()
        ]
        return {
            "country": ["US"],
            "states": states,
            "local": locals_list,
            "total_jurisdictions": 1 + len(states) + len(locals_list),
        }

    def _get_base_rules(self, country: str) -> dict[str, Any]:
        if country == "US":
            return {
                "layer": "country",
                "jurisdiction": country,
                "rules": dict(FEDERAL_US["rules"]),  # copy to avoid mutation
            }
        # Default to US rules for unknown countries
        return {
            "layer": "country",
            "jurisdiction": country,
            "rules": dict(FEDERAL_US["rules"]),
        }


# Singleton instance
compliance_engine = ComplianceEngine()
