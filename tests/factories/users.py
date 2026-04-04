"""User factory function.

Creates a user record using the service-role connection (bypasses RLS)
and returns the created row as a dict.

Note: The users table uses the Supabase Auth UID as its PK.  For tests,
we insert directly with a known UUID rather than going through the Auth API.
"""

from __future__ import annotations

from typing import Any

import psycopg2.extras


def create_user(
    cur: psycopg2.extras.RealDictCursor,
    *,
    id: str,
    company_id: str,
    role: str = "employee",
    first_name: str = "Test",
    last_name: str = "User",
    email: str | None = None,
    phone: str | None = None,
    job_title: str | None = None,
    department_id: str | None = None,
    manager_id: str | None = None,
    status: str = "active",
    hire_date: str | None = None,
) -> dict[str, Any]:
    """Insert a user and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        id: UUID matching the Supabase Auth user ID.
        company_id: The tenant/company this user belongs to.
        role: One of super_admin, company_admin, hr_agent, manager, employee.
        first_name: User first name.
        last_name: User last name.
        email: User email. Defaults to ``first_name.last_name@{company_id[:8]}.test``.
        phone: Phone number (optional).
        job_title: Job title (optional).
        department_id: Department UUID (optional).
        manager_id: Manager's user UUID (optional).
        status: Account status (default: "active").
        hire_date: ISO date string (optional).

    Returns:
        Dict with all user columns.
    """
    if email is None:
        # Generate a deterministic email from name and company
        slug = company_id[:8]
        email = f"{first_name.lower()}.{last_name.lower()}@{slug}.test"

    cols = [
        "id",
        "company_id",
        "role",
        "first_name",
        "last_name",
        "email",
        "status",
    ]
    vals = [
        id,
        company_id,
        role,
        first_name,
        last_name,
        email,
        status,
    ]

    optional_fields = {
        "phone": phone,
        "job_title": job_title,
        "department_id": department_id,
        "manager_id": manager_id,
        "hire_date": hire_date,
    }
    for col_name, value in optional_fields.items():
        if value is not None:
            cols.append(col_name)
            vals.append(value)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO users ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    return dict(cur.fetchone())


def create_department(
    cur: psycopg2.extras.RealDictCursor,
    *,
    id: str | None = None,
    company_id: str = "",
    name: str = "General",
    head_id: str | None = None,
) -> dict[str, Any]:
    """Insert a department and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        id: Optional fixed UUID.
        company_id: The tenant/company this department belongs to.
        name: Department name.
        head_id: Department head user UUID (optional).

    Returns:
        Dict with all department columns.
    """
    cols = ["company_id", "name"]
    vals = [company_id, name]

    if id is not None:
        cols.insert(0, "id")
        vals.insert(0, id)
    if head_id is not None:
        cols.append("head_id")
        vals.append(head_id)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO departments ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    return dict(cur.fetchone())
