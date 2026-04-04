-- ============================================================
-- Migration: 00017_rls_policies.sql
-- Description: Enable RLS on all tables and create base tenant
--              isolation policies. Expanded in T008.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- Enable RLS on ALL tables
-- ════════════════════════════════════════════════════════════
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- Companies: users see their own company only
-- ════════════════════════════════════════════════════════════
CREATE POLICY companies_select ON companies
    FOR SELECT
    USING (id = public.company_id());

CREATE POLICY companies_update ON companies
    FOR UPDATE
    USING (id = public.company_id()
           AND public.user_role() IN ('super_admin', 'company_admin'));

-- ════════════════════════════════════════════════════════════
-- Users: see own company's users
-- ════════════════════════════════════════════════════════════
CREATE POLICY users_select ON users
    FOR SELECT
    USING (company_id = public.company_id());

CREATE POLICY users_insert ON users
    FOR INSERT
    WITH CHECK (company_id = public.company_id()
                AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'));

CREATE POLICY users_update ON users
    FOR UPDATE
    USING (company_id = public.company_id())
    WITH CHECK (company_id = public.company_id());

-- ════════════════════════════════════════════════════════════
-- Departments: company-scoped
-- ════════════════════════════════════════════════════════════
CREATE POLICY departments_select ON departments
    FOR SELECT
    USING (company_id = public.company_id());

CREATE POLICY departments_all ON departments
    FOR ALL
    USING (company_id = public.company_id()
           AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'))
    WITH CHECK (company_id = public.company_id()
                AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'));

-- ════════════════════════════════════════════════════════════
-- Policies: company-scoped
-- ════════════════════════════════════════════════════════════
CREATE POLICY policies_select ON policies
    FOR SELECT
    USING (company_id = public.company_id());

CREATE POLICY policies_all ON policies
    FOR ALL
    USING (company_id = public.company_id()
           AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'))
    WITH CHECK (company_id = public.company_id()
                AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'));

-- ════════════════════════════════════════════════════════════
-- Policy Versions: company-scoped (via policy)
-- ════════════════════════════════════════════════════════════
CREATE POLICY policy_versions_select ON policy_versions
    FOR SELECT
    USING (policy_id IN (SELECT id FROM policies WHERE company_id = public.company_id()));

CREATE POLICY policy_versions_insert ON policy_versions
    FOR INSERT
    WITH CHECK (policy_id IN (SELECT id FROM policies WHERE company_id = public.company_id())
                AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'));

-- ════════════════════════════════════════════════════════════
-- Incidents: company-scoped
-- ════════════════════════════════════════════════════════════
CREATE POLICY incidents_select ON incidents
    FOR SELECT
    USING (company_id = public.company_id());

CREATE POLICY incidents_all ON incidents
    FOR ALL
    USING (company_id = public.company_id()
           AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent', 'manager'))
    WITH CHECK (company_id = public.company_id());

-- ════════════════════════════════════════════════════════════
-- Incident Witnesses: company-scoped (via incident)
-- ════════════════════════════════════════════════════════════
CREATE POLICY incident_witnesses_select ON incident_witnesses
    FOR SELECT
    USING (incident_id IN (SELECT id FROM incidents WHERE company_id = public.company_id()));

CREATE POLICY incident_witnesses_all ON incident_witnesses
    FOR ALL
    USING (incident_id IN (SELECT id FROM incidents WHERE company_id = public.company_id())
           AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'))
    WITH CHECK (incident_id IN (SELECT id FROM incidents WHERE company_id = public.company_id()));

-- ════════════════════════════════════════════════════════════
-- Documents: company-scoped
-- ════════════════════════════════════════════════════════════
CREATE POLICY documents_select ON documents
    FOR SELECT
    USING (company_id = public.company_id());

CREATE POLICY documents_all ON documents
    FOR ALL
    USING (company_id = public.company_id())
    WITH CHECK (company_id = public.company_id());

-- ════════════════════════════════════════════════════════════
-- Disciplinary Actions: company-scoped
-- ════════════════════════════════════════════════════════════
CREATE POLICY disciplinary_actions_select ON disciplinary_actions
    FOR SELECT
    USING (company_id = public.company_id());

CREATE POLICY disciplinary_actions_all ON disciplinary_actions
    FOR ALL
    USING (company_id = public.company_id()
           AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'))
    WITH CHECK (company_id = public.company_id());

-- ════════════════════════════════════════════════════════════
-- Meetings: company-scoped
-- ════════════════════════════════════════════════════════════
CREATE POLICY meetings_select ON meetings
    FOR SELECT
    USING (company_id = public.company_id());

CREATE POLICY meetings_all ON meetings
    FOR ALL
    USING (company_id = public.company_id())
    WITH CHECK (company_id = public.company_id());

-- ════════════════════════════════════════════════════════════
-- Meeting Participants: company-scoped (via meeting)
-- ════════════════════════════════════════════════════════════
CREATE POLICY meeting_participants_select ON meeting_participants
    FOR SELECT
    USING (meeting_id IN (SELECT id FROM meetings WHERE company_id = public.company_id()));

CREATE POLICY meeting_participants_all ON meeting_participants
    FOR ALL
    USING (meeting_id IN (SELECT id FROM meetings WHERE company_id = public.company_id()))
    WITH CHECK (meeting_id IN (SELECT id FROM meetings WHERE company_id = public.company_id()));

-- ════════════════════════════════════════════════════════════
-- Signatures: company-scoped (via document)
-- ════════════════════════════════════════════════════════════
CREATE POLICY signatures_select ON signatures
    FOR SELECT
    USING (document_id IN (SELECT id FROM documents WHERE company_id = public.company_id()));

CREATE POLICY signatures_all ON signatures
    FOR ALL
    USING (document_id IN (SELECT id FROM documents WHERE company_id = public.company_id()))
    WITH CHECK (document_id IN (SELECT id FROM documents WHERE company_id = public.company_id()));

-- ════════════════════════════════════════════════════════════
-- Audit Log: company-scoped, read-only (append via triggers)
-- ════════════════════════════════════════════════════════════
CREATE POLICY audit_log_select ON audit_log
    FOR SELECT
    USING (company_id = public.company_id()
           AND public.user_role() IN ('super_admin', 'company_admin'));

-- No INSERT/UPDATE/DELETE policies — audit_log is populated via triggers

-- ════════════════════════════════════════════════════════════
-- Notifications: user-scoped (own notifications only)
-- ════════════════════════════════════════════════════════════
CREATE POLICY notifications_select ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notifications_update ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());
