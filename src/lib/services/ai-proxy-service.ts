/**
 * AI Proxy Service — BFF layer between Next.js and Python AI service.
 *
 * Proxies AI requests from the frontend to the Python FastAPI service
 * on Railway. Never exposes the Python service URL or API key to the browser.
 *
 * Implements degradation handling:
 *   - AI service down → returns degradation response
 *   - Cost cap exceeded → blocks request
 *   - Rate limited → queues or rejects
 */
import { NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY ?? "";

export interface AIProxyResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  degraded?: boolean;
  meta?: {
    model: string;
    tokens_used: number;
    cost_usd: number;
    latency_ms: number;
  };
}

/**
 * Makes a proxied call to the Python AI service.
 */
async function callAIService<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<AIProxyResponse<T>> {
  if (!AI_SERVICE_API_KEY) {
    return {
      success: false,
      error: "AI service not configured",
      degraded: true,
    };
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": AI_SERVICE_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000), // 60s timeout
    });

    if (!response.ok) {
      if (response.status === 503) {
        return {
          success: false,
          error: "AI service temporarily unavailable",
          degraded: true,
        };
      }

      const errorBody = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorBody.detail ?? `AI service returned ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data as T,
      meta: data.meta,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        success: false,
        error: "AI service request timed out (60s)",
        degraded: true,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown AI service error",
      degraded: true,
    };
  }
}

/**
 * Evaluate incident — proxies to Python /ai/evaluate-incident
 */
export async function evaluateIncident(
  body: Record<string, unknown>,
): Promise<AIProxyResponse> {
  return callAIService("/ai/evaluate-incident", body);
}

/**
 * Generate document — proxies to Python /ai/generate-document
 */
export async function generateDocument(
  body: Record<string, unknown>,
): Promise<AIProxyResponse> {
  return callAIService("/ai/generate-document", body);
}

/**
 * Generate agenda — proxies to Python /ai/generate-agenda
 */
export async function generateAgenda(
  body: Record<string, unknown>,
): Promise<AIProxyResponse> {
  return callAIService("/ai/generate-agenda", body);
}

/**
 * Summarize meeting — proxies to Python /ai/summarize-meeting
 */
export async function summarizeMeeting(
  body: Record<string, unknown>,
): Promise<AIProxyResponse> {
  return callAIService("/ai/summarize-meeting", body);
}

/**
 * Check if AI service is available (health check)
 */
export async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
