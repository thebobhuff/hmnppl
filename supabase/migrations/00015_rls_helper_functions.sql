-- ============================================================
-- Migration: 00015_rls_helper_functions.sql
-- Description: Helper functions for RLS policies (tenant isolation
--              and role checks)
-- ============================================================

-- Returns the company_id for the currently authenticated user
CREATE OR REPLACE FUNCTION public.company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns the role for the currently authenticated user
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS VARCHAR AS $$
    SELECT role::VARCHAR FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns true if the current user has one of the specified roles
CREATE OR REPLACE FUNCTION public.has_role(roles user_role[])
RETURNS BOOLEAN AS $$
    SELECT role = ANY(roles) FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.company_id() IS 'Returns company_id of current user. Used in RLS policies for tenant isolation.';
COMMENT ON FUNCTION public.user_role() IS 'Returns role of current user. Used in RLS policies for role-based access.';
COMMENT ON FUNCTION public.has_role(user_role[]) IS 'Returns true if current user has any of the specified roles.';
