/**
 * Disciplinary Action Review API — PATCH /api/v1/disciplinary-actions/[id]/review
 *
 * HR Agent reviews a disciplinary action: approve, approve with edits, or reject.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { reviewDisciplinaryAction } from "@/lib/services/disciplinary-action-service";
import { z } from "zod";

const reviewSchema = z.object({
  decision: z.enum(["approve", "approve_with_edits", "reject"]),
  edited_content: z.string().optional(),
  rejection_reason: z.string().min(20).optional(),
  rejection_next_step: z.enum(["regenerate", "escalate_legal", "close"]).optional(),
});

export const PATCH = withAuth(
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

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    try {
      const action = await reviewDisciplinaryAction(
        user.companyId,
        user.id,
        params.id,
        parsed.data,
      );
      return NextResponse.json({ action });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("not found")) {
        return NextResponse.json(
          { error: "Disciplinary action not found" },
          { status: 404 },
        );
      }
      if (message.includes("at least 20 characters") || message.includes("required")) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      console.error("[disciplinary-actions:review] Failed:", error);
      return NextResponse.json(
        { error: "Failed to review disciplinary action" },
        { status: 500 },
      );
    }
  },
);
