/**
 * Disciplinary Action service — CRUD + HR review flow.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface DisciplinaryActionResponse {
  id: string;
  incident_id: string;
  company_id: string;
  employee_id: string;
  action_type: string;
  document_id: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  follow_up_actions: Record<string, unknown>[];
  rejection_reason: string | null;
  rejection_next_step: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  decision: "approve" | "approve_with_edits" | "reject";
  edited_content?: string;
  rejection_reason?: string;
  rejection_next_step?: "regenerate" | "escalate_legal" | "close";
  before_diff?: string;
  after_diff?: string;
}

export async function createDisciplinaryAction(
  companyId: string,
  incidentId: string,
  employeeId: string,
  actionType: string,
  documentId: string | null = null,
): Promise<DisciplinaryActionResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("disciplinary_actions")
    .insert({
      company_id: companyId,
      incident_id: incidentId,
      employee_id: employeeId,
      action_type: actionType,
      document_id: documentId,
      status: "pending_approval",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create disciplinary action: ${error.message}`);
  }

  return mapToResponse(data);
}

export async function getDisciplinaryAction(
  companyId: string,
  actionId: string,
): Promise<DisciplinaryActionResponse | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("disciplinary_actions")
    .select("*")
    .eq("id", actionId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get disciplinary action: ${error.message}`);
  }

  return mapToResponse(data);
}

export async function listDisciplinaryActions(
  companyId: string,
  status?: string,
  cursor?: string,
  limit = 20,
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("disciplinary_actions")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (status) {
    query = query.eq("status", status);
  }
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list disciplinary actions: ${error.message}`);
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  return {
    actions: items.map(mapToResponse),
    total: count ?? 0,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].created_at : undefined,
  };
}

export async function reviewDisciplinaryAction(
  companyId: string,
  userId: string,
  actionId: string,
  review: ReviewInput,
): Promise<DisciplinaryActionResponse> {
  const supabase = createAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from("disciplinary_actions")
    .select("*")
    .eq("id", actionId)
    .eq("company_id", companyId)
    .single();

  if (fetchError || !current) {
    throw new Error("Disciplinary action not found");
  }

  if (review.decision === "approve") {
    const { data, error } = await supabase
      .from("disciplinary_actions")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", actionId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve action: ${error.message}`);
    }
    return mapToResponse(data);
  }

  if (review.decision === "approve_with_edits") {
    // Update document content if edited
    if (review.edited_content && current.document_id) {
      await supabase
        .from("documents")
        .update({
          content: review.edited_content,
          version: current.version + 1,
        })
        .eq("id", current.document_id)
        .eq("company_id", companyId);
    }

    const { data, error } = await supabase
      .from("disciplinary_actions")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", actionId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve with edits: ${error.message}`);
    }
    return mapToResponse(data);
  }

  if (review.decision === "reject") {
    if (!review.rejection_reason || review.rejection_reason.length < 20) {
      throw new Error("Rejection reason must be at least 20 characters");
    }
    if (!review.rejection_next_step) {
      throw new Error("Rejection next step is required");
    }

    const { data, error } = await supabase
      .from("disciplinary_actions")
      .update({
        status: "rejected",
        rejection_reason: review.rejection_reason,
        rejection_next_step: review.rejection_next_step,
      })
      .eq("id", actionId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reject action: ${error.message}`);
    }
    return mapToResponse(data);
  }

  throw new Error("Invalid review decision");
}

function mapToResponse(data: Record<string, unknown>): DisciplinaryActionResponse {
  return {
    id: data.id as string,
    incident_id: data.incident_id as string,
    company_id: data.company_id as string,
    employee_id: data.employee_id as string,
    action_type: data.action_type as string,
    document_id: (data.document_id as string) ?? null,
    status: data.status as string,
    approved_by: (data.approved_by as string) ?? null,
    approved_at: (data.approved_at as string) ?? null,
    follow_up_actions: (data.follow_up_actions as Record<string, unknown>[]) ?? [],
    rejection_reason: (data.rejection_reason as string) ?? null,
    rejection_next_step: (data.rejection_next_step as string) ?? null,
    resolved_at: (data.resolved_at as string) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
