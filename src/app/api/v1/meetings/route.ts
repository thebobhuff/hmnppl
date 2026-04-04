/**
 * Meetings API — GET list, POST create
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { createMeeting, listMeetings } from "@/lib/services/meeting-service";
import { generateAgenda } from "@/lib/services/ai-proxy-service";

export const GET = withAuth({ roles: roleGuards.hrAgent }, async (request) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  try {
    const result = await listMeetings(
      user.companyId,
      status,
      cursor,
      Math.min(limit, 100),
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[meetings:list] Failed:", error);
    return NextResponse.json({ error: "Failed to list meetings" }, { status: 500 });
  }
});

export const POST = withAuth({ roles: roleGuards.hrAgentOnly }, async (request) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    disciplinary_action_id,
    type,
    participants,
    scheduled_at,
    duration_minutes,
    meeting_link,
    generate_ai_agenda,
  } = body as Record<
    string,
    string | number | boolean | Array<{ user_id: string; role: string }>
  >;

  if (!disciplinary_action_id || !type || !participants) {
    return NextResponse.json(
      { error: "disciplinary_action_id, type, and participants are required" },
      { status: 400 },
    );
  }

  try {
    let agenda: string | undefined;

    if (generate_ai_agenda) {
      const agendaResult = await generateAgenda({
        meeting_type: type as string,
        participants: (participants as Array<{ user_id: string; role: string }>).map(
          (p) => p.role,
        ),
        action_type: "verbal_warning",
      });

      if (agendaResult.success && agendaResult.data) {
        const data = agendaResult.data as Record<string, unknown>;
        agenda = JSON.stringify(data.agenda_items ?? []);
      }
    }

    const meeting = await createMeeting(
      user.companyId,
      disciplinary_action_id as string,
      type as string,
      participants as Array<{ user_id: string; role: string }>,
      agenda,
      scheduled_at as string | undefined,
      duration_minutes as number | undefined,
      meeting_link as string | undefined,
    );

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error("[meetings:create] Failed:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
});
