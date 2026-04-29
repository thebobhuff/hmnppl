/**
 * Policy service — CRUD operations for disciplinary policies.
 *
 * All operations are tenant-scoped: company_id is derived from the
 * authenticated user's session, never from client input.
 */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PolicyCreateInput,
  PolicyUpdateInput,
  PolicyResponse,
  PolicyRule,
} from "@/lib/validations/policy";
import { detectRuleConflicts } from "./policy-conflict-detector";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PolicyListFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
}

export interface PaginatedPolicies {
  policies: PolicyResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ---------------------------------------------------------------------------
// GET — List policies for the authenticated user's company
// ---------------------------------------------------------------------------

export async function listPolicies(
  companyId: string,
  filters: PolicyListFilters = {},
  cursor?: string,
  limit = 20,
): Promise<PaginatedPolicies> {
  const supabase = createAdminClient();

  let query = supabase
    .from("policies")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list policies: ${error.message}`);
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? items[items.length - 1].created_at : undefined;

  return {
    policies: items.map(mapToResponse),
    total: count ?? 0,
    hasMore,
    nextCursor,
  };
}

// ---------------------------------------------------------------------------
// GET — Get single policy by ID
// ---------------------------------------------------------------------------

export async function getPolicy(
  companyId: string,
  policyId: string,
): Promise<PolicyResponse | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to get policy: ${error.message}`);
  }

  return mapToResponse(data);
}

// ---------------------------------------------------------------------------
// POST — Create new policy
// ---------------------------------------------------------------------------

export async function createPolicy(
  companyId: string,
  userId: string,
  input: PolicyCreateInput,
): Promise<PolicyResponse> {
  const supabase = createAdminClient();

  const policyData = {
    company_id: companyId,
    category: input.category,
    title: input.title,
    summary: input.summary ?? null,
    content: input.content,
    rules: input.rules,
    severity_levels: input.severity_levels ?? null,
    is_active: false, // New policies start as draft
    version: 1,
    effective_date: input.effective_date ?? null,
    expiry_date: input.expiry_date ?? null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("policies")
    .insert(policyData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create policy: ${error.message}`);
  }

  return mapToResponse(data);
}

// ---------------------------------------------------------------------------
// PUT — Update policy (creates version snapshot before updating)
// ---------------------------------------------------------------------------

export async function updatePolicy(
  companyId: string,
  userId: string,
  policyId: string,
  input: PolicyUpdateInput,
): Promise<PolicyResponse> {
  const supabase = createAdminClient();

  // 1. Get current policy to snapshot
  const { data: current, error: fetchError } = await supabase
    .from("policies")
    .select("*")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Policy not found");
    }
    throw new Error(`Failed to fetch policy: ${fetchError.message}`);
  }

  // 2. Create version snapshot
  const newVersion = current.version + 1;
  const { error: versionError } = await supabase.from("policy_versions").insert({
    policy_id: policyId,
    version: current.version,
    content: current.content,
    rules: current.rules,
    severity_levels: current.severity_levels,
    created_by: userId,
  });

  if (versionError) {
    throw new Error(`Failed to create policy version: ${versionError.message}`);
  }

  // 3. Update policy
  const { data, error: updateError } = await supabase
    .from("policies")
    .update({
      category: input.category,
      title: input.title,
      summary: input.summary ?? null,
      content: input.content,
      rules: input.rules,
      severity_levels: input.severity_levels ?? null,
      effective_date: input.effective_date ?? null,
      expiry_date: input.expiry_date ?? null,
      version: newVersion,
    })
    .eq("id", policyId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update policy: ${updateError.message}`);
  }

  return mapToResponse(data);
}

// ---------------------------------------------------------------------------
// PATCH — Toggle policy active/inactive (with conflict check)
// ---------------------------------------------------------------------------

export async function togglePolicy(
  companyId: string,
  policyId: string,
  userId: string,
): Promise<{
  policy: PolicyResponse;
  conflicts: Array<{ type: string; description: string }>;
}> {
  const supabase = createAdminClient();

  // 1. Get current policy
  const { data: current, error: fetchError } = await supabase
    .from("policies")
    .select("*")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Policy not found");
    }
    throw new Error(`Failed to fetch policy: ${fetchError.message}`);
  }

  // 2. If activating, check for conflicts
  const conflicts: Array<{ type: string; description: string }> = [];
  if (!current.is_active) {
    // Check internal rule conflicts
    const ruleConflicts = detectRuleConflicts(current.rules as PolicyRule[]);
    const errorConflicts = ruleConflicts.filter((c) => c.severity === "error");

    if (errorConflicts.length > 0) {
      return {
        policy: mapToResponse(current),
        conflicts: errorConflicts.map((c) => ({
          type: c.conflict_type,
          description: c.description,
        })),
      };
    }

    // Check cross-policy conflicts with other active policies
    const { data: activePolicies, error: activeError } = await supabase
      .from("policies")
      .select("id, title, rules")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .neq("id", policyId);

    if (activeError) {
      throw new Error(`Failed to check active policies: ${activeError.message}`);
    }

    if (activePolicies && activePolicies.length > 0) {
      const { detectCrossPolicyConflicts } = await import("./policy-conflict-detector");
      const crossConflicts = detectCrossPolicyConflicts(
        current.rules as PolicyRule[],
        activePolicies.map((p) => ({
          id: p.id,
          title: p.title,
          rules: p.rules as PolicyRule[],
        })),
      );

      // Cross-policy conflicts are warnings, not blockers
      if (crossConflicts.length > 0) {
        conflicts.push(
          ...crossConflicts.map((c) => ({
            type: c.conflict_type,
            description: c.description,
          })),
        );
      }
    }
  }

  // 3. Toggle the policy
  const newActiveState = !current.is_active;
  const { data, error: updateError } = await supabase
    .from("policies")
    .update({ is_active: newActiveState })
    .eq("id", policyId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to toggle policy: ${updateError.message}`);
  }

  return {
    policy: mapToResponse(data),
    conflicts,
  };
}

// ---------------------------------------------------------------------------
// DELETE — Soft-delete policy (set is_active = false)
// ---------------------------------------------------------------------------

export async function deletePolicy(companyId: string, policyId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("policies")
    .update({ is_active: false })
    .eq("id", policyId)
    .eq("company_id", companyId);

  if (error) {
    throw new Error(`Failed to delete policy: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Seed baseline policies for a new company
// ---------------------------------------------------------------------------

export interface BaselinePolicyInput {
  template_id: string;
  title: string;
  category: string;
  content: string;
  summary: string;
  rules: PolicyRule[];
  severity_levels: Record<string, unknown>;
}

const BASELINE_POLICIES: BaselinePolicyInput[] = [
  {
    template_id: "attendance-punctuality",
    title: "Attendance & Punctuality Policy",
    category: "attendance",
    summary: "Defines expectations for attendance, tardiness handling, and progressive discipline for attendance violations.",
    content: `This policy establishes guidelines for employee attendance and addresses tardiness, unexcused absences, and patterns of attendance violations.\n\n**Expectations:**\n- Employees are expected to arrive on time and be prepared to begin work at their scheduled start time.\n- Repeated tardiness disrupts workflow and impacts team productivity.\n\n**Procedure:**\n1. First occurrence: Verbal warning documented in employee file.\n2. Second occurrence: Written warning with improvement plan.\n3. Third occurrence: Final written warning with 30-day performance improvement plan.\n4. Continued violations: Escalation to HR for further disciplinary action, up to and including termination.\n\n**Exceptions:**\n- Employees with documented medical conditions or emergencies may be exempt per applicable laws.\n- Employees should notify their manager as early as possible if they anticipate being late.`,
    rules: [
      {
        id: crypto.randomUUID(),
        name: "First Tardiness Occurrence",
        triggerType: "tardiness",
        severity: "low",
        actionType: "verbal_warning",
        escalationLevel: 1,
        description: "First tardiness incident within 90 days — verbal warning documented.",
        conditions: { max_per_year: 1, window_days: 90 },
      },
      {
        id: crypto.randomUUID(),
        name: "Repeated Tardiness",
        triggerType: "tardiness",
        severity: "medium",
        actionType: "written_warning",
        escalationLevel: 2,
        description: "Second tardiness incident within 90 days — written warning issued.",
        conditions: { max_per_year: 2, window_days: 90 },
      },
      {
        id: crypto.randomUUID(),
        name: "Pattern of Tardiness",
        triggerType: "tardiness",
        severity: "high",
        actionType: "pip",
        escalationLevel: 3,
        description: "Third or more tardiness incident within 90 days — PIP initiated.",
        conditions: { max_per_year: 3, window_days: 90 },
      },
      {
        id: crypto.randomUUID(),
        name: "Unexcused Absence",
        triggerType: "absence",
        severity: "medium",
        actionType: "written_warning",
        escalationLevel: 2,
        description: "Unexcused full-day absence without prior notice — written warning.",
        conditions: { max_per_year: 2, window_days: 180 },
      },
      {
        id: crypto.randomUUID(),
        name: "No-Call/No-Show",
        triggerType: "no_call_no_show",
        severity: "high",
        actionType: "written_warning",
        escalationLevel: 3,
        description: "Failure to report absence without notification — immediate written warning with mandatory meeting.",
        conditions: { max_per_year: 1, window_days: 365 },
      },
    ],
    severity_levels: {
      low: { description: "Minor迟到 (< 10 min)", actions: ["verbal_warning"] },
      medium: { description: "Repeated tardiness or unexcused absence", actions: ["written_warning"] },
      high: { description: "Pattern of violations or no-call/no-show", actions: ["pip", "termination_review"] },
    },
  },
  {
    template_id: "workplace-conduct",
    title: "Workplace Conduct Policy",
    category: "conduct",
    summary: "Establishes standards for professional behavior, addressing insubordination, harassment, and inappropriate workplace conduct.",
    content: `This policy defines acceptable workplace behavior and outlines the disciplinary process for conduct violations.\n\n**Scope:**\n- All employees, contractors, and visitors.\n- Applies to work premises, company events, and official communications.\n\n**Prohibited Conduct:**\n- Harassment, bullying, or intimidation of any kind.\n- Insubordination or refusal to follow lawful management directives.\n- Discriminatory language or actions.\n- Disclosure of confidential information.\n- Workplace violence or threats.\n\n**Process:**\n1. Investigation: HR will investigate all complaints within 5 business days.\n2. Findings: If conduct is substantiated, appropriate disciplinary action will be taken based on severity.\n3. Appeals: Employees may appeal disciplinary decisions within 10 business days.`,
    rules: [
      {
        id: crypto.randomUUID(),
        name: "Insubordination - First Occurrence",
        triggerType: "insubordination",
        severity: "medium",
        actionType: "written_warning",
        escalationLevel: 2,
        description: "First refusal to follow a direct supervisor instruction — written warning.",
        conditions: { max_per_year: 1, window_days: 180 },
      },
      {
        id: crypto.randomUUID(),
        name: "Repeated Insubordination",
        triggerType: "insubordination",
        severity: "high",
        actionType: "pip",
        escalationLevel: 3,
        description: "Second insubordination incident within 180 days — PIP initiated.",
        conditions: { max_per_year: 2, window_days: 180 },
      },
      {
        id: crypto.randomUUID(),
        name: "Verbal Harassment",
        triggerType: "harassment",
        severity: "high",
        actionType: "written_warning",
        escalationLevel: 3,
        description: "First substantiated verbal harassment incident — immediate written warning, mandatory training.",
        conditions: { max_per_year: 1, window_days: 365 },
      },
      {
        id: crypto.randomUUID(),
        name: "Policy Violation - Minor",
        triggerType: "policy_violation",
        severity: "low",
        actionType: "verbal_warning",
        escalationLevel: 1,
        description: "Minor first-time policy violation (dress code, break policy, etc.) — verbal warning.",
        conditions: { max_per_year: 2, window_days: 90 },
      },
    ],
    severity_levels: {
      low: { description: "Minor policy breach", actions: ["verbal_warning"] },
      medium: { description: "Insubordination or minor harassment", actions: ["written_warning"] },
      high: { description: "Severe harassment, threats, or repeated violations", actions: ["pip", "termination_review"] },
    },
  },
  {
    template_id: "performance-management",
    title: "Performance Management Policy",
    category: "performance",
    summary: "Covers performance expectations, PIP procedures, and progressive discipline for missed deliverables and quality standards.",
    content: `This policy establishes the framework for managing employee performance issues through progressive discipline.\n\n**Performance Standards:**\n- Employees are expected to meet defined productivity and quality benchmarks.\n- Managers must provide clear expectations and regular feedback.\n- Performance issues should be documented at each stage.\n\n**Progressive Discipline:**\n1. Verbal Warning: Documented conversation regarding performance gap.\n2. Written Warning: Formal notice with specific improvement targets and timeline.\n3. PIP: 30-60 day structured improvement plan with weekly checkpoints.\n4. Final Warning / Termination: If PIP objectives are not met.\n\n**Support:**\n- Training and coaching should be offered where applicable.\n- Employees may be reassigned to roles better suited to their skills if available.`,
    rules: [
      {
        id: crypto.randomUUID(),
        name: "Missed Deadline - First",
        triggerType: "missed_deadline",
        severity: "low",
        actionType: "verbal_warning",
        escalationLevel: 1,
        description: "First missed deadline without prior escalation — verbal warning.",
        conditions: { max_per_year: 2, window_days: 90 },
      },
      {
        id: crypto.randomUUID(),
        name: "Repeated Missed Deadlines",
        triggerType: "missed_deadline",
        severity: "medium",
        actionType: "written_warning",
        escalationLevel: 2,
        description: "Second missed deadline within 90 days — written warning with performance improvement targets.",
        conditions: { max_per_year: 3, window_days: 90 },
      },
      {
        id: crypto.randomUUID(),
        name: "Quality Standard Failure",
        triggerType: "quality_violation",
        severity: "medium",
        actionType: "written_warning",
        escalationLevel: 2,
        description: "Deliverable rejected for quality concerns — written warning with coaching plan.",
        conditions: { max_per_year: 2, window_days: 180 },
      },
      {
        id: crypto.randomUUID(),
        name: "PIP Failure",
        triggerType: "pip_failure",
        severity: "high",
        actionType: "termination_review",
        escalationLevel: 4,
        description: "Failure to meet PIP objectives after 30-60 day period — HR review for termination.",
        conditions: { max_per_year: 1, window_days: 365 },
      },
    ],
    severity_levels: {
      low: { description: "Minor miss or quality issue", actions: ["verbal_warning"] },
      medium: { description: "Repeated misses or quality failures", actions: ["written_warning"] },
      high: { description: "PIP failure or gross performance issues", actions: ["pip", "termination_review"] },
    },
  },
];

export async function seedBaselinePolicies(
  companyId: string,
  userId: string,
  templateIds: string[] = ["attendance-punctuality", "workplace-conduct", "performance-management"],
): Promise<PolicyResponse[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const effectiveDate = now.split("T")[0];

  const policiesToCreate = BASELINE_POLICIES.filter(
    (p) => templateIds.includes(p.template_id),
  );

  if (policiesToCreate.length === 0) {
    return [];
  }

  const records = policiesToCreate.map((p) => ({
    company_id: companyId,
    category: p.category,
    title: p.title,
    summary: p.summary,
    content: p.content,
    rules: p.rules,
    severity_levels: p.severity_levels,
    is_active: true,
    version: 1,
    effective_date: effectiveDate,
    created_by: userId,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("policies")
    .insert(records)
    .select();

  if (error) {
    throw new Error(`Failed to seed baseline policies: ${error.message}`);
  }

  return data.map(mapToResponse);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapToResponse(data: Record<string, unknown>): PolicyResponse {
  return {
    id: data.id as string,
    company_id: data.company_id as string,
    category: data.category as string,
    title: data.title as string,
    summary: (data.summary as string) ?? null,
    content: data.content as string,
    rules: (data.rules as PolicyRule[]) ?? [],
    severity_levels: (data.severity_levels as Record<string, unknown>) ?? null,
    is_active: data.is_active as boolean,
    version: data.version as number,
    effective_date: (data.effective_date as string) ?? null,
    expiry_date: (data.expiry_date as string) ?? null,
    created_by: (data.created_by as string) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
