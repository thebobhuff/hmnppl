/**
 * Policies API — GET list, POST create
 *
 * GET /api/v1/policies — List policies for the authenticated user's company
 * POST /api/v1/policies — Create a new policy (company_admin only)
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { listPolicies, createPolicy } from "@/lib/services/policy-service";
import { policyCreateSchema } from "@/lib/validations/policy";

// ---------------------------------------------------------------------------
// GET — List policies
// ---------------------------------------------------------------------------

export const GET = withAuth({ roles: roleGuards.manager }, async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const isActive = url.searchParams.get("is_active");
  const search = url.searchParams.get("search") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  try {
    const result = await listPolicies(
      user.companyId,
      {
        category,
        is_active: isActive !== null ? isActive === "true" : undefined,
        search,
      },
      cursor,
      Math.min(limit, 100),
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[policies:list] Failed:", error);
    return NextResponse.json({ error: "Failed to list policies" }, { status: 500 });
  }
});

// ---------------------------------------------------------------------------
// POST — Create policy
// ---------------------------------------------------------------------------

export const POST = withAuth({ roles: roleGuards.companyAdminOnly }, async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = policyCreateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
  }

  try {
    const policy = await createPolicy(user.companyId, user.id, parsed.data);
    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    console.error("[policies:create] Failed:", error);
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
});
