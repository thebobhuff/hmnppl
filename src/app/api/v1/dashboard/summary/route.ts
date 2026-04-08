/**
 * Dashboard summary API — GET /api/v1/dashboard/summary
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { getDashboardSummary } from "@/lib/services/dashboard-service";

export const GET = withAuth(async (_request, _context, { user }) => {
  try {
    const summary = await getDashboardSummary(user);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[dashboard:summary] Failed:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard summary" },
      { status: 500 },
    );
  }
});
