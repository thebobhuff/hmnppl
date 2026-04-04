-- ============================================================
-- Migration: 00010_disciplinary_actions.sql
-- Description: Create disciplinary_actions table (links incidents to
--              actions and documents)
-- ============================================================

CREATE TABLE disciplinary_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT UNIQUE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id),
    action_type action_type NOT NULL,
    document_id UUID REFERENCES documents(id), -- nullable, set after doc generation
    status action_status NOT NULL DEFAULT 'pending_approval',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    follow_up_actions JSONB DEFAULT '[]'::jsonb,
    rejection_reason TEXT,
    rejection_next_step VARCHAR(50),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disciplinary_actions_company_id ON disciplinary_actions(company_id);
CREATE INDEX idx_disciplinary_actions_incident_id ON disciplinary_actions(incident_id);
CREATE INDEX idx_disciplinary_actions_employee_id ON disciplinary_actions(employee_id);
CREATE INDEX idx_disciplinary_actions_status ON disciplinary_actions(company_id, status);
CREATE INDEX idx_disciplinary_actions_document_id ON disciplinary_actions(document_id);

COMMENT ON TABLE disciplinary_actions IS 'Disciplinary actions tied to incidents. One action per incident (UNIQUE on incident_id).';
COMMENT ON COLUMN disciplinary_actions.document_id IS 'Set after document is generated. Nullable until document is created.';
