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
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
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
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
