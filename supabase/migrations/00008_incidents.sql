-- ============================================================
-- Migration: 00008_incidents.sql
-- Description: Create incidents and incident_witnesses tables
-- ============================================================

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reference_number VARCHAR(20) NOT NULL,
    type incident_type NOT NULL,
    description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    severity incident_severity NOT NULL,
    evidence_attachments JSONB DEFAULT '[]'::jsonb,
    union_involved BOOLEAN NOT NULL DEFAULT false,
    status incident_status NOT NULL DEFAULT 'ai_evaluating',
    ai_confidence_score NUMERIC(3,2),
    ai_evaluation_status VARCHAR(20) DEFAULT 'pending',
    ai_recommendation JSONB,
    linked_policy_id UUID REFERENCES policies(id),
    policy_snapshot JSONB,
    policy_version INT,
    previous_incident_count INT NOT NULL DEFAULT 0,
    escalation_level INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, reference_number)
);

CREATE TABLE incident_witnesses (
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (incident_id, user_id)
);

-- Incident performance indexes
CREATE INDEX idx_incidents_company_id ON incidents(company_id);
CREATE INDEX idx_incidents_employee_id ON incidents(employee_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_status ON incidents(company_id, status);
CREATE INDEX idx_incidents_severity ON incidents(company_id, severity);
CREATE INDEX idx_incidents_date ON incidents(company_id, incident_date DESC);
CREATE INDEX idx_incidents_type ON incidents(company_id, type);

-- HR queue covering index: most common query pattern for HR dashboard
CREATE INDEX idx_incidents_hr_queue ON incidents(company_id, status, created_at DESC)
    INCLUDE (employee_id, type, severity);

-- Employee history index: lookup past incidents for an employee
CREATE INDEX idx_incidents_employee_history ON incidents(employee_id, incident_date DESC)
    INCLUDE (type, severity, status);

-- Witness lookup
CREATE INDEX idx_incident_witnesses_user_id ON incident_witnesses(user_id);

COMMENT ON TABLE incidents IS 'Disciplinary incident records. Reference number is unique per company.';
COMMENT ON COLUMN incidents.policy_snapshot IS 'Frozen copy of policy content at time of incident for audit trail.';
COMMENT ON COLUMN incidents.ai_recommendation IS 'AI-generated recommendation including suggested action type and reasoning.';
