/**
 * Single Policy API — GET, PUT, DELETE
 *
 * GET /api/v1/policies/[id] — Get a single policy
 * PUT /api/v1/policies/[id] — Update a policy (creates version snapshot)
 * DELETE /api/v1/policies/[id] — Soft-delete a policy
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getPolicy, updatePolicy, deletePolicy } from "@/lib/services/policy-service";
import { policyUpdateSchema } from "@/lib/validations/policy";

// ---------------------------------------------------------------------------
// GET — Get single policy
// ---------------------------------------------------------------------------

export const GET = withAuth({ roles: roleGuards.manager }, async (_request, context) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const policyId = params.id;

  try {
    const policy = await getPolicy(user.companyId, policyId);
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    return NextResponse.json({ policy });
  } catch (error) {
    console.error("[policies:get] Failed:", error);
    return NextResponse.json({ error: "Failed to get policy" }, { status: 500 });
  }
});

// ---------------------------------------------------------------------------
// PUT — Update policy
// ---------------------------------------------------------------------------

export const PUT = withAuth(
  { roles: roleGuards.companyAdminOnly },
  async (request, context) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const policyId = params.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parsed = policyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    try {
      const policy = await updatePolicy(user.companyId, user.id, policyId, parsed.data);
      return NextResponse.json({ policy });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("not found")) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 });
      }
      console.error("[policies:update] Failed:", error);
      return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE — Soft-delete policy
// ---------------------------------------------------------------------------

export const DELETE = withAuth(
  { roles: roleGuards.companyAdminOnly },
  async (_request, context) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const policyId = params.id;

    try {
      await deletePolicy(user.companyId, policyId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[policies:delete] Failed:", error);
      return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
    }
  },
);
