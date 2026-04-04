-- ============================================================
-- Migration: 00003_companies.sql
-- Description: Create companies table (tenant root)
-- ============================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    country VARCHAR(2),
    region VARCHAR(100),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    ai_confidence_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    dispute_enabled BOOLEAN NOT NULL DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{"notification_prefs": {}, "feature_flags": {"ai_auto_generate": false, "ai_meeting_summary": false, "employee_dispute": true, "microsoft_sso": false, "e_signature_v2": false}, "ai_monthly_budget_usd": 50}'::jsonb,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    onboarding_step INT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Top-level tenant table. Each company is an isolated tenant.';
COMMENT ON COLUMN companies.settings IS 'JSONB blob for notification preferences, feature flags, and AI budget configuration.';
COMMENT ON COLUMN companies.ai_confidence_threshold IS 'Minimum AI confidence score (0.00–1.00) to auto-approve evaluations.';
