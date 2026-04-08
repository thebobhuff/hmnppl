/**
 * My Documents API — GET /api/v1/users/me/documents
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { listEmployeeDocuments } from "@/lib/services/employee-document-service";

export const GET = withAuth(async (_request, _context, { user }) => {
  try {
    const documents = await listEmployeeDocuments(user.companyId, user.id);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[users:my-documents] Failed:", error);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
});
