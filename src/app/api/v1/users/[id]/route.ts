/**
 * Single User API — GET, PATCH
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getUser, updateUser } from "@/lib/services/user-service";

export const GET = withAuth({ roles: roleGuards.manager }, async (_request, context) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;
  try {
    const foundUser = await getUser(user.companyId, params.id);
    if (!foundUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: foundUser });
  } catch (error) {
    console.error("[users:get] Failed:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
});

export const PATCH = withAuth(
  { roles: roleGuards.companyAdminOnly },
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

    const { role, department_id, manager_id, job_title, phone, status } = body as Record<
      string,
      string | null
    >;

    try {
      const updates: Record<string, string | null> = {};
      if (role) updates.role = role;
      if (department_id !== undefined) updates.department_id = department_id;
      if (manager_id !== undefined) updates.manager_id = manager_id;
      if (job_title !== undefined) updates.job_title = job_title;
      if (phone !== undefined) updates.phone = phone;
      if (status) updates.status = status;

      const updatedUser = await updateUser(user.companyId, params.id, updates);
      return NextResponse.json({ user: updatedUser });
    } catch (error) {
      console.error("[users:update] Failed:", error);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
  },
);
