/**
 * Users API — GET list, POST invite
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { listUsers, inviteUser } from "@/lib/services/user-service";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["hr_agent", "manager", "employee"]),
  department_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
});

export const GET = withAuth({ roles: roleGuards.manager }, async (request) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const role = url.searchParams.get("role") ?? undefined;
  const department_id = url.searchParams.get("department_id") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  try {
    const result = await listUsers(
      user.companyId,
      { role, department_id, status },
      cursor,
      Math.min(limit, 100),
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[users:list] Failed:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
});

export const POST = withAuth({ roles: roleGuards.companyAdminOnly }, async (request) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
  }

  try {
    const invitedUser = await inviteUser(
      user.companyId,
      parsed.data.email,
      parsed.data.role,
      parsed.data.department_id,
      parsed.data.manager_id,
    );
    return NextResponse.json({ user: invitedUser }, { status: 201 });
  } catch (error) {
    console.error("[users:invite] Failed:", error);
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
});
