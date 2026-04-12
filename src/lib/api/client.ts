/**
 * API Client — typed fetch wrapper for all Next.js API routes.
 *
 * Centralizes error handling, auth headers, and response parsing.
 * All frontend data fetching goes through this client.
 */

const API_BASE =
  typeof window !== "undefined"
    ? "/api/v1"
    : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/v1`;

class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: Record<string, unknown>[],
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
    options.method?.toUpperCase() ?? "GET",
  );

  let response: Response;
  if (isMutation && typeof window !== "undefined") {
    // Dynamically import csrfFetch to avoid server-side errors if any
    const { csrfFetch } = await import("@/lib/csrf-client");
    response = await csrfFetch(url, options);
  } else {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  }

  if (!response.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await response.json();
    } catch {
      // Ignore
    }
    throw new APIError(
      response.status,
      (body.error as string) ?? `Request failed with status ${response.status}`,
      body.details as Record<string, unknown>[] | undefined,
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

export const policiesAPI = {
  list: (params?: {
    category?: string;
    is_active?: boolean;
    search?: string;
    cursor?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.is_active !== undefined) qs.set("is_active", String(params.is_active));
    if (params?.search) qs.set("search", params.search);
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PolicyListResponse>(`/policies?${qs.toString()}`);
  },
  get: (id: string) => request<{ policy: PolicyResponse }>(`/policies/${id}`),
  create: (body: Record<string, unknown>) =>
    request<{ policy: PolicyResponse }>(`/policies`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Record<string, unknown>) =>
    request<{ policy: PolicyResponse }>(`/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  toggle: (id: string) =>
    request<{
      policy: PolicyResponse;
      warnings?: Array<{ type: string; description: string }>;
    }>(`/policies/${id}/toggle`, { method: "PATCH" }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/policies/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export const incidentsAPI = {
  list: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : "";
    return request<IncidentListResponse>(`/incidents?${qs}`);
  },
  get: (id: string) => request<{ incident: IncidentDetail }>(`/incidents/${id}`),
  create: (body: Record<string, unknown>) =>
    request<{
      incident: {
        id: string;
        status: string;
        reference_number: string;
        created_at: string;
      };
    }>(`/incidents`, { method: "POST", body: JSON.stringify(body) }),
  updateStatus: (id: string, body: { status: string; reason?: string }) =>
    request<{ incident: IncidentResponse }>(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getDirectReports: () =>
    request<{
      directReports: Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        job_title: string | null;
      }>;
    }>(`/users/me/direct-reports`),
};

// ---------------------------------------------------------------------------
// Disciplinary Actions
// ---------------------------------------------------------------------------

export const disciplinaryAPI = {
  list: (status?: string, cursor?: string, limit = 20) => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (cursor) qs.set("cursor", cursor);
    qs.set("limit", String(limit));
    return request<DisciplinaryListResponse>(`/disciplinary-actions?${qs.toString()}`);
  },
  get: (id: string) =>
    request<{ action: DisciplinaryActionResponse }>(`/disciplinary-actions/${id}`),
  review: (id: string, body: Record<string, unknown>) =>
    request<{ action: DisciplinaryActionResponse }>(
      `/disciplinary-actions/${id}/review`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  regenerate: (id: string, feedback: string) =>
    request<{ regenerated_document: Record<string, unknown> }>(
      `/disciplinary-actions/${id}/regenerate`,
      { method: "POST", body: JSON.stringify({ feedback }) },
    ),
};

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

export const meetingsAPI = {
  list: (status?: string, cursor?: string, limit = 20) => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (cursor) qs.set("cursor", cursor);
    qs.set("limit", String(limit));
    return request<MeetingListResponse>(`/meetings?${qs.toString()}`);
  },
  get: (id: string) => request<{ meeting: MeetingResponse }>(`/meetings/${id}`),
  create: (body: Record<string, unknown>) =>
    request<{ meeting: MeetingResponse }>(`/meetings`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Record<string, unknown>) =>
    request<{ meeting: MeetingResponse }>(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const usersAPI = {
  list: (params?: {
    role?: string;
    department_id?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.role) qs.set("role", params.role);
    if (params?.department_id) qs.set("department_id", params.department_id);
    if (params?.status) qs.set("status", params.status);
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<UserListResponse>(`/users?${qs.toString()}`);
  },
  me: () =>
    request<{
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import("@/types").UserRole;
        avatarUrl?: string;
        tenantId?: string;
        tenantName?: string;
        phone?: string | null;
        jobTitle?: string | null;
        status?: string;
        hireDate?: string | null;
        lastLoginAt?: string | null;
      };
    }>(`/users/me`),
  updateMe: (body: {
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
    avatarUrl?: string;
  }) =>
    request<{
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import("@/types").UserRole;
        avatarUrl?: string;
        tenantId?: string;
        tenantName?: string;
        phone?: string | null;
        jobTitle?: string | null;
        status?: string;
        hireDate?: string | null;
        lastLoginAt?: string | null;
      };
    }>(`/users/me`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  get: (id: string) => request<{ user: UserResponse }>(`/users/${id}`),
  invite: (body: {
    email: string;
    role: string;
    department_id?: string;
    manager_id?: string;
  }) =>
    request<{ user: UserResponse }>(`/users`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Record<string, string | null>) =>
    request<{ user: UserResponse }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  timeline: (id: string) =>
    request<{ timeline: TimelineEvent[] }>(`/users/${id}/timeline`),
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settingsAPI = {
  get: () =>
    request<{
      company: {
        name: string;
        industry: string;
        size: string;
        country: string;
      };
      notifications: Record<string, boolean>;
      security: {
        microsoftSso: boolean;
        googleSso: boolean;
        emailPassword: boolean;
      };
      ai: {
        confidenceThreshold: number;
        autoGenerateDocuments: boolean;
        allowDisputes: boolean;
        aiMeetingSummaries: boolean;
        monthlyBudgetUsd: number;
      };
    }>(`/settings`),
  update: (body: {
    company?: {
      name: string;
      industry: string;
      size: string;
      country: string;
    };
    notifications?: Record<string, boolean>;
    security?: {
      microsoftSso: boolean;
      googleSso: boolean;
      emailPassword: boolean;
    };
    ai?: {
      confidenceThreshold: number;
      autoGenerateDocuments: boolean;
      allowDisputes: boolean;
      aiMeetingSummaries: boolean;
      monthlyBudgetUsd: number;
    };
  }) =>
    request<{
      company: {
        name: string;
        industry: string;
        size: string;
        country: string;
      };
      notifications: Record<string, boolean>;
      security: {
        microsoftSso: boolean;
        googleSso: boolean;
        emailPassword: boolean;
      };
      ai: {
        confidenceThreshold: number;
        autoGenerateDocuments: boolean;
        allowDisputes: boolean;
        aiMeetingSummaries: boolean;
        monthlyBudgetUsd: number;
      };
    }>(`/settings`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ---------------------------------------------------------------------------
// AI Proxy
// ---------------------------------------------------------------------------

export const aiAPI = {
  evaluateIncident: (body: Record<string, unknown>) =>
    request<AIProxyResponse>(`/ai/evaluate-incident`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  generateDocument: (body: Record<string, unknown>) =>
    request<AIProxyResponse>(`/ai/generate-document`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  generateAgenda: (body: Record<string, unknown>) =>
    request<AIProxyResponse>(`/ai/generate-agenda`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  summarizeMeeting: (body: Record<string, unknown>) =>
    request<AIProxyResponse>(`/ai/summarize-meeting`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  checkHealth: () =>
    request<{ status: string }>(`/health`)
      .then(() => true)
      .catch(() => false),
};

export const feedbackAPI = {
  submit: (body: {
    kind: "bug" | "feature";
    title: string;
    details: string;
    pageUrl?: string;
    submittedAt?: string;
  }) =>
    request<{ issue: { number: number; url: string } }>(`/feedback`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PolicyListResponse {
  policies: PolicyResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PolicyResponse {
  id: string;
  company_id: string;
  category: string;
  title: string;
  summary: string | null;
  content: string;
  rules: Record<string, unknown>[];
  severity_levels: Record<string, unknown> | null;
  is_active: boolean;
  version: number;
  effective_date: string | null;
  expiry_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentListResponse {
  incidents: IncidentResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface IncidentResponse {
  id: string;
  company_id: string;
  employee_id: string;
  reported_by: string;
  reference_number: string;
  type: string;
  description: string;
  incident_date: string;
  severity: string;
  evidence_attachments: Record<string, unknown>[] | null;
  union_involved: boolean;
  status: string;
  ai_confidence_score: number | null;
  ai_evaluation_status: string | null;
  ai_recommendation: Record<string, unknown> | null;
  linked_policy_id: string | null;
  policy_snapshot: Record<string, unknown> | null;
  policy_version: number | null;
  previous_incident_count: number;
  escalation_level: number | null;
  created_at: string;
  updated_at: string;
  witnesses: string[];
}

export interface IncidentDetail extends IncidentResponse {
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string | null;
  };
  reporter?: { id: string; first_name: string; last_name: string; email: string };
  disciplinary_action?: { id: string; action_type: string; status: string } | null;
}

export interface DisciplinaryListResponse {
  actions: DisciplinaryActionResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

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

export interface MeetingListResponse {
  meetings: MeetingResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface MeetingResponse {
  id: string;
  disciplinary_action_id: string;
  company_id: string;
  type: string;
  agenda: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_link: string | null;
  notes: string | null;
  ai_summary: Record<string, unknown> | null;
  action_items: Record<string, unknown>[];
  outcome: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  participants?: Array<{ user_id: string; role: string; attendance_status: string }>;
}

export interface UserListResponse {
  users: UserResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface UserResponse {
  id: string;
  company_id: string;
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

export interface AIProxyResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  degraded?: boolean;
  meta?: {
    model: string;
    tokens_used: number;
    cost_usd: number;
    latency_ms: number;
  };
}

export { APIError };
