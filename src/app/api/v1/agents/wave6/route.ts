/**
 * Wave 6 Agent API Proxy - Forwards to Python backend
 * Endpoints for L-002 (Issue Similarity), L-003 (Training Gaps),
 * L-007 (Continuous Improvement), L-009 (Manager Pushback)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyToBackend(
  path: string,
  body: unknown,
  token: string,
) {
  const response = await fetch(`${BACKEND_URL}/api/v1/agents/wave6${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Backend error: ${response.status} - ${error}`);
  }

  return response.json();
}

// POST /api/v1/agents/wave6/issue-similarity
export async function POST(request: NextRequest) {
  // This is a catch-all route; individual endpoints are handled by sub-paths
  // For now, return a stub indicating the feature is available via direct backend call
  return NextResponse.json({
    message: "Wave 6 agent endpoints available. Use direct backend calls.",
    endpoints: [
      "/api/v1/agents/wave6/issue-similarity",
      "/api/v1/agents/wave6/training-gaps",
      "/api/v1/agents/wave6/continuous-improvement",
      "/api/v1/agents/wave6/pushback",
    ],
  });
}