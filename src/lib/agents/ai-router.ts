"use server";

/**
 * AI Router — model-agnostic LLM routing with OpenRouter.
 *
 * Ported from Python backend. Calls OpenRouter API with retry logic.
 * All agent calls go through this single router.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "stepfun/step-3.5-flash:free";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
  model: string;
  latency_ms: number;
}

export interface AICallOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY || process.env.AI_SERVICE_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY or AI_SERVICE_API_KEY is required");
  }
  return key;
}

function estimateCost(model: string, totalTokens: number): number {
  const pricing: Record<string, number> = {
    "stepfun/step-3.5-flash:free": 0,
    "meta-llama/llama-3-8b-instruct": 0.0002,
    "meta-llama/llama-3-70b-instruct": 0.0008,
    "openai/gpt-4o": 0.0025,
    "anthropic/claude-3.5-sonnet": 0.003,
  };
  const rate = pricing[model] ?? 0.001;
  return (totalTokens / 1000) * rate;
}

export async function callAI(options: AICallOptions): Promise<AIResponse> {
  const apiKey = getApiKey();
  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.1;
  const maxTokens = options.maxTokens ?? 2000;

  const start = Date.now();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://hmnppl.ai",
          "X-Title": "HMN/PPL AI HR Platform",
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${body}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message;
      const usage = data.usage ?? {};

      if (!choice?.content) {
        throw new Error("No content in AI response");
      }

      return {
        content: choice.content,
        usage: {
          prompt_tokens: usage.prompt_tokens ?? 0,
          completion_tokens: usage.completion_tokens ?? 0,
          total_tokens: usage.total_tokens ?? 0,
        },
        cost: estimateCost(model, usage.total_tokens ?? 0),
        model,
        latency_ms: Date.now() - start,
      };
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES - 1;
      if (isLastAttempt) {
        console.error(`[ai-router] All ${MAX_RETRIES} attempts failed:`, error);
        throw error;
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`[ai-router] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("AI call failed after all retries");
}

/** Parse JSON from AI response — handles markdown code blocks and other noise. */
export function parseAIJSON<T = Record<string, unknown>>(raw: string): T {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try finding first { to last }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(raw.substring(start, end + 1));
    }
    throw new Error(`Failed to parse AI response as JSON: ${raw.substring(0, 200)}`);
  }
}
