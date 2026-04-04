-- ============================================================
-- Migration: 00004_departments.sql
-- Description: Create departments table (FK to companies, head_id
--              added after users table via migration 00005)
-- ============================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_id UUID, -- FK added after users table in 00005
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departments_company_id ON departments(company_id);

COMMENT ON TABLE departments IS 'Company departments. head_id references users(id) — FK added in 00005.';
