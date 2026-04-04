/**
 * Policy Toggle API — PATCH /api/v1/policies/[id]/toggle
 *
 * Activates or deactivates a policy.
 * When activating, performs conflict detection against existing active policies.
 * Returns 409 with conflict details if blocking conflicts are found.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { togglePolicy } from "@/lib/services/policy-service";

export const PATCH = withAuth(
  { roles: roleGuards.companyAdminOnly },
  async (_request, context) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const policyId = params.id;

    try {
      const result = await togglePolicy(user.companyId, policyId, user.id);

      // If there are blocking conflicts, return 409
      if (result.conflicts.length > 0) {
        const hasBlockingConflicts = result.conflicts.some(
          (c) => c.type === "overlapping_trigger",
        );
        if (hasBlockingConflicts) {
          return NextResponse.json(
            {
              error:
                "Policy has conflicting rules that must be resolved before activation",
              conflicts: result.conflicts,
            },
            { status: 409 },
          );
        }
      }

      return NextResponse.json({
        policy: result.policy,
        warnings: result.conflicts.length > 0 ? result.conflicts : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("not found")) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 });
      }
      console.error("[policies:toggle] Failed:", error);
      return NextResponse.json({ error: "Failed to toggle policy" }, { status: 500 });
    }
  },
);
