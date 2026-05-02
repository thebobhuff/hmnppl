export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Client-side helper to fetch CSRF token and include it in requests.
 *
 * Usage:
 * ```ts
 * import { csrfFetch } from "@/lib/csrf-client";
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

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
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
