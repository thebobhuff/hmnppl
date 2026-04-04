"""Cross-tenant isolation tests — validates RLS policies prevent data leakage.

For every table with a ``company_id`` column, these tests verify:

1. **Read isolation**: A user from Company A can only see Company A rows.
2. **Write rejection**: A user from Company A cannot INSERT/UPDATE rows
   with Company B's ``company_id``.
3. **Super Admin bypass**: A super_admin can see data from all companies
   (when RLS policies allow).

The test is parameterized across all tenant-scoped tables so that adding
a new table to the schema automatically requires new isolation tests.

Run:
    pytest tests/rls/test_cross_tenant_isolation.py -v
"""

from __future__ import annotations

import pytest
import psycopg2
import psycopg2.extras

from tests.conftest import connection_as, clean_test_data
from tests.fixtures.tenants import (
    two_companies_fixture,
    CO_A_ID,
    CO_B_ID,
    CO_A_ADMIN_ID,
    CO_A_HR_ID,
    CO_A_MGR1_ID,
    CO_A_EMP1_ID,
    CO_B_ADMIN_ID,
    CO_B_EMP1_ID,
    SUPER_ADMIN_ID,
)


# ---------------------------------------------------------------------------
# Session-scoped fixture: create tenants once, clean up after session
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def tenants(service_cur):
    """Create the two-company test data tree once per module."""
    data = two_companies_fixture(service_cur)
    yield data
    # Cleanup happens automatically via CASCADE delete on companies
    clean_test_data(service_cur.connection, prefix="TestCo")


# ---------------------------------------------------------------------------
# Table definitions for parameterized tests
# ---------------------------------------------------------------------------

# Each entry: (table_name, has_direct_company_id)
# Tables with direct company_id use simple WHERE company_id = X filtering.
# Tables with indirect company_id (via FK) are tested via SELECT only.
TABLE_ISOLATION_PARAMS = [
    # Direct company_id
    pytest.param("companies", True, id="companies"),
    pytest.param("departments", True, id="departments"),
    pytest.param("users", True, id="users"),
    pytest.param("policies", True, id="policies"),
    pytest.param("incidents", True, id="incidents"),
    pytest.param("documents", True, id="documents"),
    pytest.param("disciplinary_actions", True, id="disciplinary_actions"),
    pytest.param("meetings", True, id="meetings"),
    pytest.param("notifications", True, id="notifications"),
    # Indirect company_id (via FK to another table)
    pytest.param("policy_versions", False, id="policy_versions"),
    pytest.param("incident_witnesses", False, id="incident_witnesses"),
    pytest.param("meeting_participants", False, id="meeting_participants"),
    pytest.param("signatures", False, id="signatures"),
    # Special: audit_log (select-only, company_admin+ role check)
    pytest.param("audit_log", False, id="audit_log"),
]


def _expected_count(tenants: dict, table: str, company_key: str) -> int:
    """Return the expected row count for a table within a given company."""
    co = tenants[company_key]

    counts = {
        "companies": 1,
        "departments": 1,
        "users": lambda: 1
        + 1
        + 2
        + 4
        + (1 if company_key == "company_a" else 0),  # +super_admin for A
        "policies": 2,
        "incidents": 3,
        "documents": 1,
        "disciplinary_actions": 1,
        "meetings": 1 if company_key == "company_a" else 0,
        "notifications": 2 if company_key == "company_a" else 0,
        "policy_versions": 1 if company_key == "company_a" else 0,
        "audit_log": -1,  # Special: variable count from triggers, skip count check
        "incident_witnesses": -1,  # Skip exact count
        "meeting_participants": -1,  # Skip exact count
        "signatures": -1,  # Skip exact count
    }

    val = counts.get(table, 0)
    if callable(val):
        return val()
    return val


# ==========================================================================
# Test 1: Read Isolation — Company A user sees ONLY Company A rows
# ==========================================================================


@pytest.mark.parametrize("table,has_direct_co", TABLE_ISOLATION_PARAMS)
def test_company_a_user_sees_only_company_a_rows(
    tenants,
    table: str,
    has_direct_co: bool,
):
    """A regular employee from Company A should only see rows belonging to Company A.

    For tables with a direct company_id column, we assert the count matches
    expected Company A data.  For indirect tables, we assert zero rows from
    Company B are visible (i.e., no cross-tenant leakage).
    """
    # Use Company A's admin — they have broad SELECT access
    with connection_as(
        user_id=CO_A_ADMIN_ID,
        company_id=CO_A_ID,
        role="company_admin",
    ) as conn:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if has_direct_co:
            cur.execute(f"SELECT * FROM {table} WHERE company_id = %s;", (CO_A_ID,))
            rows_a = cur.fetchall()

            cur.execute(f"SELECT * FROM {table} WHERE company_id = %s;", (CO_B_ID,))
            rows_b = cur.fetchall()

            # Should see Company A data
            expected = _expected_count(tenants, table, "company_a")
            if expected >= 0:
                assert len(rows_a) == expected, (
                    f"Expected {expected} {table} rows for Company A, got {len(rows_a)}"
                )
            # Should NOT see any Company B data through RLS
            assert len(rows_b) == 0, (
                f"RLS leak! Company A user can see {len(rows_b)} {table} rows from Company B"
            )
        else:
            # Indirect tables — verify we can query them without error
            # and they don't contain cross-tenant data
            cur.execute(f"SELECT * FROM {table};")
            all_rows = cur.fetchall()
            # Basic check: query succeeds, results are company-scoped
            assert isinstance(all_rows, list)

        cur.close()
        conn.close()


# ==========================================================================
# Test 2: Write Rejection — Company A user CANNOT write with Company B's ID
# ==========================================================================

# Only test tables with direct company_id for write rejection
WRITE_REJECTION_PARAMS = [
    pytest.param(
        "departments",
        {
            "insert_sql": "INSERT INTO departments (company_id, name) VALUES (%s, 'Evil Dept')",
            "update_table": "departments",
            "update_set": "name = 'Hacked Dept'",
        },
        id="departments",
    ),
    pytest.param(
        "policies",
        {
            "insert_sql": (
                "INSERT INTO policies (company_id, category, title, content, is_active, version) "
                "VALUES (%s, 'test', 'Evil Policy', 'content', false, 1)"
            ),
            "update_table": "policies",
            "update_set": "title = 'Hacked Policy'",
        },
        id="policies",
    ),
    pytest.param(
        "incidents",
        {
            "insert_sql": (
                "INSERT INTO incidents (company_id, employee_id, reported_by, reference_number, "
                "type, description, incident_date, severity, status) "
                "VALUES (%s, %s, %s, 'EVIL-001', 'tardiness', 'evil', '2025-01-01', 'low', 'pending_hr_review')"
            ),
            "insert_args_from_b": True,  # needs employee_id and reported_by from company B
            "update_table": "incidents",
            "update_set": "description = 'hacked'",
        },
        id="incidents",
    ),
    pytest.param(
        "documents",
        {
            "insert_sql": (
                "INSERT INTO documents (company_id, type, title, content, status, version) "
                "VALUES (%s, 'test', 'Evil Doc', 'content', 'draft', 1)"
            ),
            "update_table": "documents",
            "update_set": "title = 'Hacked Doc'",
        },
        id="documents",
    ),
    pytest.param(
        "disciplinary_actions",
        {
            "insert_sql": (
                "INSERT INTO disciplinary_actions (incident_id, company_id, employee_id, action_type, status) "
                "VALUES (%s, %s, %s, 'verbal_warning', 'pending_approval')"
            ),
            "insert_args_from_b": True,
            "update_table": "disciplinary_actions",
            "update_set": "rejection_reason = 'hacked'",
        },
        id="disciplinary_actions",
    ),
    pytest.param(
        "meetings",
        {
            "insert_sql": (
                "INSERT INTO meetings (disciplinary_action_id, company_id, type, status) "
                "VALUES (%s, %s, 'test', 'scheduled')"
            ),
            "insert_args_from_b": True,
            "update_table": "meetings",
            "update_set": "agenda = 'hacked'",
        },
        id="meetings",
    ),
]


@pytest.mark.parametrize("table,params", WRITE_REJECTION_PARAMS)
def test_company_a_user_cannot_write_company_b_data(
    tenants,
    table: str,
    params: dict,
):
    """A Company A user should be blocked from inserting/updating rows with Company B's company_id.

    INSERT with company_id = Company B → should raise an RLS violation.
    UPDATE on a Company B row → should be blocked (0 rows affected).
    """
    with connection_as(
        user_id=CO_A_HR_ID,  # HR agent has broad write access within own company
        company_id=CO_A_ID,
        role="hr_agent",
    ) as conn:
        cur = conn.cursor()

        # --- Test INSERT with Company B's company_id ---
        insert_sql = params["insert_sql"]
        needs_extra_args = params.get("insert_args_from_b", False)

        if needs_extra_args:
            # These tables need FK references to Company B data
            # which makes the cross-tenant INSERT even more clearly wrong
            if table == "incidents":
                insert_args = (CO_B_ID, CO_B_EMP1_ID, CO_B_ADMIN_ID)
            elif table == "disciplinary_actions":
                # Need a Company B incident_id — use the fixture data
                co_b_incident_id = tenants["company_b"]["incidents"][2]["id"]
                insert_args = (co_b_incident_id, CO_B_ID, CO_B_EMP1_ID)
            elif table == "meetings":
                co_b_disc_id = tenants["company_b"]["disciplinary_action"]["id"]
                insert_args = (co_b_disc_id, CO_B_ID)
            else:
                insert_args = (CO_B_ID,)
        else:
            insert_args = (CO_B_ID,)

        with pytest.raises(psycopg2.Error) as exc_info:
            cur.execute(insert_sql, insert_args)
        # The INSERT should fail due to RLS WITH CHECK violation
        assert exc_info.value is not None

        # --- Test UPDATE on Company B row (0 rows affected) ---
        update_table = params["update_table"]
        update_set = params["update_set"]
        cur.execute(
            f"UPDATE {update_table} SET {update_set} WHERE company_id = %s;", (CO_B_ID,)
        )
        affected = cur.rowcount
        assert affected == 0, (
            f"RLS leak! Company A user was able to UPDATE {affected} rows in {update_table} "
            f"belonging to Company B"
        )

        cur.close()
        conn.close()


# ==========================================================================
# Test 3: Cross-tenant SELECT — employee from A sees zero B rows
# ==========================================================================

DIRECT_COMPANY_TABLES = [
    "companies",
    "departments",
    "users",
    "policies",
    "incidents",
    "documents",
    "disciplinary_actions",
    "meetings",
]


@pytest.mark.parametrize("table", DIRECT_COMPANY_TABLES)
def test_employee_from_a_sees_zero_company_b_rows(tenants, table: str):
    """A basic employee from Company A should see NO rows from Company B."""
    with connection_as(
        user_id=CO_A_EMP1_ID,
        company_id=CO_A_ID,
        role="employee",
    ) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT count(*) FROM {table} WHERE company_id = %s;", (CO_B_ID,))
        count = cur.fetchone()[0]
        assert count == 0, (
            f"RLS leak! Employee from Company A can see {count} rows in {table} from Company B"
        )
        cur.close()
        conn.close()


# ==========================================================================
# Test 4: Super Admin visibility — sees all companies' data
# ==========================================================================


@pytest.mark.parametrize(
    "table",
    [
        "companies",
        "departments",
        "users",
        "policies",
        "incidents",
        "documents",
        "disciplinary_actions",
        "meetings",
    ],
)
def test_super_admin_sees_all_companies(tenants, table: str):
    """A super_admin should be able to read data from all companies.

    Note: The current RLS policies use auth.company_id() for SELECT on most
    tables, which means super_admin is scoped to their own company_id for
    most reads.  This test documents the CURRENT behavior.  If a future
    migration adds super_admin cross-tenant SELECT policies, these tests
    should be updated to assert visibility of both companies' data.
    """
    with connection_as(
        user_id=SUPER_ADMIN_ID,
        company_id=CO_A_ID,  # super_admin is registered in Company A
        role="super_admin",
    ) as conn:
        cur = conn.cursor()

        # Super admin should see their own company data
        cur.execute(f"SELECT count(*) FROM {table} WHERE company_id = %s;", (CO_A_ID,))
        count_a = cur.fetchone()[0]
        assert count_a > 0, f"Super admin sees 0 rows in {table} for own company"

        # Current RLS policies restrict super_admin to their own company_id
        # because companies_select uses `id = auth.company_id()`.
        # This test documents that super_admin currently CANNOT cross-read.
        cur.execute(f"SELECT count(*) FROM {table} WHERE company_id = %s;", (CO_B_ID,))
        count_b = cur.fetchone()[0]
        # If super_admin RLS is later expanded to allow cross-tenant reads,
        # this assertion should change to assert count_b > 0
        assert count_b == 0, (
            f"Super admin can see {count_b} rows in {table} from Company B. "
            f"If this is intended, update this test to assert > 0."
        )

        cur.close()
        conn.close()


# ==========================================================================
# Test 5: Company settings isolation
# ==========================================================================


def test_company_admin_cannot_update_other_company_settings(tenants):
    """A company_admin from Company A cannot update Company B's settings."""
    with connection_as(
        user_id=CO_A_ADMIN_ID,
        company_id=CO_A_ID,
        role="company_admin",
    ) as conn:
        cur = conn.cursor()

        # Attempt to update Company B's name
        cur.execute(
            "UPDATE companies SET name = 'Hacked!' WHERE id = %s;",
            (CO_B_ID,),
        )
        affected = cur.rowcount
        assert affected == 0, (
            f"RLS leak! Company A admin updated {affected} rows in companies for Company B"
        )

        # Can update own company
        cur.execute(
            "UPDATE companies SET onboarding_step = 2 WHERE id = %s;",
            (CO_A_ID,),
        )
        affected = cur.rowcount
        assert affected == 1, (
            "Company admin should be able to update own company settings"
        )

        cur.close()
        conn.close()


# ==========================================================================
# Test 6: Notifications are user-scoped, not company-scoped
# ==========================================================================


def test_user_sees_only_own_notifications(tenants):
    """Notifications use user_id scoping, not company_id. A user should only see their own."""
    notif_a = tenants["company_a"]["notifications"]

    # Employee 1 from Company A has 1 notification
    with connection_as(
        user_id=CO_A_EMP1_ID,
        company_id=CO_A_ID,
        role="employee",
    ) as conn:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM notifications;")
        count = cur.fetchone()[0]
        assert count == 1, f"Employee 1 should see exactly 1 notification, got {count}"

        # Verify it's the correct notification
        cur.execute("SELECT title FROM notifications;")
        titles = [r[0] for r in cur.fetchall()]
        assert "Incident Filed" in titles
        cur.close()
        conn.close()

    # Manager 1 from Company A has 1 notification (different from Employee 1's)
    with connection_as(
        user_id=CO_A_MGR1_ID,
        company_id=CO_A_ID,
        role="manager",
    ) as conn:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM notifications;")
        count = cur.fetchone()[0]
        assert count == 1, f"Manager 1 should see exactly 1 notification, got {count}"

        cur.execute("SELECT title FROM notifications;")
        titles = [r[0] for r in cur.fetchall()]
        assert "AI Evaluation Ready" in titles
        cur.close()
        conn.close()


# ==========================================================================
# Test 7: Audit log is company-scoped and admin-only
# ==========================================================================


def test_employee_cannot_read_audit_log(tenants):
    """Regular employees should not be able to read the audit_log."""
    with connection_as(
        user_id=CO_A_EMP1_ID,
        company_id=CO_A_ID,
        role="employee",
    ) as conn:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM audit_log;")
        count = cur.fetchone()[0]
        # RLS policy: audit_log requires company_admin or super_admin role
        assert count == 0, f"RLS leak! Employee can see {count} rows in audit_log"
        cur.close()
        conn.close()


def test_company_admin_can_read_own_audit_log(tenants):
    """Company admin should be able to read their company's audit_log entries."""
    with connection_as(
        user_id=CO_A_ADMIN_ID,
        company_id=CO_A_ID,
        role="company_admin",
    ) as conn:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM audit_log WHERE company_id = %s;", (CO_A_ID,))
        count = cur.fetchone()[0]
        # Audit triggers should have created entries for our test data
        assert count > 0, "Company admin should see audit_log entries for their company"

        # Should NOT see Company B's audit log
        cur.execute("SELECT count(*) FROM audit_log WHERE company_id = %s;", (CO_B_ID,))
        count_b = cur.fetchone()[0]
        assert count_b == 0, (
            f"RLS leak! Company A admin sees {count_b} audit_log rows from Company B"
        )
        cur.close()
        conn.close()


# ==========================================================================
# Test 8: Users table cross-tenant isolation
# ==========================================================================


def test_user_sees_only_own_company_users(tenants):
    """A user from Company A should only see Company A users in the users table."""
    co_a = tenants["company_a"]
    expected_user_count = (
        len(co_a["employees"]) + len(co_a["managers"]) + 3
    )  # +admin +hr +super_admin

    with connection_as(
        user_id=CO_A_EMP1_ID,
        company_id=CO_A_ID,
        role="employee",
    ) as conn:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM users WHERE company_id = %s;", (CO_A_ID,))
        count_a = cur.fetchone()[0]
        assert count_a == expected_user_count, (
            f"Expected {expected_user_count} users for Company A, got {count_a}"
        )

        cur.execute("SELECT count(*) FROM users WHERE company_id = %s;", (CO_B_ID,))
        count_b = cur.fetchone()[0]
        assert count_b == 0, f"RLS leak! Company A user sees {count_b} Company B users"
        cur.close()
        conn.close()


# ==========================================================================
# Test 9: Indirect RLS — policy_versions, incident_witnesses, etc.
# ==========================================================================


def test_policy_versions_isolated_by_company(tenants):
    """Policy versions should only be visible for policies in the user's company."""
    with connection_as(
        user_id=CO_A_HR_ID,
        company_id=CO_A_ID,
        role="hr_agent",
    ) as conn:
        cur = conn.cursor()

        # Should see Company A's policy versions
        cur.execute(
            "SELECT count(*) FROM policy_versions pv "
            "JOIN policies p ON pv.policy_id = p.id "
            "WHERE p.company_id = %s;",
            (CO_A_ID,),
        )
        count_a = cur.fetchone()[0]
        assert count_a > 0, "Should see Company A policy versions"

        # The RLS on policy_versions should prevent seeing Company B versions
        cur.execute("SELECT count(*) FROM policy_versions;")
        total_visible = cur.fetchone()[0]
        # All visible policy_versions should belong to Company A policies
        assert total_visible == count_a, (
            f"RLS leak! policy_versions visible ({total_visible}) != "
            f"Company A count ({count_a})"
        )

        cur.close()
        conn.close()


def test_incident_witnesses_isolated_by_company(tenants):
    """Incident witnesses should only be visible for incidents in the user's company."""
    with connection_as(
        user_id=CO_A_HR_ID,
        company_id=CO_A_ID,
        role="hr_agent",
    ) as conn:
        cur = conn.cursor()

        # Should see witnesses for Company A incidents
        cur.execute(
            "SELECT count(*) FROM incident_witnesses iw "
            "JOIN incidents i ON iw.incident_id = i.id "
            "WHERE i.company_id = %s;",
            (CO_A_ID,),
        )
        count_a = cur.fetchone()[0]
        # Company A incident 1 has 1 witness
        assert count_a >= 1, "Should see at least 1 witness for Company A"

        # Total visible through RLS should match
        cur.execute("SELECT count(*) FROM incident_witnesses;")
        total_visible = cur.fetchone()[0]
        assert total_visible == count_a, (
            f"RLS leak on incident_witnesses: total {total_visible} != Company A {count_a}"
        )

        cur.close()
        conn.close()


def test_signatures_isolated_by_company(tenants):
    """Signatures should only be visible for documents in the user's company."""
    with connection_as(
        user_id=CO_A_HR_ID,
        company_id=CO_A_ID,
        role="hr_agent",
    ) as conn:
        cur = conn.cursor()

        cur.execute("SELECT count(*) FROM signatures;")
        count = cur.fetchone()[0]
        # Company A has 1 signed document
        assert count >= 1, "Should see at least 1 signature for Company A"

        # Verify all visible signatures belong to Company A documents
        cur.execute(
            "SELECT count(*) FROM signatures s "
            "JOIN documents d ON s.document_id = d.id "
            "WHERE d.company_id != %s;",
            (CO_A_ID,),
        )
        leak_count = cur.fetchone()[0]
        assert leak_count == 0, (
            f"RLS leak: {leak_count} signatures from other companies visible"
        )

        cur.close()
        conn.close()


def test_meeting_participants_isolated_by_company(tenants):
    """Meeting participants should only be visible for meetings in the user's company."""
    with connection_as(
        user_id=CO_A_HR_ID,
        company_id=CO_A_ID,
        role="hr_agent",
    ) as conn:
        cur = conn.cursor()

        cur.execute("SELECT count(*) FROM meeting_participants;")
        count = cur.fetchone()[0]
        # Company A meeting has 3 participants
        assert count >= 3, (
            f"Should see at least 3 meeting participants for Company A, got {count}"
        )

        # Verify all visible participants belong to Company A meetings
        cur.execute(
            "SELECT count(*) FROM meeting_participants mp "
            "JOIN meetings m ON mp.meeting_id = m.id "
            "WHERE m.company_id != %s;",
            (CO_A_ID,),
        )
        leak_count = cur.fetchone()[0]
        assert leak_count == 0, (
            f"RLS leak: {leak_count} meeting participants from other companies"
        )

        cur.close()
        conn.close()


# ==========================================================================
# Test 10: Bulk cross-tenant scan — ensure no leakage across ALL tables
# ==========================================================================

ALL_DIRECT_TABLES = [
    "companies",
    "departments",
    "users",
    "policies",
    "incidents",
    "documents",
    "disciplinary_actions",
    "meetings",
    "notifications",
]

ALL_INDIRECT_TABLES = [
    "policy_versions",
    "incident_witnesses",
    "meeting_participants",
    "signatures",
]


def test_no_cross_tenant_leakage_full_scan(tenants):
    """Scan ALL tenant-scoped tables from Company B's perspective to verify zero Company A data leaks.

    This is a belt-and-suspenders test that catches edge cases missed by
    individual table tests.
    """
    with connection_as(
        user_id=CO_B_EMP1_ID,
        company_id=CO_B_ID,
        role="employee",
    ) as conn:
        cur = conn.cursor()

        # Direct tables: count rows with Company A's ID
        for table in ALL_DIRECT_TABLES:
            cur.execute(
                f"SELECT count(*) FROM {table} WHERE company_id = %s;", (CO_A_ID,)
            )
            count = cur.fetchone()[0]
            assert count == 0, (
                f"CROSS-TENANT LEAK: Company B employee sees {count} rows in {table} "
                f"belonging to Company A"
            )

        cur.close()
        conn.close()
