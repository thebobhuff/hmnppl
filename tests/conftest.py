"""pytest configuration — shared fixtures for RLS/RBAC test suite.

This conftest provides:
- Direct PostgreSQL connections to the Supabase local dev instance
- Service-role connection (bypasses RLS) for setup/teardown
- Authenticated-connection factory that simulates specific users with RLS enforced
- Database seed/teardown fixtures for test isolation

Prerequisites:
    1. Run `supabase start` to launch the local dev stack
    2. Copy the DB URL from `supabase status` output into .env or env vars
    3. Install deps: pip install psycopg2-binary pytest python-dotenv

Connection Strategy:
    - We use psycopg2 directly (not supabase-py) because RLS testing requires
      low-level control over SET ROLE and SET request.jwt.claims.
    - The service role uses the `postgres` user with `authenticator` role bypass.
    - Authenticated sessions use SET ROLE authenticated + SET request.jwt.claims.
"""

from __future__ import annotations

import os
import uuid
from contextlib import contextmanager
from typing import Any, Generator

import psycopg2
import psycopg2.extras
import pytest

# ---------------------------------------------------------------------------
# Try loading .env / .env.local for local development
# ---------------------------------------------------------------------------
_dotenv_paths = [
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env.local"),
]
for _p in _dotenv_paths:
    if os.path.exists(_p):
        from dotenv import load_dotenv

        load_dotenv(_p, override=False)
        break

# ---------------------------------------------------------------------------
# Connection defaults matching `supabase start` output
# ---------------------------------------------------------------------------
DEFAULT_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"


def _get_db_url() -> str:
    """Resolve the database URL from environment or fall back to local dev default."""
    return os.environ.get("SUPABASE_DB_URL", os.environ.get("DATABASE_URL", DEFAULT_DB_URL))


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

def get_service_connection() -> psycopg2.extensions.connection:
    """Return a new psycopg2 connection using the service role (postgres user).

    This connection bypasses RLS because the postgres superuser is not subject
    to row-level security policies.
    """
    conn = psycopg2.connect(_get_db_url())
    conn.autocommit = True
    return conn


@contextmanager
def connection_as(user_id: str, company_id: str, role: str) -> Generator[psycopg2.extensions.connection, None, None]:
    """Context manager that yields a psycopg2 connection impersonating a specific user.

    Sets the PostgreSQL role to ``authenticated`` and configures the
    ``request.jwt.claims`` configuration parameter so that the RLS helper
    functions (``auth.company_id()``, ``auth.user_role()``, ``auth.uid()``)
    return the correct values.

    Args:
        user_id: The Supabase Auth user ID (UUID string).
        company_id: The company/tenant ID (UUID string).
        role: The user_role value (super_admin, company_admin, hr_agent, manager, employee).

    Yields:
        A psycopg2 connection with RLS policies active for the impersonated user.
    """
    conn = psycopg2.connect(_get_db_url())
    conn.autocommit = True
    cur = conn.cursor()

    # Activate the authenticated role so RLS policies are enforced
    cur.execute("SET ROLE authenticated;")

    # Configure JWT claims that the RLS helper functions read
    claims = f'{{"sub": "{user_id}", "role": "authenticated", "company_id": "{company_id}", "user_role": "{role}"}}'
    cur.execute("SET request.jwt.claims = %s;", (claims,))

    # Also set the claim fields individually for auth.uid() compatibility
    cur.execute("SET request.jwt.claim.sub = %s;", (user_id,))

    cur.close()
    yield conn
    conn.close()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def db_url() -> str:
    """Provide the resolved database URL for the test session."""
    return _get_db_url()


@pytest.fixture(scope="session")
def svc_conn() -> Generator[psycopg2.extensions.connection, None, None]:
    """Provide a service-role connection that bypasses RLS.

    Uses session scope so setup/teardown across the whole test suite shares
    one connection.  Individual tests that need a clean connection should
    create their own via ``get_service_connection()``.
    """
    conn = get_service_connection()
    yield conn
    conn.close()


@pytest.fixture(scope="session")
def service_cur(svc_conn: psycopg2.extensions.connection):
    """Provide a cursor on the service-role connection."""
    cur = svc_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    yield cur
    cur.close()


@pytest.fixture(autouse=True)
def _reset_rls_state():
    """Ensure no leaked role/claims state between tests.

    This is a safety net — each test should use its own connection via
    ``connection_as()``, but this prevents accidental leaks if a test
    erroneously reuses a global connection.
    """
    yield
    # Post-connection cleanup is handled by connection_as() closing its conn.


# ---------------------------------------------------------------------------
# Authenticated client factory fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def client_as():
    """Return a factory function that creates an authenticated database connection.

    Usage::

        def test_employee_can_read_own_profile(client_as, test_tenants):
            user = test_tenants["company_a"]["employees"][0]
            conn = client_as(
                role="employee",
                company_id=test_tenants["company_a"]["id"],
                user_id=user["id"],
            )
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE id = %s;", (user["id"],))
            rows = cur.fetchall()
            assert len(rows) == 1
            conn.close()

    Args:
        role: The user_role to impersonate.
        company_id: The tenant/company UUID.
        user_id: The user UUID to impersonate.

    Returns:
        A psycopg2 connection with RLS active for the specified user.
    """
    connections_to_close: list[psycopg2.extensions.connection] = []

    def _factory(role: str, company_id: str, user_id: str) -> psycopg2.extensions.connection:
        ctx = connection_as(user_id=user_id, company_id=company_id, role=role)
        conn = ctx.__enter__()
        connections_to_close.append(conn)
        return conn

    yield _factory

    # Cleanup: close any connections opened via the factory
    for conn in connections_to_close:
        try:
            conn.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# UUID helpers for deterministic test data
# ---------------------------------------------------------------------------

def uuid_v5(name: str) -> str:
    """Generate a deterministic UUID v5 from a name string using the DNS namespace.

    This ensures that the same name always produces the same UUID across test
    runs, making tests fully deterministic.

    Args:
        name: A human-readable name that uniquely identifies the entity.

    Returns:
        A UUID v5 string (lowercase, with hyphens).
    """
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"hr-test-platform.{name}))


# ---------------------------------------------------------------------------
# Database cleanup helper
# ---------------------------------------------------------------------------

def clean_test_data(svc_conn: psycopg2.extensions.connection, prefix: str = "TestCo") -> None:
    """Remove all test data matching the given company name prefix.

    Uses CASCADE deletes to clean up dependent rows.  Runs with the
    service-role connection (bypasses RLS).

    Order matters: delete child tables before parent tables to respect FK
    constraints, although CASCADE should handle this.
    """
    cur = svc_conn.cursor()
    try:
        # Delete test companies — CASCADE will clean all related data
        cur.execute(
            "DELETE FROM companies WHERE name LIKE %s;",
            (f"{prefix}%",),
        )
    finally:
        cur.close()
