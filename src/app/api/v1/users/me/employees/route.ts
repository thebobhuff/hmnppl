/**
 * My Employees API — GET /api/v1/users/me/employees
 *
 * Returns active employees that belong to the authenticated user's scope:
 * - employees in the user's assigned department
 * - employees in departments the user heads
 * - direct reports assigned to the user
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { listMyEmployees } from "@/lib/services/user-service";

export const GET = withAuth(
  { roles: roleGuards.manager },
  async (_request, _context, { user }) => {
    try {
      const employees = await listMyEmployees(user.companyId, user.id, user.departmentId);
      return NextResponse.json({ employees });
    } catch (error) {
      console.error("[users:my-employees] Failed:", error);
      return NextResponse.json(
        { error: "Failed to fetch your employees" },
        { status: 500 },
      );
    }
  },
);
