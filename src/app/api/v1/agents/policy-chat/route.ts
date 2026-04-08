import { NextRequest, NextResponse } from "next/server";

const PYTHON_AI_SERVICE_URL =
  process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";

interface ChatFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}

interface ChatContext {
  screen?: {
    pathname: string;
    label: string;
    policyCount: number;
  };
  policies?: Array<{ id: string; title: string; category: string; status: string }>;
  files?: ChatFile[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, message, history, context } = body as {
      conversation_id?: string;
      message: string;
      history?: Array<{ role: string; content: string }>;
      context?: ChatContext;
    };

    const response = await fetch(`${PYTHON_AI_SERVICE_URL}/agents/policy-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.AI_SERVICE_API_KEY || "",
      },
      body: JSON.stringify({
        conversation_id,
        message,
        history,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Policy chat error:", error);
    return NextResponse.json({ error: "Failed to process policy chat" }, { status: 500 });
  }
}
