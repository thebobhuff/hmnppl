import { NextResponse } from "next/server";
import { roleGuards, withAuth } from "@/lib/auth/require-role";

export const POST = withAuth({ roles: roleGuards.companyAdmin }, async (request, _context, { user }) => {
  try {
    const body = await request.json();
    const apiUrl = process.env.VITE_API_URL || process.env.SERVER_API_URL || "http://localhost:8000";

    const response = await fetch(`${apiUrl}/agents/handbook-decompose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.API_KEY || "dev-key",
      },
      body: JSON.stringify({
        handbook_text: body.handbook_text,
        company_id: user.companyId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new NextResponse(errorText, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Handbook proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
});
