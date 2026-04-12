-- ============================================================
-- Migration: 00022_ai_pipeline.sql
-- Description: Add AI pipeline columns for document storage
-- ============================================================

-- Add document_content to disciplinary_actions for AI-generated docs
ALTER TABLE disciplinary_actions
ADD COLUMN IF NOT EXISTS document_content TEXT;

COMMENT ON COLUMN disciplinary_actions.document_content IS 'AI-generated disciplinary document content (markdown). Stored here until formal document is created.';

-- Ensure incidents has AI evaluation columns (should exist but be safe)
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT;

ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS ai_evaluation_status VARCHAR(50);

ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS ai_recommendation JSONB;

ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS escalation_level INT;

ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS linked_policy_id UUID REFERENCES policies(id);
