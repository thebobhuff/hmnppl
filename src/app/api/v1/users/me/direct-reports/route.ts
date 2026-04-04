/**
 * Direct Reports API — GET /api/v1/users/me/direct-reports
 *
 * Returns all active employees where manager_id = current user.
 * Used by managers to populate the employee picker in the Report Issue form.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getDirectReports } from "@/lib/services/incident-service";

export const GET = withAuth({ roles: roleGuards.manager }, async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const directReports = await getDirectReports(user.companyId, user.id);
    return NextResponse.json({ directReports });
  } catch (error) {
    console.error("[users:direct-reports] Failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch direct reports" },
      { status: 500 },
    );
  }
});
