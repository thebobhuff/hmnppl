-- ============================================================
-- Migration: 00011_meetings.sql
-- Description: Create meetings and meeting_participants tables
-- ============================================================

CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciplinary_action_id UUID NOT NULL REFERENCES disciplinary_actions(id),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    agenda TEXT,
    scheduled_at TIMESTAMPTZ,
    duration_minutes INT,
    meeting_link TEXT,
    notes TEXT,
    ai_summary JSONB,
    action_items JSONB DEFAULT '[]'::jsonb,
    outcome TEXT,
    status meeting_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

CREATE TABLE meeting_participants (
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    attendance_status VARCHAR(20) DEFAULT 'invited',
    PRIMARY KEY (meeting_id, user_id)
);

CREATE INDEX idx_meetings_company_id ON meetings(company_id);
CREATE INDEX idx_meetings_disciplinary_action_id ON meetings(disciplinary_action_id);
CREATE INDEX idx_meetings_status ON meetings(company_id, status);
CREATE INDEX idx_meetings_scheduled_at ON meetings(company_id, scheduled_at);
CREATE INDEX idx_meeting_participants_user_id ON meeting_participants(user_id);

COMMENT ON TABLE meetings IS 'Disciplinary meetings linked to actions. Supports AI-generated summaries.';
