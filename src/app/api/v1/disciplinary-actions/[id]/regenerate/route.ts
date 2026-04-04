/**
 * Disciplinary Action Regenerate API — POST /api/v1/disciplinary-actions/[id]/regenerate
 *
 * Sends HR feedback to AI for document regeneration.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getDisciplinaryAction } from "@/lib/services/disciplinary-action-service";
import { generateDocument } from "@/lib/services/ai-proxy-service";

export const POST = withAuth(
  { roles: roleGuards.hrAgentOnly },
  async (request, context) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { feedback } = body as Record<string, string>;

    try {
      const action = await getDisciplinaryAction(user.companyId, params.id);
      if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const result = await generateDocument({
        action_type: action.action_type,
        feedback,
        incident_id: action.incident_id,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, degraded: result.degraded },
          { status: result.degraded ? 503 : 500 },
        );
      }

      return NextResponse.json({ regenerated_document: result.data });
    } catch (error) {
      console.error("[disciplinary-actions:regenerate] Failed:", error);
      return NextResponse.json(
        { error: "Failed to regenerate document" },
        { status: 500 },
      );
    }
  },
);
