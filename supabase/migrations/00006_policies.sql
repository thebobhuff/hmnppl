-- ============================================================
-- Migration: 00006_policies.sql
-- Description: Create policies table (company disciplinary policies)
-- ============================================================

CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    severity_levels JSONB,
    is_active BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    effective_date DATE,
    expiry_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_company_id ON policies(company_id);
CREATE INDEX idx_policies_category ON policies(company_id, category);
CREATE INDEX idx_policies_active ON policies(company_id, is_active) WHERE is_active = true;

COMMENT ON TABLE policies IS 'Company disciplinary policies. Versioned via policy_versions table.';
COMMENT ON COLUMN policies.rules IS 'JSONB array of rule definitions used by AI for evaluation.';
COMMENT ON COLUMN policies.severity_levels IS 'JSONB mapping of violation types to severity recommendations.';
