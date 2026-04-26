-- ============================================================
-- Migration: 00023_high_risk_incident_types.sql
-- Description: Add Lijo-required high-risk incident types that
--              bypass the agent loop and route directly to HR.
-- ============================================================

ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'safety_violation';
ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'violence';
ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'harassment';
ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'financial_impropriety';
ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'protected_class_concern';
