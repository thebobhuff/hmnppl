/**
 * Departments API — list and create departments for current company.
 */

import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { createDepartment, listDepartments } from "@/lib/services/department-service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(255),
  head_id: z.string().uuid().nullable().optional(),
});

export const GET = withAuth({ roles: roleGuards.manager }, async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const departments = await listDepartments(user.companyId);
    return NextResponse.json({ departments });
  } catch (error) {
    console.error("[departments:list] Failed:", error);
    return NextResponse.json({ error: "Failed to list departments" }, { status: 500 });
  }
});

export const POST = withAuth({ roles: roleGuards.companyAdminOnly }, async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const department = await createDepartment(
      user.companyId,
      parsed.data.name,
      parsed.data.head_id ?? null,
    );
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error("[departments:create] Failed:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
});
