-- ============================================================
-- Migration: 00002_enums.sql
-- Description: Create all custom ENUM types for the HR platform
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'super_admin',
    'company_admin',
    'hr_agent',
    'manager',
    'employee'
);

CREATE TYPE incident_type AS ENUM (
    'tardiness',
    'absence',
    'insubordination',
    'performance',
    'misconduct',
    'violation_of_policy',
    'theft',
    'other'
);

CREATE TYPE incident_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE incident_status AS ENUM (
    'ai_evaluating',
    'ai_evaluated',
    'pending_hr_review',
    'approved',
    'rejected',
    'meeting_scheduled',
    'document_delivered',
    'pending_signature',
    'signed',
    'disputed',
    'closed',
    'escalated_legal'
);

CREATE TYPE action_type AS ENUM (
    'verbal_warning',
    'written_warning',
    'pip',
    'termination_review'
);

CREATE TYPE action_status AS ENUM (
    'pending_approval',
    'approved',
    'rejected',
    'escalated'
);

CREATE TYPE meeting_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE document_status AS ENUM (
    'draft',
    'pending_signature',
    'signed',
    'disputed',
    'locked'
);

CREATE TYPE signature_type AS ENUM (
    'drawn',
    'typed'
);

CREATE TYPE notification_type AS ENUM (
    'incident_submitted',
    'ai_evaluation_complete',
    'document_approved',
    'document_rejected',
    'meeting_scheduled',
    'document_awaiting_signature',
    'document_signed',
    'dispute_submitted',
    'reminder_24h',
    'reminder_72h',
    'reminder_7d',
    'ai_budget_alert'
);
