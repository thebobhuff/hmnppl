/**
 * Employee document dispute API.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/require-role";
import { disputeEmployeeDocument } from "@/lib/services/document-service";

const disputeSchema = z.object({
  reason: z.string().min(20).max(2000),
});

export const POST = withAuth(async (request, context, { user }) => {
  const params = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = disputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const result = await disputeEmployeeDocument(
      user.companyId,
      user.id,
      user.role,
      params.id,
      {
        reason: parsed.data.reason,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: request.headers.get("user-agent"),
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to dispute document";
    const status = message.includes("not found") ? 404 : 500;
    console.error("[documents:dispute] Failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
});
