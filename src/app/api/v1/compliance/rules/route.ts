/** Compliance Rules API - Proxies to Python backend
 * GET /api/v1/compliance/rules?state=CA&city=SF
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "US";
  const state = searchParams.get("state") || "";
  const county = searchParams.get("county") || "";
  const city = searchParams.get("city") || "";

  const params = new URLSearchParams({ country });
  if (state) params.set("state", state);
  if (county) params.set("county", county);
  if (city) params.set("city", city);

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/compliance/rules?${params}`);
    if (!res.ok) throw new Error(`Backend: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Compliance service unavailable", details: String(error) },
      { status: 503 },
    );
  }
}
