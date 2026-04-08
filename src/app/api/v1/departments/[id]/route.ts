/**
 * Single Department API — PATCH, DELETE
 */

import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteDepartment, updateDepartment } from "@/lib/services/department-service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(255),
  head_id: z.string().uuid().nullable().optional(),
});

const deleteSchema = z.object({
  reassign_to_department_id: z.string().uuid().nullable().optional(),
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

    const parsed = updateSchema.safeParse(body);
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
      const department = await updateDepartment(
        user.companyId,
        params.id,
        parsed.data.name,
        parsed.data.head_id ?? null,
      );
      return NextResponse.json({ department });
    } catch (error) {
      console.error("[departments:update] Failed:", error);
      return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
    }
  },
);

export const DELETE = withAuth(
  { roles: roleGuards.companyAdminOnly },
  async (request, context) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;

    let body: unknown = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = deleteSchema.safeParse(body);
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
      await deleteDepartment(
        user.companyId,
        params.id,
        parsed.data.reassign_to_department_id ?? null,
      );
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error("[departments:delete] Failed:", error);
      return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
    }
  },
);
