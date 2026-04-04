"""Document and signature factory functions.

Creates documents, signatures, meetings, meeting_participants, notifications,
and audit_log records using the service-role connection (bypasses RLS).
"""

from __future__ import annotations

from typing import Any

import json

import psycopg2.extras


def create_signed_document(
    cur: psycopg2.extras.RealDictCursor,
    *,
    company_id: str,
    created_by: str | None = None,
    doc_id: str | None = None,
    type: str = "written_warning",
    title: str = "Test Written Warning",
    content: str = "This is a test disciplinary document.",
    status: str = "pending_signature",
    version: int = 1,
    signer_id: str | None = None,
    signer_role: str = "employee",
    signature_type: str = "typed",
    signature_data: str = "John Doe - typed signature",
    content_hash: str = "abc123def456",
) -> dict[str, Any]:
    """Create a document and optionally a signature in one call.

    This is a convenience factory for the common pattern of creating a
    document and then signing it.

    Args:
        cur: A service-role cursor (RealDictCursor).
        company_id: The tenant/company UUID.
        created_by: User UUID who created the document.
        doc_id: Optional fixed UUID for the document.
        type: Document type string.
        title: Document title.
        content: Document text content.
        status: document_status enum value.
        version: Document version number.
        signer_id: If provided, creates a signature for this user.
        signer_role: Role of the signer at signing time.
        signature_type: signature_type enum value.
        signature_data: Signature payload (base64 image or typed text).
        content_hash: SHA-256 hash of the document content.

    Returns:
        Dict with "document" and optionally "signature" keys.
    """
    # --- Document ---
    doc_cols = ["company_id", "type", "title", "content", "status", "version"]
    doc_vals = [company_id, type, title, content, status, version]

    if doc_id is not None:
        doc_cols.insert(0, "id")
        doc_vals.insert(0, doc_id)
    if created_by is not None:
        doc_cols.append("created_by")
        doc_vals.append(created_by)

    placeholders = ", ".join(["%s"] * len(doc_vals))
    col_str = ", ".join(doc_cols)

    cur.execute(
        f"INSERT INTO documents ({col_str}) VALUES ({placeholders}) RETURNING *;",
        doc_vals,
    )
    document = dict(cur.fetchone())

    result: dict[str, Any] = {"document": document}

    # --- Signature (optional) ---
    if signer_id is not None:
        sig_cols = [
            "document_id",
            "signer_id",
            "signer_role",
            "signature_type",
            "signature_data",
            "content_hash",
        ]
        sig_vals = [
            document["id"],
            signer_id,
            signer_role,
            signature_type,
            signature_data,
            content_hash,
        ]

        placeholders = ", ".join(["%s"] * len(sig_vals))
        col_str = ", ".join(sig_cols)

        cur.execute(
            f"INSERT INTO signatures ({col_str}) VALUES ({placeholders}) RETURNING *;",
            sig_vals,
        )
        result["signature"] = dict(cur.fetchone())

    return result


def create_meeting(
    cur: psycopg2.extras.RealDictCursor,
    *,
    disciplinary_action_id: str,
    company_id: str,
    type: str = "disciplinary",
    agenda: str | None = None,
    scheduled_at: str | None = None,
    duration_minutes: int = 30,
    status: str = "scheduled",
    participants: list[dict] | None = None,
) -> dict[str, Any]:
    """Create a meeting and optionally meeting_participants.

    Args:
        cur: A service-role cursor (RealDictCursor).
        disciplinary_action_id: The parent disciplinary_action UUID.
        company_id: The tenant/company UUID.
        type: Meeting type.
        agenda: Meeting agenda text.
        scheduled_at: ISO timestamp string.
        duration_minutes: Meeting duration.
        status: meeting_status enum value.
        participants: List of dicts with "user_id" and "role" keys.

    Returns:
        Dict with "meeting" and optionally "participants" keys.
    """
    cols = [
        "disciplinary_action_id",
        "company_id",
        "type",
        "duration_minutes",
        "status",
    ]
    vals = [
        disciplinary_action_id,
        company_id,
        type,
        duration_minutes,
        status,
    ]

    if agenda is not None:
        cols.append("agenda")
        vals.append(agenda)
    if scheduled_at is not None:
        cols.append("scheduled_at")
        vals.append(scheduled_at)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO meetings ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    meeting = dict(cur.fetchone())

    result: dict[str, Any] = {"meeting": meeting}

    # Add participants if provided
    if participants:
        result["participants"] = []
        for p in participants:
            cur.execute(
                "INSERT INTO meeting_participants (meeting_id, user_id, role) VALUES (%s, %s, %s) RETURNING *;",
                (meeting["id"], p["user_id"], p["role"]),
            )
            result["participants"].append(dict(cur.fetchone()))

    return result


def create_notification(
    cur: psycopg2.extras.RealDictCursor,
    *,
    company_id: str,
    user_id: str,
    type: str = "incident_submitted",
    title: str = "Test Notification",
    message: str = "This is a test notification.",
    entity_type: str | None = None,
    entity_id: str | None = None,
    read: bool = False,
) -> dict[str, Any]:
    """Insert a notification and return its data as a dict.

    Args:
        cur: A service-role cursor (RealDictCursor).
        company_id: The tenant/company UUID.
        user_id: The target user UUID.
        type: notification_type enum value.
        title: Notification title.
        message: Notification body text.
        entity_type: Optional entity type for linking.
        entity_id: Optional entity UUID for linking.
        read: Whether the notification has been read.

    Returns:
        Dict with all notification columns.
    """
    cols = ["company_id", "user_id", "type", "title", "message", "read"]
    vals = [company_id, user_id, type, title, message, read]

    if entity_type is not None:
        cols.append("entity_type")
        vals.append(entity_type)
    if entity_id is not None:
        cols.append("entity_id")
        vals.append(entity_id)

    placeholders = ", ".join(["%s"] * len(vals))
    col_str = ", ".join(cols)

    cur.execute(
        f"INSERT INTO notifications ({col_str}) VALUES ({placeholders}) RETURNING *;",
        vals,
    )
    return dict(cur.fetchone())
