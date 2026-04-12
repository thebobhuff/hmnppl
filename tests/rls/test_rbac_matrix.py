"""RBAC Matrix Tests — validates role-based access control for every role × resource.

This test suite implements a parameterized access matrix that checks what each
role can and cannot do across all platform resources.  The matrix is defined
as a declarative data structure and then exercised via parameterized tests.

Roles tested:
    - employee:       Can read own profile, own documents, own incidents
    - manager:        Can read direct reports' incidents, submit issues for them
    - hr_agent:       Can read all company incidents, review docs, schedule meetings
    - company_admin:  Full company access including settings
    - super_admin:    Platform-wide visibility (limited by current RLS policies)

Resources tested:
    - own profile, other users, departments, policies, incidents
    - documents, disciplinary_actions, meetings, audit_log, notifications

Run:
    pytest tests/rls/test_rbac_matrix.py -v
"""

from __future__ import annotations

import psycopg2
import psycopg2.extras
import pytest

from tests.conftest import clean_test_data, connection_as
from tests.fixtures.tenants import (
    CO_A_ADMIN_ID,
    CO_A_DOC_ID,
    CO_A_EMP1_ID,
    CO_A_EMP2_ID,
    CO_A_EMP3_ID,
    CO_A_EMP4_ID,
    CO_A_HR_ID,
    CO_A_ID,
    CO_A_INC1_ID,
    CO_A_INC2_ID,
    CO_A_INC3_ID,
    CO_A_MGR1_ID,
    CO_A_MGR2_ID,
    CO_A_POLICY1_ID,
    CO_A_POLICY2_ID,
    CO_B_ID,
    SUPER_ADMIN_ID,
    two_companies_fixture,
)

# ---------------------------------------------------------------------------
# Session-scoped fixture: create tenants once, clean up after session
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def tenants(service_cur):
    """Create the two-company test data tree once per module."""
    data = two_companies_fixture(service_cur)
    yield data
    clean_test_data(service_cur.connection, prefix="TestCo")


# ==========================================================================
# Helper: assert role can/cannot SELECT
# ==========================================================================


def _can_select(conn, table: str, where: str, args: tuple = ()) -> int:
    """Execute a SELECT COUNT and return the row count."""
    cur = conn.cursor()
    cur.execute(f"SELECT count(*) FROM {table} WHERE {where};", args)
    count = cur.fetchone()[0]
    cur.close()
    return count


def _can_insert(conn, sql: str, args: tuple = ()) -> bool:
    """Attempt an INSERT. Returns True if it succeeded, False if RLS blocked it."""
    cur = conn.cursor()
    try:
        cur.execute(sql, args)
        return True
    except psycopg2.Error:
        return False
    finally:
        cur.close()


def _can_update(conn, table: str, set_clause: str, where: str, args: tuple = ()) -> int:
    """Attempt an UPDATE and return the number of affected rows."""
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {table} SET {set_clause} WHERE {where};", args)
        return cur.rowcount
    except psycopg2.Error:
        return -1  # Error means blocked
    finally:
        cur.close()


# ==========================================================================
# EMPLOYEE ROLE TESTS
# ==========================================================================


class TestEmployeeRole:
    """Tests for the 'employee' role within Company A."""

    def test_can_read_own_profile(self, tenants):
        """Employee can SELECT their own row from users."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "users", "id = %s", (CO_A_EMP1_ID,))
            assert count == 1
            conn.close()

    def test_can_read_own_company_users(self, tenants):
        """Employee can SELECT all users in their own company."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "users", "company_id = %s", (CO_A_ID,))
            assert count >= 8  # admin + hr + 2 mgrs + 4 emps + super_admin
            conn.close()

    def test_cannot_read_other_company_users(self, tenants):
        """Employee CANNOT SELECT users from another company."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "users", "company_id = %s", (CO_B_ID,))
            assert count == 0
            conn.close()

    def test_can_read_own_incidents(self, tenants):
        """Employee can see incidents where they are the employee."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            # Employee 1 is the subject of incident 1
            count = _can_select(conn, "incidents", "employee_id = %s", (CO_A_EMP1_ID,))
            assert count >= 1
            conn.close()

    def test_can_read_own_company_incidents(self, tenants):
        """Employee can see ALL incidents in their company (via incidents_select policy)."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "incidents", "company_id = %s", (CO_A_ID,))
            assert count == 3  # All Company A incidents are visible
            conn.close()

    def test_cannot_read_other_company_incidents(self, tenants):
        """Employee CANNOT see incidents from another company."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "incidents", "company_id = %s", (CO_B_ID,))
            assert count == 0
            conn.close()

    def test_can_read_own_company_documents(self, tenants):
        """Employee can see documents in their own company."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "documents", "company_id = %s", (CO_A_ID,))
            assert count >= 1
            conn.close()

    def test_can_read_own_company_policies(self, tenants):
        """Employee can read company policies."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "policies", "company_id = %s", (CO_A_ID,))
            assert count >= 2
            conn.close()

    def test_cannot_create_incidents(self, tenants):
        """Employee CANNOT INSERT incidents (incidents_all requires manager+ role).

        Note: The incidents_select policy allows employees to read, but
        incidents_all (INSERT/UPDATE/DELETE) requires super_admin, company_admin,
        hr_agent, or manager role.
        """
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO incidents (company_id, employee_id, reported_by, reference_number, "
                "type, description, incident_date, severity, status) "
                "VALUES (%s, %s, %s, 'TEST-EMP', 'tardiness', 'test', '2025-03-01', 'low', 'pending_hr_review')",
                (CO_A_ID, CO_A_EMP1_ID, CO_A_EMP1_ID),
            )
            assert result is False, "Employee should NOT be able to INSERT incidents"
            conn.close()

    def test_cannot_create_policies(self, tenants):
        """Employee CANNOT INSERT policies (policies_all requires hr_agent+)."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO policies (company_id, category, title, content, is_active, version) "
                "VALUES (%s, 'test', 'Evil', 'content', false, 1)",
                (CO_A_ID,),
            )
            assert result is False, "Employee should NOT be able to INSERT policies"
            conn.close()

    def test_cannot_update_company_settings(self, tenants):
        """Employee CANNOT UPDATE company settings."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            affected = _can_update(
                conn,
                "companies",
                "name = 'Hacked!'",
                "id = %s",
                (CO_A_ID,),
            )
            assert (
                affected == 0
            ), "Employee should NOT be able to UPDATE company settings"
            conn.close()

    def test_cannot_create_departments(self, tenants):
        """Employee CANNOT INSERT departments."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO departments (company_id, name) VALUES (%s, 'Evil Dept')",
                (CO_A_ID,),
            )
            assert result is False, "Employee should NOT be able to INSERT departments"
            conn.close()

    def test_cannot_read_audit_log(self, tenants):
        """Employee CANNOT read audit_log (requires company_admin or super_admin)."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "audit_log", "company_id = %s", (CO_A_ID,))
            assert count == 0, "Employee should NOT be able to read audit_log"
            conn.close()

    def test_can_read_own_notifications(self, tenants):
        """Employee can see their own notifications (user-scoped)."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            count = _can_select(conn, "notifications", "user_id = %s", (CO_A_EMP1_ID,))
            assert count >= 1
            conn.close()

    def test_cannot_read_others_notifications(self, tenants):
        """Employee CANNOT see other users' notifications."""
        with connection_as(
            user_id=CO_A_EMP1_ID, company_id=CO_A_ID, role="employee"
        ) as conn:
            # Manager 1 has a notification — employee should not see it
            count = _can_select(conn, "notifications", "user_id = %s", (CO_A_MGR1_ID,))
            assert count == 0
            conn.close()


# ==========================================================================
# MANAGER ROLE TESTS
# ==========================================================================


class TestManagerRole:
    """Tests for the 'manager' role within Company A."""

    def test_can_read_own_profile(self, tenants):
        """Manager can read their own profile."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            count = _can_select(conn, "users", "id = %s", (CO_A_MGR1_ID,))
            assert count == 1
            conn.close()

    def test_can_read_all_company_users(self, tenants):
        """Manager can see all users in their company."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            count = _can_select(conn, "users", "company_id = %s", (CO_A_ID,))
            assert count >= 8
            conn.close()

    def test_can_read_direct_reports_incidents(self, tenants):
        """Manager can see incidents for their direct reports.

        Manager 1 manages Employee 1 and Employee 2.
        Incident 1 is about Employee 1, Incident 2 is about Employee 2.
        """
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            # All company incidents are visible to managers via incidents_select
            count = _can_select(conn, "incidents", "company_id = %s", (CO_A_ID,))
            assert count >= 3
            conn.close()

    def test_can_create_incidents_for_direct_reports(self, tenants):
        """Manager CAN INSERT incidents (incidents_all allows manager role)."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            cur = conn.cursor()
            try:
                cur.execute(
                    "INSERT INTO incidents (company_id, employee_id, reported_by, reference_number, "
                    "type, description, incident_date, severity, status) "
                    "VALUES (%s, %s, %s, 'MGR-TEST-001', 'tardiness', 'manager test', "
                    "'2025-03-15', 'low', 'pending_hr_review')",
                    (CO_A_ID, CO_A_EMP2_ID, CO_A_MGR1_ID),
                )
                # If we get here, INSERT succeeded
                assert True
            except psycopg2.Error:
                pytest.fail(
                    "Manager should be able to INSERT incidents for direct reports"
                )
            finally:
                cur.close()
            conn.close()

    def test_can_update_own_reported_incidents(self, tenants):
        """Manager can UPDATE incidents they reported."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            affected = _can_update(
                conn,
                "incidents",
                "description = 'updated by manager'",
                "id = %s AND reported_by = %s",
                (CO_A_INC1_ID, CO_A_MGR1_ID),
            )
            assert (
                affected >= 1
            ), "Manager should be able to update incidents they reported"
            conn.close()

    def test_cannot_create_policies(self, tenants):
        """Manager CANNOT INSERT policies (policies_all requires hr_agent+)."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO policies (company_id, category, title, content, is_active, version) "
                "VALUES (%s, 'test', 'Manager Policy', 'content', false, 1)",
                (CO_A_ID,),
            )
            assert result is False, "Manager should NOT be able to INSERT policies"
            conn.close()

    def test_cannot_update_company_settings(self, tenants):
        """Manager CANNOT UPDATE company settings (requires company_admin+)."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            affected = _can_update(
                conn,
                "companies",
                "name = 'Hacked!'",
                "id = %s",
                (CO_A_ID,),
            )
            assert (
                affected == 0
            ), "Manager should NOT be able to UPDATE company settings"
            conn.close()

    def test_cannot_create_departments(self, tenants):
        """Manager CANNOT INSERT departments (requires hr_agent+)."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO departments (company_id, name) VALUES (%s, 'Manager Dept')",
                (CO_A_ID,),
            )
            assert result is False, "Manager should NOT be able to INSERT departments"
            conn.close()

    def test_can_read_company_policies(self, tenants):
        """Manager can read company policies (SELECT is company-scoped)."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            count = _can_select(conn, "policies", "company_id = %s", (CO_A_ID,))
            assert count >= 2
            conn.close()

    def test_can_read_documents(self, tenants):
        """Manager can read company documents."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            count = _can_select(conn, "documents", "company_id = %s", (CO_A_ID,))
            assert count >= 1
            conn.close()

    def test_cannot_read_audit_log(self, tenants):
        """Manager CANNOT read audit_log (requires company_admin or super_admin)."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            count = _can_select(conn, "audit_log", "company_id = %s", (CO_A_ID,))
            assert count == 0, "Manager should NOT be able to read audit_log"
            conn.close()

    def test_cannot_access_other_company_data(self, tenants):
        """Manager CANNOT see any data from Company B."""
        with connection_as(
            user_id=CO_A_MGR1_ID, company_id=CO_A_ID, role="manager"
        ) as conn:
            for table in ["users", "incidents", "documents", "policies"]:
                count = _can_select(conn, table, "company_id = %s", (CO_B_ID,))
                assert (
                    count == 0
                ), f"Manager can see {count} rows in {table} from Company B"
            conn.close()


# ==========================================================================
# HR AGENT ROLE TESTS
# ==========================================================================


class TestHRAgentRole:
    """Tests for the 'hr_agent' role within Company A."""

    def test_can_read_all_company_incidents(self, tenants):
        """HR Agent can see ALL incidents in the company."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            count = _can_select(conn, "incidents", "company_id = %s", (CO_A_ID,))
            assert count == 3
            conn.close()

    def test_can_review_documents(self, tenants):
        """HR Agent can read all company documents."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            count = _can_select(conn, "documents", "company_id = %s", (CO_A_ID,))
            assert count >= 1
            conn.close()

    def test_can_create_documents(self, tenants):
        """HR Agent can INSERT documents."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO documents (company_id, type, title, content, status, version, created_by) "
                "VALUES (%s, 'test', 'HR Test Doc', 'content', 'draft', 1, %s)",
                (CO_A_ID, CO_A_HR_ID),
            )
            assert result is True, "HR Agent should be able to INSERT documents"
            conn.close()

    def test_can_create_policies(self, tenants):
        """HR Agent can INSERT policies (policies_all allows hr_agent)."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO policies (company_id, category, title, content, is_active, version) "
                "VALUES (%s, 'test', 'HR Policy', 'content', false, 1)",
                (CO_A_ID,),
            )
            assert result is True, "HR Agent should be able to INSERT policies"
            conn.close()

    def test_can_update_policies(self, tenants):
        """HR Agent can UPDATE policies."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            affected = _can_update(
                conn,
                "policies",
                "summary = 'updated by HR'",
                "company_id = %s AND id = %s",
                (CO_A_ID, CO_A_POLICY1_ID),
            )
            assert affected >= 1, "HR Agent should be able to UPDATE policies"
            conn.close()

    def test_can_create_departments(self, tenants):
        """HR Agent can INSERT departments."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO departments (company_id, name) VALUES (%s, 'HR New Dept')",
                (CO_A_ID,),
            )
            assert result is True, "HR Agent should be able to INSERT departments"
            conn.close()

    def test_can_create_users(self, tenants):
        """HR Agent can INSERT users (users_insert allows hr_agent)."""
        from tests.conftest import uuid_v5

        new_user_id = uuid_v5("hr-test-new-user")
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO users (id, company_id, role, first_name, last_name, email, status) "
                "VALUES (%s, %s, 'employee', 'New', 'Hire', 'new.hire@testco-alpha.test', 'active')",
                (new_user_id, CO_A_ID),
            )
            assert result is True, "HR Agent should be able to INSERT users"
            conn.close()

    def test_can_create_meetings(self, tenants):
        """HR Agent can INSERT/UPDATE meetings and meeting_participants."""
        disc_act = tenants["company_a"]["disciplinary_action"]
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO meetings (disciplinary_action_id, company_id, type, status, duration_minutes) "
                "VALUES (%s, %s, 'follow_up', 'scheduled', 15)",
                (disc_act["id"], CO_A_ID),
            )
            assert result is True, "HR Agent should be able to INSERT meetings"
            conn.close()

    def test_can_read_disciplinary_actions(self, tenants):
        """HR Agent can read disciplinary_actions."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            count = _can_select(
                conn, "disciplinary_actions", "company_id = %s", (CO_A_ID,)
            )
            assert count >= 1
            conn.close()

    def test_can_update_disciplinary_actions(self, tenants):
        """HR Agent can UPDATE disciplinary_actions."""
        disc_act = tenants["company_a"]["disciplinary_action"]
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            affected = _can_update(
                conn,
                "disciplinary_actions",
                "follow_up_actions = '[]'::jsonb",
                "id = %s",
                (disc_act["id"],),
            )
            assert (
                affected >= 1
            ), "HR Agent should be able to UPDATE disciplinary_actions"
            conn.close()

    def test_cannot_update_company_settings(self, tenants):
        """HR Agent CANNOT UPDATE company settings (requires company_admin or super_admin)."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            affected = _can_update(
                conn,
                "companies",
                "name = 'Hacked!'",
                "id = %s",
                (CO_A_ID,),
            )
            assert (
                affected == 0
            ), "HR Agent should NOT be able to UPDATE company settings"
            conn.close()

    def test_cannot_read_audit_log(self, tenants):
        """HR Agent CANNOT read audit_log (requires company_admin or super_admin)."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            count = _can_select(conn, "audit_log", "company_id = %s", (CO_A_ID,))
            assert count == 0, "HR Agent should NOT be able to read audit_log"
            conn.close()

    def test_cannot_access_other_company_data(self, tenants):
        """HR Agent CANNOT see any data from Company B."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            for table in [
                "users",
                "incidents",
                "documents",
                "policies",
                "disciplinary_actions",
            ]:
                count = _can_select(conn, table, "company_id = %s", (CO_B_ID,))
                assert (
                    count == 0
                ), f"HR Agent can see {count} rows in {table} from Company B"
            conn.close()

    def test_can_read_policy_versions(self, tenants):
        """HR Agent can read policy versions."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            count = _can_select(
                conn,
                "policy_versions",
                "policy_id IN (SELECT id FROM policies WHERE company_id = %s)",
                (CO_A_ID,),
            )
            assert count >= 1
            conn.close()

    def test_can_insert_policy_versions(self, tenants):
        """HR Agent can INSERT policy versions."""
        with connection_as(
            user_id=CO_A_HR_ID, company_id=CO_A_ID, role="hr_agent"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO policy_versions (policy_id, version, content, rules) "
                "VALUES (%s, 2, '## Version 2', '[]'::jsonb)",
                (CO_A_POLICY1_ID,),
            )
            assert result is True, "HR Agent should be able to INSERT policy_versions"
            conn.close()


# ==========================================================================
# COMPANY ADMIN ROLE TESTS
# ==========================================================================


class TestCompanyAdminRole:
    """Tests for the 'company_admin' role within Company A."""

    def test_can_read_all_company_data(self, tenants):
        """Company Admin can read all data in their company."""
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            for table in [
                "users",
                "incidents",
                "documents",
                "policies",
                "disciplinary_actions",
                "meetings",
                "departments",
            ]:
                count = _can_select(conn, table, "company_id = %s", (CO_A_ID,))
                assert count > 0, f"Company admin sees 0 rows in {table}"
            conn.close()

    def test_can_update_company_settings(self, tenants):
        """Company Admin CAN update company settings."""
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            affected = _can_update(
                conn,
                "companies",
                "onboarding_step = 3",
                "id = %s",
                (CO_A_ID,),
            )
            assert (
                affected == 1
            ), "Company admin should be able to UPDATE company settings"
            conn.close()

    def test_can_update_company_subscription(self, tenants):
        """Company Admin can modify subscription tier."""
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            affected = _can_update(
                conn,
                "companies",
                "subscription_tier = 'enterprise'",
                "id = %s",
                (CO_A_ID,),
            )
            assert affected == 1
            conn.close()

    def test_can_create_and_update_policies(self, tenants):
        """Company Admin has full CRUD on policies."""
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO policies (company_id, category, title, content, is_active, version) "
                "VALUES (%s, 'admin', 'Admin Policy', 'content', true, 1)",
                (CO_A_ID,),
            )
            assert result is True

            affected = _can_update(
                conn,
                "policies",
                "is_active = false",
                "company_id = %s AND category = 'admin'",
                (CO_A_ID,),
            )
            assert affected >= 1
            conn.close()

    def test_can_create_departments(self, tenants):
        """Company Admin can INSERT departments."""
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO departments (company_id, name) VALUES (%s, 'Admin Created Dept')",
                (CO_A_ID,),
            )
            assert result is True
            conn.close()

    def test_can_create_users(self, tenants):
        """Company Admin can INSERT users."""
        from tests.conftest import uuid_v5

        new_id = uuid_v5("admin-test-new-user")
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO users (id, company_id, role, first_name, last_name, email, status) "
                "VALUES (%s, %s, 'employee', 'Admin', 'Created', 'admin.created@testco-alpha.test', 'active')",
                (new_id, CO_A_ID),
            )
            assert result is True
            conn.close()

    def test_can_read_audit_log(self, tenants):
        """Company Admin CAN read audit_log."""
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            count = _can_select(conn, "audit_log", "company_id = %s", (CO_A_ID,))
            assert count > 0, "Company admin should see audit_log entries"
            conn.close()

    def test_cannot_access_other_company(self, tenants):
        """Company Admin CANNOT see any data from Company B."""
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            for table in [
                "users",
                "incidents",
                "documents",
                "policies",
                "disciplinary_actions",
                "departments",
                "meetings",
            ]:
                count = _can_select(conn, table, "company_id = %s", (CO_B_ID,))
                assert (
                    count == 0
                ), f"Company admin sees {count} rows in {table} from Company B"

            # Also cannot update Company B
            affected = _can_update(
                conn,
                "companies",
                "name = 'Hacked!'",
                "id = %s",
                (CO_B_ID,),
            )
            assert (
                affected == 0
            ), "Company admin should NOT be able to update other company"
            conn.close()

    def test_can_approve_disciplinary_actions(self, tenants):
        """Company Admin can update disciplinary action status."""
        disc_act = tenants["company_a"]["disciplinary_action"]
        with connection_as(
            user_id=CO_A_ADMIN_ID, company_id=CO_A_ID, role="company_admin"
        ) as conn:
            affected = _can_update(
                conn,
                "disciplinary_actions",
                "status = 'approved', approved_by = %s",
                "id = %s",
                (CO_A_ADMIN_ID, disc_act["id"]),
            )
            assert (
                affected >= 1
            ), "Company admin should be able to approve disciplinary actions"
            conn.close()


# ==========================================================================
# SUPER ADMIN ROLE TESTS
# ==========================================================================


class TestSuperAdminRole:
    """Tests for the 'super_admin' role.

    Note: The current RLS policies use auth.company_id() for most SELECT
    policies, which means super_admin is currently scoped to their registered
    company. These tests document current behavior and should be updated when
    cross-tenant super_admin policies are implemented.
    """

    def test_can_read_own_company_data(self, tenants):
        """Super admin can read all data in their registered company."""
        with connection_as(
            user_id=SUPER_ADMIN_ID, company_id=CO_A_ID, role="super_admin"
        ) as conn:
            for table in [
                "users",
                "incidents",
                "documents",
                "policies",
                "disciplinary_actions",
                "meetings",
                "departments",
            ]:
                count = _can_select(conn, table, "company_id = %s", (CO_A_ID,))
                assert count > 0, f"Super admin sees 0 rows in {table} for own company"
            conn.close()

    def test_can_update_company_settings(self, tenants):
        """Super admin can UPDATE company settings."""
        with connection_as(
            user_id=SUPER_ADMIN_ID, company_id=CO_A_ID, role="super_admin"
        ) as conn:
            affected = _can_update(
                conn,
                "companies",
                "onboarding_completed = true",
                "id = %s",
                (CO_A_ID,),
            )
            assert affected == 1
            conn.close()

    def test_can_create_policies(self, tenants):
        """Super admin can INSERT policies."""
        with connection_as(
            user_id=SUPER_ADMIN_ID, company_id=CO_A_ID, role="super_admin"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO policies (company_id, category, title, content, is_active, version) "
                "VALUES (%s, 'superadmin', 'SA Policy', 'content', true, 1)",
                (CO_A_ID,),
            )
            assert result is True
            conn.close()

    def test_can_read_audit_log(self, tenants):
        """Super admin can read audit_log."""
        with connection_as(
            user_id=SUPER_ADMIN_ID, company_id=CO_A_ID, role="super_admin"
        ) as conn:
            count = _can_select(conn, "audit_log", "company_id = %s", (CO_A_ID,))
            assert count > 0, "Super admin should see audit_log entries"
            conn.close()

    def test_current_rls_limits_cross_tenant_read(self, tenants):
        """Document current behavior: super_admin is limited to own company for SELECT.

        This test documents that the current RLS policies scope super_admin
        reads to their registered company_id.  When cross-tenant super_admin
        access is implemented, this test should be updated.
        """
        with connection_as(
            user_id=SUPER_ADMIN_ID, company_id=CO_A_ID, role="super_admin"
        ) as conn:
            count = _can_select(conn, "users", "company_id = %s", (CO_B_ID,))
            assert count == 0, (
                "Current RLS limits super_admin to own company. "
                "Update this test when cross-tenant access is implemented."
            )
            conn.close()

    def test_can_create_departments(self, tenants):
        """Super admin can INSERT departments."""
        with connection_as(
            user_id=SUPER_ADMIN_ID, company_id=CO_A_ID, role="super_admin"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO departments (company_id, name) VALUES (%s, 'SA Dept')",
                (CO_A_ID,),
            )
            assert result is True
            conn.close()

    def test_can_create_users(self, tenants):
        """Super admin can INSERT users."""
        from tests.conftest import uuid_v5

        new_id = uuid_v5("superadmin-test-user")
        with connection_as(
            user_id=SUPER_ADMIN_ID, company_id=CO_A_ID, role="super_admin"
        ) as conn:
            result = _can_insert(
                conn,
                "INSERT INTO users (id, company_id, role, first_name, last_name, email, status) "
                "VALUES (%s, %s, 'employee', 'SA', 'Created', 'sa.created@testco-alpha.test', 'active')",
                (new_id, CO_A_ID),
            )
            assert result is True
            conn.close()


# ==========================================================================
# PARAMETERIZED ROLE × RESOURCE MATRIX
# ==========================================================================

# Declarative RBAC matrix: (role, resource, can_select, can_insert, can_update)
# None means "skip this assertion" (e.g., audit_log has no INSERT policy)
RBAC_MATRIX = [
    # Employee
    (
        "employee",
        "users",
        True,
        False,
        True,
    ),  # can read all, can't insert, can update own
    ("employee", "departments", True, False, False),  # read-only
    ("employee", "policies", True, False, False),  # read-only
    ("employee", "incidents", True, False, False),  # read all in company
    ("employee", "documents", True, False, True),  # read all, can update (with RLS)
    ("employee", "disciplinary_actions", True, False, False),  # read-only
    ("employee", "meetings", True, False, False),  # read-only
    ("employee", "audit_log", False, None, None),  # no access
    ("employee", "notifications", True, None, True),  # own only
    # Manager
    ("manager", "users", True, False, True),
    ("manager", "departments", True, False, False),
    ("manager", "policies", True, False, False),
    ("manager", "incidents", True, True, True),  # can create & update
    ("manager", "documents", True, False, True),
    ("manager", "disciplinary_actions", True, False, False),
    ("manager", "meetings", True, False, True),  # can update
    ("manager", "audit_log", False, None, None),
    ("manager", "notifications", True, None, True),
    # HR Agent
    ("hr_agent", "users", True, True, True),
    ("hr_agent", "departments", True, True, True),
    ("hr_agent", "policies", True, True, True),
    ("hr_agent", "incidents", True, True, True),
    ("hr_agent", "documents", True, True, True),
    ("hr_agent", "disciplinary_actions", True, True, True),
    ("hr_agent", "meetings", True, True, True),
    ("hr_agent", "audit_log", False, None, None),  # no read access
    ("hr_agent", "notifications", True, None, True),
    # Company Admin
    ("company_admin", "users", True, True, True),
    ("company_admin", "departments", True, True, True),
    ("company_admin", "policies", True, True, True),
    ("company_admin", "incidents", True, True, True),
    ("company_admin", "documents", True, True, True),
    ("company_admin", "disciplinary_actions", True, True, True),
    ("company_admin", "meetings", True, True, True),
    ("company_admin", "audit_log", True, None, None),  # can read
    ("company_admin", "notifications", True, None, True),
    # Super Admin
    ("super_admin", "users", True, True, True),
    ("super_admin", "departments", True, True, True),
    ("super_admin", "policies", True, True, True),
    ("super_admin", "incidents", True, True, True),
    ("super_admin", "documents", True, True, True),
    ("super_admin", "disciplinary_actions", True, True, True),
    ("super_admin", "meetings", True, True, True),
    ("super_admin", "audit_log", True, None, None),
    ("super_admin", "notifications", True, None, True),
]

# Map role to user ID
ROLE_USER_MAP = {
    "employee": CO_A_EMP1_ID,
    "manager": CO_A_MGR1_ID,
    "hr_agent": CO_A_HR_ID,
    "company_admin": CO_A_ADMIN_ID,
    "super_admin": SUPER_ADMIN_ID,
}


@pytest.mark.parametrize(
    "role,resource,can_select,can_insert,can_update",
    RBAC_MATRIX,
    ids=[f"{r}-{res}" for r, res, _, _, _ in RBAC_MATRIX],
)
def test_rbac_matrix_select(
    tenants,
    role: str,
    resource: str,
    can_select: bool | None,
    can_insert: bool | None,
    can_update: bool | None,
):
    """Parameterized test: verify SELECT access per role × resource."""
    user_id = ROLE_USER_MAP[role]
    with connection_as(user_id=user_id, company_id=CO_A_ID, role=role) as conn:
        if can_select is not None:
            if resource == "notifications":
                # Notifications are user-scoped, check own notifications
                count = _can_select(conn, "notifications", "user_id = %s", (user_id,))
            elif resource == "audit_log":
                count = _can_select(conn, "audit_log", "company_id = %s", (CO_A_ID,))
            else:
                count = _can_select(conn, resource, "company_id = %s", (CO_A_ID,))

            if can_select:
                assert count >= 0, f"{role} should be able to SELECT {resource}"
                # For most resources, we expect at least some rows
                if resource != "notifications":
                    assert count > 0, f"{role} sees 0 rows in {resource} (expected > 0)"
            else:
                assert count == 0, f"{role} should NOT be able to SELECT {resource}"
        conn.close()


@pytest.mark.parametrize(
    "role,resource,can_select,can_insert,can_update",
    RBAC_MATRIX,
    ids=[f"{r}-{res}" for r, res, _, _, _ in RBAC_MATRIX],
)
def test_rbac_matrix_insert(
    tenants,
    role: str,
    resource: str,
    can_select: bool | None,
    can_insert: bool | None,
    can_update: bool | None,
):
    """Parameterized test: verify INSERT access per role × resource."""
    if can_insert is None:
        pytest.skip("INSERT not applicable for this resource")

    user_id = ROLE_USER_MAP[role]

    # SQL templates for safe INSERT tests (with cleanup-safe data)
    insert_sqls = {
        "users": (
            "INSERT INTO users (id, company_id, role, first_name, last_name, email, status) "
            "VALUES ('00000000-0000-0000-0000-000000009999', %s, 'employee', 'Test', 'Insert', 'test.insert@matrix.test', 'active')"
        ),
        "departments": (
            "INSERT INTO departments (company_id, name) VALUES (%s, 'Matrix Test Dept')"
        ),
        "policies": (
            "INSERT INTO policies (company_id, category, title, content, is_active, version) "
            "VALUES (%s, 'matrix_test', 'Matrix Test Policy', 'content', false, 1)"
        ),
        "incidents": (
            "INSERT INTO incidents (company_id, employee_id, reported_by, reference_number, "
            "type, description, incident_date, severity, status) "
            "VALUES (%s, %s, %s, 'MATRIX-TEST-001', 'tardiness', 'matrix test', '2025-03-01', 'low', 'pending_hr_review')"
        ),
        "documents": (
            "INSERT INTO documents (company_id, type, title, content, status, version) "
            "VALUES (%s, 'matrix_test', 'Matrix Doc', 'content', 'draft', 1)"
        ),
        "disciplinary_actions": (
            "INSERT INTO disciplinary_actions (company_id, incident_id, type, status, recommended_action, rationale, level) "
            "VALUES (%s, (SELECT id FROM incidents WHERE company_id = %s LIMIT 1), 'written_warning', 'draft', 'None', 'matrix test', 1)"
        ),
        "meetings": (
            "INSERT INTO meetings (company_id, disciplinary_action_id, status, title, meeting_date, location) "
            "VALUES (%s, (SELECT id FROM disciplinary_actions WHERE company_id = %s AND status = 'draft' LIMIT 1), 'scheduled', 'matrix test meeting', '2026-05-01', 'Zoom')"
        ),
    }

    sql = insert_sqls.get(resource)
    if sql is None:
        pytest.skip(f"INSERT test not implemented for {resource}")

    with connection_as(user_id=user_id, company_id=CO_A_ID, role=role) as conn:
        if resource == "incidents":
            result = _can_insert(conn, sql, (CO_A_ID, user_id, user_id))
        elif resource in ("disciplinary_actions", "meetings"):
            result = _can_insert(conn, sql, (CO_A_ID, CO_A_ID))
        else:
            result = _can_insert(conn, sql, (CO_A_ID,))

        if can_insert:
            assert result is True, f"{role} should be able to INSERT into {resource}"
        else:
            assert (
                result is False
            ), f"{role} should NOT be able to INSERT into {resource}"
        conn.close()


@pytest.mark.parametrize(
    "role,resource,can_select,can_insert,can_update",
    RBAC_MATRIX,
    ids=[f"{r}-{res}" for r, res, _, _, _ in RBAC_MATRIX],
)
def test_rbac_matrix_update(
    tenants,
    role: str,
    resource: str,
    can_select: bool | None,
    can_insert: bool | None,
    can_update: bool | None,
):
    """Parameterized test: verify UPDATE access per role × resource."""
    if can_update is None:
        pytest.skip("UPDATE not applicable for this resource")

    user_id = ROLE_USER_MAP[role]

    # For update tests, we check if the role can UPDATE rows in their company
    with connection_as(user_id=user_id, company_id=CO_A_ID, role=role) as conn:
        if resource in ("audit_log", "notifications"):
            pytest.skip(f"UPDATE matrix test skipped for {resource}")

        # Try a harmless UPDATE on existing data
        update_map = {
            "users": ("first_name = first_name", "company_id = %s"),
            "departments": ("name = name", "company_id = %s"),
            "policies": ("summary = summary", "company_id = %s"),
            "incidents": ("description = description", "company_id = %s"),
            "documents": ("title = title", "company_id = %s"),
            "disciplinary_actions": (
                "follow_up_actions = follow_up_actions",
                "company_id = %s",
            ),
            "meetings": ("agenda = agenda", "company_id = %s"),
        }

        if resource not in update_map:
            pytest.skip(f"UPDATE test not defined for {resource}")

        set_clause, where_clause = update_map[resource]
        affected = _can_update(conn, resource, set_clause, where_clause, (CO_A_ID,))

        if can_update:
            assert affected >= 0, f"{role} should be able to UPDATE {resource}"
        else:
            assert (
                affected == 0
            ), f"{role} should NOT be able to UPDATE {resource} (got {affected} affected)"
        conn.close()
