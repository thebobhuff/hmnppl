-- ============================================================
-- Migration: 00020_seed_data.sql
-- Description: Insert AI policy templates as inactive templates.
--              These serve as starting points for companies to
--              activate and customize.
-- ============================================================

-- Use a sentinel company_id for template policies.
-- Companies will copy these into their own namespace.
-- We use a well-known UUID to identify templates.
INSERT INTO companies (id, name, industry, size, country, subscription_tier, onboarding_completed)
VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'System Templates',
    'system',
    'n/a',
    'US',
    'free',
    true
) ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- Template 1: Attendance Policy
-- ════════════════════════════════════════════════════════════
INSERT INTO policies (company_id, category, title, summary, content, rules, severity_levels, is_active, version) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'attendance',
    'Attendance & Punctuality Policy',
    'Establishes expectations for employee attendance, punctuality, and procedures for reporting absences or tardiness.',
    E'# Attendance & Punctuality Policy\n\n## Purpose\nThis policy establishes the company''s expectations regarding employee attendance and punctuality to ensure operational efficiency and fairness.\n\n## Scope\nThis policy applies to all employees regardless of position or department.\n\n## Expectations\n- Employees are expected to report to work on time for all scheduled shifts.\n- Employees must notify their direct supervisor at least 1 hour before the start of their shift if they will be absent or late.\n- Unauthorized absences or chronic tardiness may result in disciplinary action.\n\n## Definitions\n- **Tardiness**: Arriving more than 10 minutes after the scheduled start time.\n- **Absence**: Failing to report to work for an entire scheduled shift without prior approval.\n- **No-Call/No-Show**: Failing to notify a supervisor of an absence.\n\n## Progressive Discipline\n1. First occurrence: Verbal warning (documented)\n2. Second occurrence within 90 days: Written warning\n3. Third occurrence within 90 days: Performance Improvement Plan (PIP)\n4. Fourth occurrence or pattern of abuse: Termination review\n\n## Documentation\nAll attendance incidents must be documented in the HR system within 24 hours of occurrence.',
    '[
        {"id": "ATT-01", "description": "Tardy by more than 10 minutes without notification", "threshold_count": 1, "severity": "low"},
        {"id": "ATT-02", "description": "Tardy by more than 30 minutes without notification", "threshold_count": 1, "severity": "medium"},
        {"id": "ATT-03", "description": "Unexcused absence (no-call/no-show)", "threshold_count": 1, "severity": "high"},
        {"id": "ATT-04", "description": "Pattern of tardiness (3+ in 30 days)", "threshold_count": 3, "period_days": 30, "severity": "high"},
        {"id": "ATT-05", "description": "Pattern of unexcused absences (2+ in 30 days)", "threshold_count": 2, "period_days": 30, "severity": "critical"}
    ]'::jsonb,
    '{
        "tardiness": {"first": "low", "repeat_30d": "medium", "repeat_90d": "high"},
        "absence": {"first": "medium", "repeat_30d": "high", "repeat_90d": "critical"},
        "no_call_no_show": {"first": "high", "repeat": "critical"}
    }'::jsonb,
    false,
    1
);

-- ════════════════════════════════════════════════════════════
-- Template 2: Performance Policy
-- ════════════════════════════════════════════════════════════
INSERT INTO policies (company_id, category, title, summary, content, rules, severity_levels, is_active, version) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'performance',
    'Performance Management Policy',
    'Defines standards for employee performance, evaluation processes, and corrective actions for underperformance.',
    E'# Performance Management Policy\n\n## Purpose\nThis policy outlines the company''s approach to managing employee performance, including goal-setting, evaluations, and corrective actions.\n\n## Scope\nApplies to all employees after completion of their probationary period.\n\n## Performance Standards\n- Employees are expected to meet the objectives and KPIs established in their performance plans.\n- Regular 1:1 meetings between managers and direct reports are expected at least bi-weekly.\n- Formal performance reviews are conducted quarterly.\n\n## Performance Improvement Plans (PIP)\nWhen an employee''s performance falls below expectations:\n1. Manager documents specific performance gaps.\n2. HR reviews and approves a PIP with measurable objectives.\n3. PIP duration: 30–90 days depending on severity.\n4. Progress check-ins: weekly during PIP.\n5. Outcome: successful completion, extension, or escalation to termination review.\n\n## Documentation\n- All performance discussions must be documented.\n- PIP documents must be signed by the employee, manager, and HR.\n- Performance ratings are confidential and stored in the HR system.',
    '[
        {"id": "PERF-01", "description": "Failure to meet 2+ KPI targets in a quarter", "threshold_count": 1, "severity": "medium"},
        {"id": "PERF-02", "description": "Repeated failure to complete assigned tasks on time", "threshold_count": 3, "period_days": 30, "severity": "medium"},
        {"id": "PERF-03", "description": "PIP objectives not met within defined period", "threshold_count": 1, "severity": "high"},
        {"id": "PERF-04", "description": "Refusal to participate in performance improvement process", "threshold_count": 1, "severity": "critical"},
        {"id": "PERF-05", "description": "Consistently negative peer/customer feedback (3+ incidents)", "threshold_count": 3, "period_days": 90, "severity": "high"}
    ]'::jsonb,
    '{
        "missed_kpi": {"first": "medium", "repeat": "high"},
        "incomplete_tasks": {"pattern": "medium", "escalated": "high"},
        "pip_failure": {"first": "high", "repeat": "critical"},
        "negative_feedback": {"pattern": "high", "escalated": "critical"}
    }'::jsonb,
    false,
    1
);

-- ════════════════════════════════════════════════════════════
-- Template 3: Misconduct Policy
-- ════════════════════════════════════════════════════════════
INSERT INTO policies (company_id, category, title, summary, content, rules, severity_levels, is_active, version) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'misconduct',
    'Workplace Conduct & Misconduct Policy',
    'Establishes behavioral expectations, defines misconduct categories, and outlines investigation and disciplinary procedures.',
    E'# Workplace Conduct & Misconduct Policy\n\n## Purpose\nThis policy defines acceptable workplace behavior and outlines procedures for investigating and addressing misconduct.\n\n## Scope\nApplies to all employees, contractors, and temporary workers.\n\n## Standards of Conduct\nEmployees are expected to:\n- Treat all colleagues, customers, and visitors with respect and dignity.\n- Follow all company policies, safety procedures, and legal requirements.\n- Maintain professional conduct during all work-related activities.\n- Report violations through appropriate channels.\n\n## Categories of Misconduct\n\n### General Misconduct (Medium Severity)\n- Insubordination or refusal to follow reasonable instructions\n- Unauthorized use of company property\n- Disruptive behavior in the workplace\n- Violation of dress code or appearance standards\n\n### Serious Misconduct (High Severity)\n- Harassment or discrimination\n- Falsification of records or documents\n- Unauthorized disclosure of confidential information\n- Safety violations that endanger others\n\n### Gross Misconduct (Critical Severity)\n- Theft or embezzlement\n- Violence or threats of violence\n- Possession of weapons on company premises\n- Substance abuse on company premises\n- Fraud or illegal activities\n\n## Investigation Process\n1. Report received and documented.\n2. Preliminary assessment within 24 hours.\n3. Formal investigation launched if warranted.\n4. Employee notified and given opportunity to respond.\n5. Investigation report and recommendation.\n6. HR review and disciplinary decision.\n\n## Progressive Discipline\n- General misconduct: Verbal → Written → PIP → Termination review\n- Serious misconduct: Written → PIP → Termination review\n- Gross misconduct: Immediate suspension pending investigation; may result in immediate termination.',
    '[
        {"id": "MIS-01", "description": "Insubordination (refusal to follow reasonable instructions)", "threshold_count": 1, "severity": "medium"},
        {"id": "MIS-02", "description": "Disruptive behavior in the workplace", "threshold_count": 1, "severity": "medium"},
        {"id": "MIS-03", "description": "Harassment or discrimination (first reported incident)", "threshold_count": 1, "severity": "high"},
        {"id": "MIS-04", "description": "Falsification of company records", "threshold_count": 1, "severity": "high"},
        {"id": "MIS-05", "description": "Theft or embezzlement of company property", "threshold_count": 1, "severity": "critical"},
        {"id": "MIS-06", "description": "Violence or credible threats of violence", "threshold_count": 1, "severity": "critical"},
        {"id": "MIS-07", "description": "Unauthorized disclosure of confidential information", "threshold_count": 1, "severity": "high"},
        {"id": "MIS-08", "description": "Violation of safety procedures endangering others", "threshold_count": 1, "severity": "high"},
        {"id": "MIS-09", "description": "Substance abuse on company premises", "threshold_count": 1, "severity": "critical"}
    ]'::jsonb,
    '{
        "insubordination": {"first": "medium", "repeat": "high", "pattern": "critical"},
        "disruptive_behavior": {"first": "medium", "repeat": "high"},
        "harassment": {"first": "high", "repeat": "critical"},
        "falsification": {"first": "high", "repeat": "critical"},
        "theft": {"first": "critical"},
        "violence": {"first": "critical"},
        "confidentiality_breach": {"first": "high", "repeat": "critical"},
        "safety_violation": {"first": "high", "repeat": "critical"},
        "substance_abuse": {"first": "critical"}
    }'::jsonb,
    false,
    1
);
