/**
 * User service — user management and employee timeline.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export interface UserResponse {
  id: string;
  company_id: string;
  company_name?: string | null;
  department_id: string | null;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
  manager_id: string | null;
  status: string;
  hire_date: string | null;
  termination_date: string | null;
  last_login_at: string | null;
}

export interface TimelineEvent {
  id: string;
  type: "incident" | "document" | "meeting" | "signature";
  date: string;
  title: string;
  description: string;
  status: string;
  entity_id: string;
}

export async function listUsers(
  companyId: string,
  filters?: { role?: string; department_id?: string; status?: string },
  cursor?: string,
  limit = 20,
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("last_name", { ascending: true })
    .limit(limit + 1);

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }
  if (filters?.department_id) {
    query = query.eq("department_id", filters.department_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (cursor) {
    query = query.gt("last_name", cursor);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  return {
    users: items.map(mapToResponse),
    total: count ?? 0,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].last_name : undefined,
  };
}

export async function getUser(
  companyId: string,
  userId: string,
): Promise<UserResponse | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("*, companies(name)")
    .eq("id", userId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return mapToResponse(data);
}

export async function getUserTimeline(
  companyId: string,
  userId: string,
): Promise<TimelineEvent[]> {
  const supabase = createAdminClient();
  const events: TimelineEvent[] = [];

  // Fetch incidents
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, type, description, incident_date, status, reference_number")
    .eq("company_id", companyId)
    .eq("employee_id", userId)
    .order("incident_date", { ascending: false });

  if (incidents) {
    for (const inc of incidents) {
      events.push({
        id: inc.id,
        type: "incident",
        date: inc.incident_date,
        title: `Incident: ${inc.type}`,
        description: inc.description.substring(0, 200),
        status: inc.status,
        entity_id: inc.id,
      });
    }
  }

  // Fetch disciplinary actions
  const { data: actions } = await supabase
    .from("disciplinary_actions")
    .select("id, action_type, status, created_at")
    .eq("company_id", companyId)
    .eq("employee_id", userId)
    .order("created_at", { ascending: false });

  if (actions) {
    for (const action of actions) {
      events.push({
        id: action.id,
        type: "document",
        date: action.created_at,
        title: `Disciplinary Action: ${action.action_type}`,
        description: `Status: ${action.status}`,
        status: action.status,
        entity_id: action.id,
      });
    }
  }

  // Fetch meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, type, status, scheduled_at, outcome, created_at")
    .eq("company_id", companyId)
    .order("scheduled_at", { ascending: false });

  if (meetings) {
    for (const meeting of meetings) {
      events.push({
        id: meeting.id,
        type: "meeting",
        date: meeting.scheduled_at ?? meeting.created_at,
        title: `Meeting: ${meeting.type}`,
        description: meeting.outcome ?? `Status: ${meeting.status}`,
        status: meeting.status,
        entity_id: meeting.id,
      });
    }
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events;
}

export async function inviteUser(
  companyId: string,
  email: string,
  role: string,
  departmentId?: string | null,
  managerId?: string | null,
): Promise<UserResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      company_id: companyId,
      email,
      role,
      department_id: departmentId ?? null,
      manager_id: managerId ?? null,
      first_name: "",
      last_name: "",
      status: "invited",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to invite user: ${error.message}`);
  }

  return mapToResponse(data);
}

export async function updateUser(
  companyId: string,
  userId: string,
  updates: Partial<{
    role: string;
    department_id: string | null;
    manager_id: string | null;
    job_title: string | null;
    phone: string | null;
    status: string;
  }>,
): Promise<UserResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return mapToResponse(data);
}

export async function updateOwnUser(
  companyId: string,
  userId: string,
  updates: Partial<{
    first_name: string;
    last_name: string;
    job_title: string | null;
    phone: string | null;
    avatar_url: string | null;
  }>,
): Promise<UserResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .eq("company_id", companyId)
    .select("*, companies(name)")
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return mapToResponse(data);
}

function mapToResponse(data: Record<string, unknown>): UserResponse {
  const companies = data.companies as
    | { name?: string | null }
    | { name?: string | null }[]
    | null;
  const companyName = Array.isArray(companies)
    ? (companies[0]?.name ?? null)
    : (companies?.name ?? null);

  return {
    id: data.id as string,
    company_id: data.company_id as string,
    company_name: companyName,
    department_id: (data.department_id as string) ?? null,
    role: data.role as string,
    first_name: (data.first_name as string) ?? "",
    last_name: (data.last_name as string) ?? "",
    email: data.email as string,
    phone: (data.phone as string) ?? null,
    job_title: (data.job_title as string) ?? null,
    avatar_url: (data.avatar_url as string) ?? null,
    manager_id: (data.manager_id as string) ?? null,
    status: data.status as string,
    hire_date: (data.hire_date as string) ?? null,
    termination_date: (data.termination_date as string) ?? null,
    last_login_at: (data.last_login_at as string) ?? null,
  };
}
