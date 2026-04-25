/**
 * Employee document signature API.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/require-role";
import { signEmployeeDocument } from "@/lib/services/document-service";

const signSchema = z.object({
  signatureType: z.enum(["drawn", "typed"]),
  signatureData: z.string().min(1),
});

export const POST = withAuth(async (request, context, { user }) => {
  const params = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const result = await signEmployeeDocument(
      user.companyId,
      user.id,
      user.role,
      params.id,
      {
        ...parsed.data,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: request.headers.get("user-agent"),
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign document";
    const status = message.includes("not found") ? 404 : 500;
    console.error("[documents:sign] Failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
});
