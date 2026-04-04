/**
 * CSRF Protection — Double Submit Cookie pattern for Next.js API routes.
 *
 * Usage:
 *   1. Client fetches CSRF token via GET /api/v1/csrf-token
 *   2. Token is stored in a cookie (httpOnly: false, so JS can read it)
 *   3. Client sends token in X-CSRF-Token header on state-changing requests
 *   4. Server validates header matches cookie value
 *
 * This protects against Cross-Site Request Forgery without requiring
 * server-side session storage.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * GET /api/v1/csrf-token — Generate and return a CSRF token.
 *
 * Sets a cookie with the token and returns it in the response body.
 * The client should read the token and include it in the X-CSRF-Token
 * header on all state-changing requests (POST, PUT, PATCH, DELETE).
 */
export async function GET() {
  const token = generateToken();

  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS for the header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hour
    path: "/",
  });

  return response;
}

/**
 * Middleware function to validate CSRF token on state-changing requests.
 *
 * Use this in API route handlers:
 * ```ts
 * export async function POST(request: Request) {
 *   const csrfError = validateCsrfToken(request);
 *   if (csrfError) return csrfError;
 *   // ... handle request
 * }
 * ```
 */
export async function validateCsrfToken(request: Request): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return NextResponse.json({ error: "CSRF token missing" }, { status: 403 });
  }

  if (cookieToken !== headerToken) {
    return NextResponse.json({ error: "CSRF token invalid" }, { status: 403 });
  }

  return null;
}

/**
 * Generate a cryptographically secure random token.
 */
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Client-side helper to fetch CSRF token and include it in requests.
 *
 * Usage:
 * ```ts
 * const { csrfFetch } = await import("@/lib/csrf");
 * const response = await csrfFetch("/api/v1/incidents", {
 *   method: "POST",
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // Fetch CSRF token if not already cached
  let token: string | null = getCsrfTokenFromCookie();
  if (!token) {
    const response = await fetch("/api/v1/csrf-token");
    const data = await response.json();
    token = data.token ?? null;
  }

  if (!token) {
    throw new Error("Failed to obtain CSRF token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-CSRF-Token": token,
    ...(options.headers as Record<string, string>),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

/**
 * Read CSRF token from document.cookie (client-side only).
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
