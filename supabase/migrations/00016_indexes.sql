-- ============================================================
-- Migration: 00016_indexes.sql
-- Description: Additional performance indexes for common query
--              patterns (HR queue, employee portal, reporting)
-- ============================================================

-- ── Companies ──────────────────────────────────────────────
CREATE INDEX idx_companies_subscription ON companies(subscription_tier);
CREATE INDEX idx_companies_onboarding ON companies(onboarding_completed) WHERE onboarding_completed = false;

-- ── Users ──────────────────────────────────────────────────
-- Manager's team lookup: "who reports to me?"
CREATE INDEX idx_users_manager_team ON users(manager_id) WHERE status = 'active';

-- Employee directory search
CREATE INDEX idx_users_name_search ON users(company_id, first_name, last_name);

-- Users by hire date (for onboarding/analytics)
CREATE INDEX idx_users_hire_date ON users(company_id, hire_date DESC);

-- ── Departments ────────────────────────────────────────────
CREATE INDEX idx_departments_name ON departments(company_id, name);

-- ── Incidents ──────────────────────────────────────────────
-- HR queue filter by status + type (covering index)
CREATE INDEX idx_incidents_queue_filter
    ON incidents(company_id, status, type, created_at DESC)
    INCLUDE (employee_id, severity);

-- Incident search by date range (for reporting)
CREATE INDEX idx_incidents_date_range
    ON incidents(company_id, incident_date, severity);

-- Incidents linked to a policy
CREATE INDEX idx_incidents_linked_policy
    ON incidents(linked_policy_id) WHERE linked_policy_id IS NOT NULL;

-- Union-involved incidents (legal escalation queries)
CREATE INDEX idx_incidents_union
    ON incidents(company_id) WHERE union_involved = true;

-- ── Disciplinary Actions ──────────────────────────────────
-- Pending approval queue for company admins
CREATE INDEX idx_disciplinary_actions_pending
    ON disciplinary_actions(company_id, status, created_at DESC)
    WHERE status = 'pending_approval';

-- Actions by employee (employee portal: "my actions")
CREATE INDEX idx_disciplinary_actions_employee_portal
    ON disciplinary_actions(employee_id, status, created_at DESC)
    INCLUDE (action_type);

-- ── Documents ──────────────────────────────────────────────
-- Documents awaiting signature
CREATE INDEX idx_documents_pending_signature
    ON documents(company_id, status, updated_at DESC)
    WHERE status = 'pending_signature';

-- Document version lookup
CREATE INDEX idx_documents_version
    ON documents(company_id, type, version DESC);

-- ── Meetings ───────────────────────────────────────────────
-- Upcoming meetings for a user (via participants)
CREATE INDEX idx_meetings_upcoming
    ON meetings(company_id, scheduled_at)
    WHERE status = 'scheduled';

-- ── Notifications ──────────────────────────────────────────
-- Notification type analytics
CREATE INDEX idx_notifications_type
    ON notifications(company_id, type, created_at DESC);

-- Cleanup old read notifications (for data retention jobs)
CREATE INDEX idx_notifications_old_read
    ON notifications(read_at)
    WHERE read = true;

-- ── Audit Log ──────────────────────────────────────────────
-- Covering index for entity audit trail query
CREATE INDEX idx_audit_log_entity_trail
    ON audit_log(entity_type, entity_id, created_at DESC)
    INCLUDE (action, user_id);

-- ── Signatures ─────────────────────────────────────────────
-- Signature lookup by document (all signers for a doc)
CREATE INDEX idx_signatures_document_signed
    ON signatures(document_id, signed_at DESC);
