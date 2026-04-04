/**
 * Disciplinary Action Detail API — GET, PATCH
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getDisciplinaryAction } from "@/lib/services/disciplinary-action-service";

export const GET = withAuth({ roles: roleGuards.hrAgent }, async (_request, context) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;
  try {
    const action = await getDisciplinaryAction(user.companyId, params.id);
    if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ action });
  } catch (error) {
    console.error("[disciplinary-actions:get] Failed:", error);
    return NextResponse.json(
      { error: "Failed to get disciplinary action" },
      { status: 500 },
    );
  }
});
