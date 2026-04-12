/**
 * Incident service — CRUD operations and status management.
 *
 * All operations are tenant-scoped: company_id is derived from the
 * authenticated user's session, never from client input.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  IncidentCreateInput,
  IncidentListFilters,
  IncidentResponse,
  EvidenceAttachment,
} from "@/lib/validations/incident";
import {
  isValidTransition,
  getAllowedTransitions,
  type IncidentStatus,
} from "./incident-state-machine";
import { generateReferenceNumber } from "@/lib/utils/reference-number";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaginatedIncidents {
  incidents: IncidentResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface IncidentDetail extends IncidentResponse {
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string | null;
  };
  reporter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  disciplinary_action?: {
    id: string;
    action_type: string;
    status: string;
  } | null;
}

// ---------------------------------------------------------------------------
// POST — Create incident
// ---------------------------------------------------------------------------

export async function createIncident(
  companyId: string,
  reporterId: string,
  employeeId: string,
  input: IncidentCreateInput,
): Promise<{
  incident: IncidentResponse;
  referenceNumber: string;
  employeeContext: { name: string; jobTitle: string | null };
}> {
  const supabase = createAdminClient();

  // 1. Verify employee is a direct report of the reporter
  const { data: employee, error: employeeError } = await supabase
    .from("users")
    .select("id, company_id, manager_id, status, first_name, last_name, job_title")
    .eq("id", employeeId)
    .single();

  if (employeeError || !employee) {
    throw new Error("Employee not found");
  }

  if (employee.company_id !== companyId) {
    throw new Error("Employee does not belong to your company");
  }

  if (employee.manager_id !== reporterId) {
    throw new Error("NOT_DIRECT_REPORT");
  }

  if (employee.status !== "active") {
    throw new Error("Cannot report incidents for inactive employees");
  }

  // 2. Generate reference number
  const referenceNumber = await generateReferenceNumber(companyId);

  // 3. Capture policy snapshot (all active policies for this company)
  const { data: activePolicies } = await supabase
    .from("policies")
    .select("id, title, category, rules, severity_levels")
    .eq("company_id", companyId)
    .eq("is_active", true);

  const policySnapshot = activePolicies ?? [];

  // 4. Count previous incidents for this employee
  const { count: previousCount } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("employee_id", employeeId);

  // 5. Create the incident
  const { data, error } = await supabase
    .from("incidents")
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      reported_by: reporterId,
      reference_number: referenceNumber,
      type: input.type,
      description: input.description,
      incident_date: input.incident_date,
      severity: input.severity,
      evidence_attachments: input.evidence_attachments,
      union_involved: input.union_involved,
      status: "ai_evaluating",
      policy_snapshot: policySnapshot,
      previous_incident_count: previousCount ?? 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create incident: ${error.message}`);
  }

  // 6. Create witness records if provided
  if (input.witness_ids && input.witness_ids.length > 0) {
    const witnessRecords = input.witness_ids.map((witnessId) => ({
      incident_id: data.id,
      user_id: witnessId,
    }));

    const { error: witnessError } = await supabase
      .from("incident_witnesses")
      .insert(witnessRecords);

    if (witnessError) {
      console.error(
        "[incident:create] Failed to create witness records:",
        witnessError.message,
      );
      // Non-fatal: incident is still created
    }
  }

  return {
    incident: mapToResponse(data, input.witness_ids),
    referenceNumber,
    employeeContext: {
      name: `${employee.first_name} ${employee.last_name}`.trim() || "Employee",
      jobTitle: employee.job_title ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// GET — List incidents with filtering and pagination
// ---------------------------------------------------------------------------

export async function listIncidents(
  companyId: string,
  filters: IncidentListFilters = {},
  cursor?: string,
  limit = 20,
): Promise<PaginatedIncidents> {
  const supabase = createAdminClient();

  let query = supabase
    .from("incidents")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.severity) {
    query = query.eq("severity", filters.severity);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.employee_id) {
    query = query.eq("employee_id", filters.employee_id);
  }
  if (filters.date_from) {
    query = query.gte("incident_date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("incident_date", filters.date_to);
  }
  if (filters.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`,
    );
  }
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list incidents: ${error.message}`);
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  // Fetch witness IDs for each incident
  const incidentIds = items.map((i) => i.id);
  const witnesses =
    incidentIds.length > 0
      ? await supabase
          .from("incident_witnesses")
          .select("incident_id, user_id")
          .in("incident_id", incidentIds)
      : { data: [] };

  const witnessMap = new Map<string, string[]>();
  if (witnesses.data) {
    for (const w of witnesses.data) {
      const list = witnessMap.get(w.incident_id) ?? [];
      list.push(w.user_id);
      witnessMap.set(w.incident_id, list);
    }
  }

  return {
    incidents: items.map((item) => mapToResponse(item, witnessMap.get(item.id))),
    total: count ?? 0,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].created_at : undefined,
  };
}

// ---------------------------------------------------------------------------
// GET — Get single incident with details
// ---------------------------------------------------------------------------

export async function getIncident(
  companyId: string,
  incidentId: string,
): Promise<IncidentDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get incident: ${error.message}`);
  }

  // Fetch witnesses
  const { data: witnesses } = await supabase
    .from("incident_witnesses")
    .select("user_id")
    .eq("incident_id", incidentId);

  const witnessIds = witnesses?.map((w) => w.user_id) ?? [];

  // Fetch employee info
  const { data: employee } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, job_title")
    .eq("id", data.employee_id)
    .single();

  // Fetch reporter info
  const { data: reporter } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("id", data.reported_by)
    .single();

  // Fetch disciplinary action if exists
  const { data: disciplinaryAction } = await supabase
    .from("disciplinary_actions")
    .select("id, action_type, status")
    .eq("incident_id", incidentId)
    .maybeSingle();

  return {
    ...mapToResponse(data, witnessIds),
    employee: employee
      ? {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          job_title: employee.job_title,
        }
      : undefined,
    reporter: reporter
      ? {
          id: reporter.id,
          first_name: reporter.first_name,
          last_name: reporter.last_name,
          email: reporter.email,
        }
      : undefined,
    disciplinary_action: disciplinaryAction
      ? {
          id: disciplinaryAction.id,
          action_type: disciplinaryAction.action_type,
          status: disciplinaryAction.status,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// PATCH — Update incident status (state machine)
// ---------------------------------------------------------------------------

export async function updateIncidentStatus(
  companyId: string,
  incidentId: string,
  newStatus: IncidentStatus,
  reason?: string,
): Promise<IncidentResponse> {
  const supabase = createAdminClient();

  // 1. Get current incident
  const { data: current, error: fetchError } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("company_id", companyId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Incident not found");
    }
    throw new Error(`Failed to fetch incident: ${fetchError.message}`);
  }

  // 2. Validate transition
  if (!isValidTransition(current.status as IncidentStatus, newStatus)) {
    const allowed = getAllowedTransitions(current.status as IncidentStatus);
    throw new Error(
      `INVALID_TRANSITION: Cannot transition from '${current.status}' to '${newStatus}'. Allowed: ${allowed.join(", ")}`,
    );
  }

  // 3. Update status
  const { data, error: updateError } = await supabase
    .from("incidents")
    .update({ status: newStatus })
    .eq("id", incidentId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update incident status: ${updateError.message}`);
  }

  return mapToResponse(data);
}

// ---------------------------------------------------------------------------
// GET — Get direct reports for the current user
// ---------------------------------------------------------------------------

export async function getDirectReports(
  companyId: string,
  managerId: string,
): Promise<
  Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string | null;
  }>
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, job_title")
    .eq("company_id", companyId)
    .eq("manager_id", managerId)
    .eq("status", "active")
    .order("last_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to get direct reports: ${error.message}`);
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapToResponse(
  data: Record<string, unknown>,
  witnessIds?: string[],
): IncidentResponse {
  return {
    id: data.id as string,
    company_id: data.company_id as string,
    employee_id: data.employee_id as string,
    reported_by: data.reported_by as string,
    reference_number: data.reference_number as string,
    type: data.type as string,
    description: data.description as string,
    incident_date: data.incident_date as string,
    severity: data.severity as string,
    evidence_attachments: (data.evidence_attachments as EvidenceAttachment[]) ?? null,
    union_involved: data.union_involved as boolean,
    status: data.status as string,
    ai_confidence_score: data.ai_confidence_score
      ? Number(data.ai_confidence_score)
      : null,
    ai_evaluation_status: (data.ai_evaluation_status as string) ?? null,
    ai_recommendation: (data.ai_recommendation as Record<string, unknown>) ?? null,
    linked_policy_id: (data.linked_policy_id as string) ?? null,
    policy_snapshot: (data.policy_snapshot as Record<string, unknown>) ?? null,
    policy_version: (data.policy_version as number) ?? null,
    previous_incident_count: data.previous_incident_count as number,
    escalation_level: (data.escalation_level as number) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    witnesses: witnessIds ?? [],
  };
}
