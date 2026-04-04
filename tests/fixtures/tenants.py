"""Multi-tenant test fixture: two complete companies with full data trees.

This module provides the ``two_companies_fixture`` that creates:

Company A ("TestCo Alpha"):
    - 1 company_admin
    - 1 hr_agent
    - 2 managers (each with 2 direct reports)
    - 4 employees (2 per manager)
    - 1 department
    - 2 active policies
    - 3 incidents (various types/severities)
    - 1 disciplinary action
    - 1 document (with signature)
    - 1 meeting (with participants)
    - 2 notifications

Company B ("TestCo Beta"):
    - Mirror of Company A with different names/UUIDs/data
    - Cross-links: Company A users CANNOT see Company B data

Usage in tests::

    @pytest.fixture(scope="session")
    def test_tenants(service_cur):
        data = two_companies_fixture(service_cur)
        yield data
        clean_test_data(...)

All UUIDs are deterministic (UUID v5 from DNS namespace) so tests are
fully reproducible across runs.
"""

from __future__ import annotations

from typing import Any

import psycopg2.extras

from tests.conftest import clean_test_data, uuid_v5
from tests.factories.companies import create_company
from tests.factories.users import create_department, create_user
from tests.factories.policies import create_policy, create_policy_version
from tests.factories.incidents import create_incident, create_disciplinary_action
from tests.factories.documents import (
    create_signed_document,
    create_meeting,
    create_notification,
)


# ===========================================================================
# Deterministic UUIDs
# ===========================================================================
# Using uuid5 with descriptive names ensures stability across test runs.

# Company A
CO_A_ID = uuid_v5("company-alpha")
CO_A_DEPT_ID = uuid_v5("company-alpha-dept-engineering")
CO_A_ADMIN_ID = uuid_v5("company-alpha-admin")
CO_A_HR_ID = uuid_v5("company-alpha-hr-agent")
CO_A_MGR1_ID = uuid_v5("company-alpha-manager-1")
CO_A_MGR2_ID = uuid_v5("company-alpha-manager-2")
CO_A_EMP1_ID = uuid_v5("company-alpha-employee-1")
CO_A_EMP2_ID = uuid_v5("company-alpha-employee-2")
CO_A_EMP3_ID = uuid_v5("company-alpha-employee-3")
CO_A_EMP4_ID = uuid_v5("company-alpha-employee-4")
CO_A_POLICY1_ID = uuid_v5("company-alpha-policy-attendance")
CO_A_POLICY2_ID = uuid_v5("company-alpha-policy-misconduct")
CO_A_INC1_ID = uuid_v5("company-alpha-incident-1")
CO_A_INC2_ID = uuid_v5("company-alpha-incident-2")
CO_A_INC3_ID = uuid_v5("company-alpha-incident-3")
CO_A_DISC_ACT_ID = uuid_v5("company-alpha-disciplinary-action-1")
CO_A_DOC_ID = uuid_v5("company-alpha-document-1")

# Company B
CO_B_ID = uuid_v5("company-beta")
CO_B_DEPT_ID = uuid_v5("company-beta-dept-sales")
CO_B_ADMIN_ID = uuid_v5("company-beta-admin")
CO_B_HR_ID = uuid_v5("company-beta-hr-agent")
CO_B_MGR1_ID = uuid_v5("company-beta-manager-1")
CO_B_MGR2_ID = uuid_v5("company-beta-manager-2")
CO_B_EMP1_ID = uuid_v5("company-beta-employee-1")
CO_B_EMP2_ID = uuid_v5("company-beta-employee-2")
CO_B_EMP3_ID = uuid_v5("company-beta-employee-3")
CO_B_EMP4_ID = uuid_v5("company-beta-employee-4")
CO_B_POLICY1_ID = uuid_v5("company-beta-policy-attendance")
CO_B_POLICY2_ID = uuid_v5("company-beta-policy-performance")
CO_B_INC1_ID = uuid_v5("company-beta-incident-1")
CO_B_INC2_ID = uuid_v5("company-beta-incident-2")
CO_B_INC3_ID = uuid_v5("company-beta-incident-3")
CO_B_DISC_ACT_ID = uuid_v5("company-beta-disciplinary-action-1")
CO_B_DOC_ID = uuid_v5("company-beta-document-1")

# Super Admin (platform-wide, belongs to Company A for FK purposes)
SUPER_ADMIN_ID = uuid_v5("super-admin-platform")
# We assign super_admin to Company A but they should see all tenants.
# In practice, super_admin RLS policies may require special handling.
# For this test fixture, we place them in Company A.


def two_companies_fixture(cur: psycopg2.extras.RealDictCursor) -> dict[str, Any]:
    """Create two fully populated company tenants and return all created data.

    This function is idempotent-safe: it deletes any existing test data
    matching the ``TestCo`` prefix before creating new records.

    Args:
        cur: A service-role RealDictCursor (bypasses RLS).

    Returns:
        Nested dict with all created entities organized by company.
    """
    # ------------------------------------------------------------------
    # Cleanup any prior test data (idempotent)
    # ------------------------------------------------------------------
    clean_test_data(cur.connection, prefix="TestCo")

    data: dict[str, Any] = {}

    # ==================================================================
    # Company A — "TestCo Alpha"
    # ==================================================================
    company_a = create_company(
        cur,
        id=CO_A_ID,
        name="TestCo Alpha",
        industry="Technology",
        size="51-200",
        country="US",
        region="California",
        subscription_tier="professional",
    )

    dept_a = create_department(
        cur,
        id=CO_A_DEPT_ID,
        company_id=CO_A_ID,
        name="Engineering",
    )

    # Users — Company A
    admin_a = create_user(
        cur,
        id=CO_A_ADMIN_ID,
        company_id=CO_A_ID,
        role="company_admin",
        first_name="Alice",
        last_name="Admin",
        email="alice.admin@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="VP of Operations",
        hire_date="2022-01-10",
    )
    hr_a = create_user(
        cur,
        id=CO_A_HR_ID,
        company_id=CO_A_ID,
        role="hr_agent",
        first_name="Helen",
        last_name="HR",
        email="helen.hr@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="HR Specialist",
        hire_date="2022-03-15",
    )
    mgr1_a = create_user(
        cur,
        id=CO_A_MGR1_ID,
        company_id=CO_A_ID,
        role="manager",
        first_name="Mark",
        last_name="Manager",
        email="mark.manager@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="Engineering Manager",
        manager_id=CO_A_ADMIN_ID,
        hire_date="2022-06-01",
    )
    mgr2_a = create_user(
        cur,
        id=CO_A_MGR2_ID,
        company_id=CO_A_ID,
        role="manager",
        first_name="Monica",
        last_name="ManagerTwo",
        email="monica.manager2@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="QA Manager",
        manager_id=CO_A_ADMIN_ID,
        hire_date="2022-07-01",
    )
    emp1_a = create_user(
        cur,
        id=CO_A_EMP1_ID,
        company_id=CO_A_ID,
        role="employee",
        first_name="Eddie",
        last_name="Employee",
        email="eddie.employee@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="Software Engineer",
        manager_id=CO_A_MGR1_ID,
        hire_date="2023-01-15",
    )
    emp2_a = create_user(
        cur,
        id=CO_A_EMP2_ID,
        company_id=CO_A_ID,
        role="employee",
        first_name="Eva",
        last_name="EmployeeTwo",
        email="eva.employee2@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="Software Engineer",
        manager_id=CO_A_MGR1_ID,
        hire_date="2023-02-01",
    )
    emp3_a = create_user(
        cur,
        id=CO_A_EMP3_ID,
        company_id=CO_A_ID,
        role="employee",
        first_name="Eric",
        last_name="EmployeeThree",
        email="eric.employee3@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="QA Engineer",
        manager_id=CO_A_MGR2_ID,
        hire_date="2023-03-01",
    )
    emp4_a = create_user(
        cur,
        id=CO_A_EMP4_ID,
        company_id=CO_A_ID,
        role="employee",
        first_name="Ellen",
        last_name="EmployeeFour",
        email="ellen.employee4@testco-alpha.test",
        department_id=CO_A_DEPT_ID,
        job_title="QA Engineer",
        manager_id=CO_A_MGR2_ID,
        hire_date="2023-04-01",
    )
    super_admin = create_user(
        cur,
        id=SUPER_ADMIN_ID,
        company_id=CO_A_ID,
        role="super_admin",
        first_name="Super",
        last_name="Admin",
        email="super.admin@platform.test",
        department_id=CO_A_DEPT_ID,
        job_title="Platform Administrator",
        hire_date="2021-01-01",
    )

    # Update department head
    cur.execute(
        "UPDATE departments SET head_id = %s WHERE id = %s;",
        (CO_A_MGR1_ID, CO_A_DEPT_ID),
    )

    # Policies — Company A
    policy1_a = create_policy(
        cur,
        id=CO_A_POLICY1_ID,
        company_id=CO_A_ID,
        category="attendance",
        title="TestCo Alpha Attendance Policy",
        content="## Attendance Policy for TestCo Alpha\n\nAll employees must arrive on time.",
        rules=[
            {
                "id": "ATT-01",
                "description": "Tardy >10min",
                "threshold_count": 1,
                "severity": "low",
            },
            {
                "id": "ATT-02",
                "description": "Unexcused absence",
                "threshold_count": 1,
                "severity": "high",
            },
        ],
        severity_levels={
            "tardiness": {"first": "low", "repeat": "medium"},
            "absence": {"first": "high"},
        },
        is_active=True,
        version=1,
        created_by=CO_A_HR_ID,
    )
    policy2_a = create_policy(
        cur,
        id=CO_A_POLICY2_ID,
        company_id=CO_A_ID,
        category="misconduct",
        title="TestCo Alpha Misconduct Policy",
        content="## Misconduct Policy for TestCo Alpha\n\nProfessional behavior is expected.",
        is_active=True,
        version=1,
        created_by=CO_A_HR_ID,
    )

    # Policy versions
    pv1_a = create_policy_version(
        cur,
        policy_id=CO_A_POLICY1_ID,
        version=1,
        content="## Attendance Policy v1",
        created_by=CO_A_HR_ID,
    )

    # Incidents — Company A
    inc1_a = create_incident(
        cur,
        id=CO_A_INC1_ID,
        company_id=CO_A_ID,
        employee_id=CO_A_EMP1_ID,
        reporter_id=CO_A_MGR1_ID,
        reference_number="ALPHA-001",
        type="tardiness",
        description="Employee arrived 25 minutes late without notification.",
        incident_date="2025-01-15",
        severity="low",
        status="pending_hr_review",
        linked_policy_id=CO_A_POLICY1_ID,
        witnesses=[CO_A_EMP2_ID],
    )
    inc2_a = create_incident(
        cur,
        id=CO_A_INC2_ID,
        company_id=CO_A_ID,
        employee_id=CO_A_EMP2_ID,
        reporter_id=CO_A_MGR1_ID,
        reference_number="ALPHA-002",
        type="misconduct",
        description="Disruptive behavior during team standup.",
        incident_date="2025-01-20",
        severity="medium",
        status="ai_evaluated",
        ai_confidence_score=0.88,
        ai_evaluation_status="complete",
    )
    inc3_a = create_incident(
        cur,
        id=CO_A_INC3_ID,
        company_id=CO_A_ID,
        employee_id=CO_A_EMP3_ID,
        reporter_id=CO_A_MGR2_ID,
        reference_number="ALPHA-003",
        type="absence",
        description="No-call no-show for scheduled shift.",
        incident_date="2025-02-01",
        severity="high",
        status="approved",
        previous_incident_count=1,
    )

    # Disciplinary action — Company A
    disc_a = create_disciplinary_action(
        cur,
        incident_id=CO_A_INC3_ID,
        company_id=CO_A_ID,
        employee_id=CO_A_EMP3_ID,
        action_type="verbal_warning",
        status="pending_approval",
    )

    # Document — Company A
    doc_a = create_signed_document(
        cur,
        company_id=CO_A_ID,
        doc_id=CO_A_DOC_ID,
        created_by=CO_A_HR_ID,
        type="verbal_warning",
        title="Verbal Warning — Eric EmployeeThree",
        content="This document serves as a verbal warning for unexcused absence.",
        status="pending_signature",
        version=1,
        signer_id=CO_A_EMP3_ID,
        signer_role="employee",
        signature_data="Eric EmployeeThree — typed signature",
        content_hash="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    )

    # Meeting — Company A
    meeting_a = create_meeting(
        cur,
        disciplinary_action_id=disc_a["id"],
        company_id=CO_A_ID,
        type="disciplinary",
        agenda="Discuss unexcused absence and verbal warning.",
        scheduled_at="2025-02-05T10:00:00Z",
        duration_minutes=30,
        participants=[
            {"user_id": CO_A_EMP3_ID, "role": "subject"},
            {"user_id": CO_A_MGR2_ID, "role": "manager"},
            {"user_id": CO_A_HR_ID, "role": "hr_agent"},
        ],
    )

    # Notifications — Company A
    notif1_a = create_notification(
        cur,
        company_id=CO_A_ID,
        user_id=CO_A_EMP1_ID,
        type="incident_submitted",
        title="Incident Filed",
        message="An incident has been filed regarding tardiness.",
        entity_type="incident",
        entity_id=CO_A_INC1_ID,
    )
    notif2_a = create_notification(
        cur,
        company_id=CO_A_ID,
        user_id=CO_A_MGR1_ID,
        type="ai_evaluation_complete",
        title="AI Evaluation Ready",
        message="The AI has completed its evaluation for incident ALPHA-002.",
        entity_type="incident",
        entity_id=CO_A_INC2_ID,
    )

    data["company_a"] = {
        "id": CO_A_ID,
        "company": company_a,
        "department": dept_a,
        "admin": admin_a,
        "hr_agent": hr_a,
        "managers": [mgr1_a, mgr2_a],
        "employees": [emp1_a, emp2_a, emp3_a, emp4_a],
        "super_admin": super_admin,
        "policies": [policy1_a, policy2_a],
        "policy_versions": [pv1_a],
        "incidents": [inc1_a, inc2_a, inc3_a],
        "disciplinary_action": disc_a,
        "document": doc_a["document"],
        "signature": doc_a.get("signature"),
        "meeting": meeting_a["meeting"],
        "meeting_participants": meeting_a.get("participants", []),
        "notifications": [notif1_a, notif2_a],
    }

    # ==================================================================
    # Company B — "TestCo Beta"
    # ==================================================================
    company_b = create_company(
        cur,
        id=CO_B_ID,
        name="TestCo Beta",
        industry="Retail",
        size="201-500",
        country="US",
        region="New York",
        subscription_tier="enterprise",
    )

    dept_b = create_department(
        cur,
        id=CO_B_DEPT_ID,
        company_id=CO_B_ID,
        name="Sales",
    )

    # Users — Company B
    admin_b = create_user(
        cur,
        id=CO_B_ADMIN_ID,
        company_id=CO_B_ID,
        role="company_admin",
        first_name="Bob",
        last_name="Admin",
        email="bob.admin@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="Director of Sales",
        hire_date="2021-06-01",
    )
    hr_b = create_user(
        cur,
        id=CO_B_HR_ID,
        company_id=CO_B_ID,
        role="hr_agent",
        first_name="Hannah",
        last_name="HR",
        email="hannah.hr@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="HR Manager",
        hire_date="2021-08-15",
    )
    mgr1_b = create_user(
        cur,
        id=CO_B_MGR1_ID,
        company_id=CO_B_ID,
        role="manager",
        first_name="Mike",
        last_name="Manager",
        email="mike.manager@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="Sales Team Lead",
        manager_id=CO_B_ADMIN_ID,
        hire_date="2022-01-10",
    )
    mgr2_b = create_user(
        cur,
        id=CO_B_MGR2_ID,
        company_id=CO_B_ID,
        role="manager",
        first_name="Mary",
        last_name="ManagerTwo",
        email="mary.manager2@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="Account Manager Lead",
        manager_id=CO_B_ADMIN_ID,
        hire_date="2022-02-15",
    )
    emp1_b = create_user(
        cur,
        id=CO_B_EMP1_ID,
        company_id=CO_B_ID,
        role="employee",
        first_name="Tom",
        last_name="Employee",
        email="tom.employee@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="Sales Representative",
        manager_id=CO_B_MGR1_ID,
        hire_date="2023-01-10",
    )
    emp2_b = create_user(
        cur,
        id=CO_B_EMP2_ID,
        company_id=CO_B_ID,
        role="employee",
        first_name="Tina",
        last_name="EmployeeTwo",
        email="tina.employee2@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="Sales Representative",
        manager_id=CO_B_MGR1_ID,
        hire_date="2023-02-01",
    )
    emp3_b = create_user(
        cur,
        id=CO_B_EMP3_ID,
        company_id=CO_B_ID,
        role="employee",
        first_name="Tim",
        last_name="EmployeeThree",
        email="tim.employee3@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="Account Manager",
        manager_id=CO_B_MGR2_ID,
        hire_date="2023-03-01",
    )
    emp4_b = create_user(
        cur,
        id=CO_B_EMP4_ID,
        company_id=CO_B_ID,
        role="employee",
        first_name="Tara",
        last_name="EmployeeFour",
        email="tara.employee4@testco-beta.test",
        department_id=CO_B_DEPT_ID,
        job_title="Account Manager",
        manager_id=CO_B_MGR2_ID,
        hire_date="2023-04-01",
    )

    # Update department head
    cur.execute(
        "UPDATE departments SET head_id = %s WHERE id = %s;",
        (CO_B_MGR1_ID, CO_B_DEPT_ID),
    )

    # Policies — Company B
    policy1_b = create_policy(
        cur,
        id=CO_B_POLICY1_ID,
        company_id=CO_B_ID,
        category="attendance",
        title="TestCo Beta Attendance Policy",
        content="## Attendance Policy for TestCo Beta",
        is_active=True,
        version=1,
        created_by=CO_B_HR_ID,
    )
    policy2_b = create_policy(
        cur,
        id=CO_B_POLICY2_ID,
        company_id=CO_B_ID,
        category="performance",
        title="TestCo Beta Performance Policy",
        content="## Performance Policy for TestCo Beta",
        is_active=True,
        version=1,
        created_by=CO_B_HR_ID,
    )

    # Incidents — Company B
    inc1_b = create_incident(
        cur,
        id=CO_B_INC1_ID,
        company_id=CO_B_ID,
        employee_id=CO_B_EMP1_ID,
        reporter_id=CO_B_MGR1_ID,
        reference_number="BETA-001",
        type="performance",
        description="Failed to meet monthly sales target for 2 consecutive months.",
        incident_date="2025-01-10",
        severity="medium",
        status="pending_hr_review",
    )
    inc2_b = create_incident(
        cur,
        id=CO_B_INC2_ID,
        company_id=CO_B_ID,
        employee_id=CO_B_EMP2_ID,
        reporter_id=CO_B_MGR1_ID,
        reference_number="BETA-002",
        type="tardiness",
        description="Arrived 15 minutes late.",
        incident_date="2025-01-25",
        severity="low",
        status="ai_evaluating",
    )
    inc3_b = create_incident(
        cur,
        id=CO_B_INC3_ID,
        company_id=CO_B_ID,
        employee_id=CO_B_EMP3_ID,
        reporter_id=CO_B_MGR2_ID,
        reference_number="BETA-003",
        type="insubordination",
        description="Refused to follow directive from manager.",
        incident_date="2025-02-05",
        severity="high",
        status="approved",
        witnesses=[CO_B_EMP4_ID],
    )

    # Disciplinary action — Company B
    disc_b = create_disciplinary_action(
        cur,
        incident_id=CO_B_INC3_ID,
        company_id=CO_B_ID,
        employee_id=CO_B_EMP3_ID,
        action_type="written_warning",
        status="approved",
        approved_by=CO_B_ADMIN_ID,
    )

    # Document — Company B
    doc_b = create_signed_document(
        cur,
        company_id=CO_B_ID,
        doc_id=CO_B_DOC_ID,
        created_by=CO_B_HR_ID,
        type="written_warning",
        title="Written Warning — Tim EmployeeThree",
        content="This is a written warning for insubordination.",
        status="signed",
        version=1,
        signer_id=CO_B_EMP3_ID,
        signer_role="employee",
        signature_data="Tim EmployeeThree — typed signature",
        content_hash="b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
    )

    data["company_b"] = {
        "id": CO_B_ID,
        "company": company_b,
        "department": dept_b,
        "admin": admin_b,
        "hr_agent": hr_b,
        "managers": [mgr1_b, mgr2_b],
        "employees": [emp1_b, emp2_b, emp3_b, emp4_b],
        "policies": [policy1_b, policy2_b],
        "incidents": [inc1_b, inc2_b, inc3_b],
        "disciplinary_action": disc_b,
        "document": doc_b["document"],
        "signature": doc_b.get("signature"),
        "notifications": [],
    }

    # ==================================================================
    # Cross-tenant verification markers
    # ==================================================================
    data["cross_tenant_ids"] = {
        "company_a_manager1": CO_A_MGR1_ID,
        "company_a_employee1": CO_A_EMP1_ID,
        "company_b_manager1": CO_B_MGR1_ID,
        "company_b_employee1": CO_B_EMP1_ID,
    }

    return data
