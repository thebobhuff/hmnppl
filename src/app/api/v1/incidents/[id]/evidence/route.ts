/**
 * Evidence Upload API — POST /api/v1/incidents/[id]/evidence
 *
 * Generates a signed URL for direct upload to Supabase Storage.
 * The client uploads directly to storage using the signed URL,
 * then PATCH the incident with the attachment metadata.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getIncident } from "@/lib/services/incident-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = withAuth({ roles: roleGuards.manager }, async (request, context) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const incidentId = params.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const { fileName, contentType, fileSize } = body as Record<string, string | number>;

  if (!fileName || !contentType || !fileSize) {
    return NextResponse.json(
      { error: "fileName, contentType, and fileSize are required" },
      { status: 400 },
    );
  }

  if (typeof fileSize === "number" && fileSize > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 413 });
  }

  // Verify incident exists and user has access
  try {
    const incident = await getIncident(user.companyId, incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Only the reporter or HR agents can upload evidence
    if (
      incident.reported_by !== user.id &&
      user.role !== "hr_agent" &&
      user.role !== "company_admin"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to upload evidence" },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to verify incident access" },
      { status: 500 },
    );
  }

  // Generate signed URL for direct upload
  const supabase = createAdminClient();
  const filePath = `${user.companyId}/${incidentId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("evidence")
    .createSignedUploadUrl(filePath);

  if (error) {
    console.error("[evidence:upload] Failed to create signed URL:", error.message);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    filePath,
    path: data.path,
  });
});
