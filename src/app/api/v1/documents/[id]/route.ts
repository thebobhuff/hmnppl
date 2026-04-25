/**
 * Employee document detail API.
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { getEmployeeDocument } from "@/lib/services/document-service";

export const GET = withAuth(async (_request, context, { user }) => {
  const params = await context.params;

  try {
    const document = await getEmployeeDocument(user.companyId, user.id, params.id);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("[documents:get] Failed:", error);
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
});
