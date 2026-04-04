/**
 * Meeting service — CRUD for disciplinary meetings.
 */
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function createMeeting(
  companyId: string,
  disciplinaryActionId: string,
  meetingType: string,
  participants: Array<{ user_id: string; role: string }>,
  agenda?: string,
  scheduledAt?: string,
  durationMinutes?: number,
  meetingLink?: string,
): Promise<MeetingResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      company_id: companyId,
      disciplinary_action_id: disciplinaryActionId,
      type: meetingType,
      agenda: agenda ?? null,
      scheduled_at: scheduledAt ?? null,
      duration_minutes: durationMinutes ?? null,
      meeting_link: meetingLink ?? null,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meeting: ${error.message}`);
  }

  // Create participant records
  if (participants.length > 0) {
    const participantRecords = participants.map((p) => ({
      meeting_id: data.id,
      user_id: p.user_id,
      role: p.role,
    }));

    const { error: participantError } = await supabase
      .from("meeting_participants")
      .insert(participantRecords);

    if (participantError) {
      console.error(
        "[meeting:create] Failed to create participants:",
        participantError.message,
      );
    }
  }

  return mapToResponse(data);
}

export async function getMeeting(
  companyId: string,
  meetingId: string,
): Promise<MeetingResponse | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get meeting: ${error.message}`);
  }

  // Fetch participants
  const { data: participants } = await supabase
    .from("meeting_participants")
    .select("user_id, role, attendance_status")
    .eq("meeting_id", meetingId);

  return mapToResponse(data, participants ?? []);
}

export async function listMeetings(
  companyId: string,
  status?: string,
  cursor?: string,
  limit = 20,
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("meetings")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("scheduled_at", { ascending: true })
    .limit(limit + 1);

  if (status) {
    query = query.eq("status", status);
  }
  if (cursor) {
    query = query.gt("scheduled_at", cursor);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list meetings: ${error.message}`);
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  return {
    meetings: items.map((item) => mapToResponse(item)),
    total: count ?? 0,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].scheduled_at : undefined,
  };
}

export async function updateMeeting(
  companyId: string,
  meetingId: string,
  updates: {
    notes?: string;
    ai_summary?: Record<string, unknown>;
    action_items?: Record<string, unknown>[];
    outcome?: string;
    status?: string;
  },
): Promise<MeetingResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("meetings")
    .update(updates)
    .eq("id", meetingId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update meeting: ${error.message}`);
  }

  return mapToResponse(data);
}

function mapToResponse(
  data: Record<string, unknown>,
  participants?: Array<{ user_id: string; role: string; attendance_status: string }>,
): MeetingResponse {
  return {
    id: data.id as string,
    disciplinary_action_id: data.disciplinary_action_id as string,
    company_id: data.company_id as string,
    type: data.type as string,
    agenda: (data.agenda as string) ?? null,
    scheduled_at: (data.scheduled_at as string) ?? null,
    duration_minutes: (data.duration_minutes as number) ?? null,
    meeting_link: (data.meeting_link as string) ?? null,
    notes: (data.notes as string) ?? null,
    ai_summary: (data.ai_summary as Record<string, unknown>) ?? null,
    action_items: (data.action_items as Record<string, unknown>[]) ?? [],
    outcome: (data.outcome as string) ?? null,
    status: data.status as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    participants,
  };
}
