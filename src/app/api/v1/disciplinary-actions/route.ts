/**
 * Disciplinary Actions API — GET list, POST create
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createDisciplinaryAction,
  listDisciplinaryActions,
} from "@/lib/services/disciplinary-action-service";
import { createDocument } from "@/lib/services/document-service";

export const GET = withAuth({ roles: roleGuards.hrAgent }, async (request) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  try {
    const result = await listDisciplinaryActions(
      user.companyId,
      status,
      cursor,
      Math.min(limit, 100),
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[disciplinary-actions:list] Failed:", error);
    return NextResponse.json(
      { error: "Failed to list disciplinary actions" },
      { status: 500 },
    );
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

  const { incident_id, employee_id, action_type, document_content } = body as Record<
    string,
    string
  >;

  if (!incident_id || !employee_id || !action_type) {
    return NextResponse.json(
      { error: "incident_id, employee_id, and action_type are required" },
      { status: 400 },
    );
  }

  try {
    let documentId: string | null = null;

    if (document_content) {
      const doc = await createDocument(
        user.companyId,
        user.id,
        action_type,
        `${action_type} - ${employee_id}`,
        document_content,
      );
      documentId = doc.id;
    }

    const action = await createDisciplinaryAction(
      user.companyId,
      incident_id,
      employee_id,
      action_type,
      documentId,
    );
    return NextResponse.json({ action }, { status: 201 });
  } catch (error) {
    console.error("[disciplinary-actions:create] Failed:", error);
    return NextResponse.json(
      { error: "Failed to create disciplinary action" },
      { status: 500 },
    );
  }
});
