/**
 * Audio Summary API — POST /api/v1/meetings/audio-summary
 *
 * Handles audio recording upload, transcription, and AI summarization
 * for disciplinary meetings. Requires consent confirmation.
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = withAuth(
  { roles: ["hr_agent", "manager"] as const },
  async (request: Request) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const meetingId = formData.get("meeting_id") as string | null;
    const audioFile = formData.get("audio") as File | null;
    const consentConfirmed = formData.get("consent_confirmed") === "true";

    if (!consentConfirmed) {
      return NextResponse.json(
        { error: "Consent must be confirmed before recording" },
        { status: 400 },
      );
    }

    if (!meetingId) {
      return NextResponse.json(
        { error: "meeting_id is required" },
        { status: 400 },
      );
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
    const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY ?? "";

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    try {
      const supabase = createAdminClient();

      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .select("*, disciplinary_actions(employee_id, company_id)")
        .eq("id", meetingId)
        .single();

      if (meetingError || !meeting) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }

      const da = meeting.disciplinary_actions as any;
      if (da?.company_id !== user.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

      if (!AI_SERVICE_API_KEY || AI_SERVICE_URL === "http://localhost:8000") {
        const mockSummary = `[AI Summary — Simulated for demo]\n\nThis disciplinary meeting covered performance concerns and conduct issues.\n\nKey Discussion Points:\n- Attendance and punctuality expectations\n- Communication with management\n- Path to improvement and follow-up timeline\n\nAction Items:\n1. Employee to maintain weekly check-ins with manager\n2. 30-day performance improvement plan established\n3. HR to schedule follow-up meeting\n\nRecommended Follow-up: 30 days`;
        return NextResponse.json({
          success: true,
          summary: mockSummary,
          meeting_id: meetingId,
          degraded: true,
        });
      }

      const aiRes = await fetch(`${AI_SERVICE_URL}/v1/transcribe-and-summarize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${AI_SERVICE_API_KEY}`,
          "Content-Type": audioFile.type,
        },
        body: audioBuffer,
        signal: AbortSignal.timeout(60000),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text().catch(() => "Unknown error");
        console.error("[audio-summary] AI service error:", errText);
        return NextResponse.json(
          { error: "Transcription service unavailable" },
          { status: 503 },
        );
      }

      const result = await aiRes.json() as { summary?: string; transcript?: string };

      return NextResponse.json({
        success: true,
        summary: result.summary ?? "Summary not available",
        transcript: result.transcript ?? null,
        meeting_id: meetingId,
      });
    } catch (err) {
      console.error("[audio-summary] Failed:", err);
      if (err instanceof Error && err.name === "TimeoutError") {
        return NextResponse.json(
          { error: "Transcription timed out. Please try again." },
          { status: 504 },
        );
      }
      return NextResponse.json(
        { error: "Failed to process audio" },
        { status: 500 },
      );
    }
  },
);