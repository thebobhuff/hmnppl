-- ============================================================
-- Migration: 00018_audit_triggers.sql
-- Description: Generic audit trigger function + apply to key
--              tables. Also create updated_at auto-update trigger.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. Generic audit trigger function
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    audit_action VARCHAR(50);
    entity_id_val UUID;
    current_user_id UUID;
    current_company_id UUID;
BEGIN
    current_user_id := auth.uid();

    IF (TG_OP = 'INSERT') THEN
        audit_action := 'insert';
        entity_id_val := NEW.id;
        -- Get company_id from NEW record
        BEGIN
            current_company_id := NEW.company_id;
        EXCEPTION WHEN undefined_column THEN
            current_company_id := NULL;
        END;

        INSERT INTO audit_log (company_id, user_id, action, entity_type, entity_id, details)
        VALUES (
            current_company_id,
            current_user_id,
            audit_action,
            TG_TABLE_NAME,
            entity_id_val,
            jsonb_build_object('new', to_jsonb(NEW))
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        audit_action := 'update';
        entity_id_val := NEW.id;
        BEGIN
            current_company_id := NEW.company_id;
        EXCEPTION WHEN undefined_column THEN
            current_company_id := NULL;
        END;

        INSERT INTO audit_log (company_id, user_id, action, entity_type, entity_id, details)
        VALUES (
            current_company_id,
            current_user_id,
            audit_action,
            TG_TABLE_NAME,
            entity_id_val,
            jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW),
                'changed_fields', (
                    SELECT jsonb_object_agg(key, NEW->key)
                    FROM jsonb_each(NEW) AS x(key, value)
                    WHERE NEW->key IS DISTINCT FROM OLD->key
                )
            )
        );
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        audit_action := 'delete';
        entity_id_val := OLD.id;
        BEGIN
            current_company_id := OLD.company_id;
        EXCEPTION WHEN undefined_column THEN
            current_company_id := NULL;
        END;

        INSERT INTO audit_log (company_id, user_id, action, entity_type, entity_id, details)
        VALUES (
            current_company_id,
            current_user_id,
            audit_action,
            TG_TABLE_NAME,
            entity_id_val,
            jsonb_build_object('old', to_jsonb(OLD))
        );
        RETURN OLD;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════
-- 2. Apply audit triggers to key tables
-- ════════════════════════════════════════════════════════════
CREATE TRIGGER trg_audit_incidents
    AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_disciplinary_actions
    AFTER INSERT OR UPDATE OR DELETE ON disciplinary_actions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_documents
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_signatures
    AFTER INSERT OR UPDATE OR DELETE ON signatures
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_policies
    AFTER INSERT OR UPDATE OR DELETE ON policies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ════════════════════════════════════════════════════════════
-- 3. Auto-update updated_at trigger
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with that column
CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_disciplinary_actions_updated_at
    BEFORE UPDATE ON disciplinary_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON FUNCTION audit_trigger_func() IS 'Generic audit trigger. Records INSERT/UPDATE/DELETE with changed fields diff.';
COMMENT ON FUNCTION update_updated_at() IS 'Auto-sets updated_at = NOW() on every UPDATE.';
