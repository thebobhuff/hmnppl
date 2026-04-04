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
