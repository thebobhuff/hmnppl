-- ============================================================
-- Migration: 00005_users.sql
-- Description: Create users table + back-fill departments.head_id FK
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY, -- Supabase Auth user ID — no DEFAULT, set by auth.uid()
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'employee',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(255),
    avatar_url TEXT,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    hire_date DATE,
    termination_date DATE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-fill FK: departments.head_id → users.id
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head
    FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

-- Unique email per company (same email can exist in different tenants)
CREATE UNIQUE INDEX uniq_users_email_per_company ON users(company_id, email);

-- Performance indexes
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_role ON users(company_id, role);
CREATE INDEX idx_users_status ON users(company_id, status);

COMMENT ON TABLE users IS 'Platform users. id matches Supabase Auth uid. Email is unique per company.';
COMMENT ON COLUMN users.manager_id IS 'Self-referencing FK for org-chart hierarchy.';
