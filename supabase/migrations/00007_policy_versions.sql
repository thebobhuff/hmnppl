-- ============================================================
-- Migration: 00007_policy_versions.sql
-- Description: Create policy_versions table (immutable version history)
-- ============================================================

CREATE TABLE policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    version INT NOT NULL,
    content TEXT NOT NULL,
    rules JSONB NOT NULL,
    severity_levels JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(policy_id, version)
);

CREATE INDEX idx_policy_versions_policy_id ON policy_versions(policy_id);

COMMENT ON TABLE policy_versions IS 'Immutable policy version history. Appended on each edit, never updated.';
