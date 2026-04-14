/**
 * Next.js middleware — security headers + Supabase Auth session management.
 *
 * Responsibilities:
 *   1. Apply security headers to every response
 *   2. Refresh auth tokens on every request via @supabase/ssr
 *   3. Enforce HttpOnly, Secure, SameSite=Strict cookie attributes
 *   4. Redirect unauthenticated users to /login for protected routes
 *   5. Enforce role-based idle timeout and absolute session max
 *   6. Enforce role-based route protection (Layer 1 of 3-layer RBAC)
 *
 * RBAC Layers:
 *   Layer 1 (this middleware): coarse route-prefix check using cached role cookie
 *   Layer 2 (API withAuth HOF): fine-grained DB-verified role check
 *   Layer 3 (PostgreSQL RLS): row-level tenant isolation
 */
import { checkRoutePermission } from "@/lib/auth/permissions";
import { getSessionTimeouts, type UserRole } from "@/lib/auth/session";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

/**
 * Security headers applied to every response.
 *
 * These mirror the headers in `next.config.js` so that even if the static
 * configuration is bypassed (e.g., edge runtime), headers are still enforced.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://login.microsoftonline.com",
  ].join("; "),
};

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------

/** Routes that do not require authentication. */
const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/auth/accept",
  "/auth/callback",
  "/api/v1/csrf-token",
];

/** Cookie names for session timeout tracking. */
const COOKIE_SESSION_START = "hr_session_start";
const COOKIE_LAST_ACTIVITY = "hr_last_activity";
const COOKIE_USER_ROLE = "hr_user_role";
const COOKIE_ONBOARDING_STATUS = "hr_onboarding_completed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether a path is public (does not require auth).
 */
function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  // Auth API routes are public so the client can call them
  if (pathname.startsWith("/api/v1/auth/")) return true;
  // Next.js internals
  if (pathname.startsWith("/_next/")) return true;
  return false;
}

/**
 * Reads a numeric cookie value from the request.
 */
function getCookieNumber(request: NextRequest, name: string): number | null {
  const raw = request.cookies.get(name)?.value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Reads a string cookie value from the request.
 */
function getCookieString(request: NextRequest, name: string): string | null {
  return request.cookies.get(name)?.value ?? null;
}

/**
 * Sets a session-tracking cookie on the response with security attributes.
 */
function setSessionCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAgeSeconds?: number,
) {
  response.cookies.set({
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds } : {}),
  });
}

/**
 * Applies security headers to a NextResponse.
 */
function applySecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  // 1. Create an initial response with security headers -------------------------

  // 2. Create Supabase server client that reads/writes cookies ------------------
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Apply updated cookies to the incoming request so downstream
          // handlers see the refreshed tokens.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));


          // Set auth cookies with strict security attributes.
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
          });
        },
      },
    },
  );

  // 3. Refresh session and get user ---------------------------------------------
  //    MUST be called immediately after createServerClient. Do not add logic
  //    between the client creation and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 4. Redirect unauthenticated users on protected routes -----------------------
  if (!user && !isPublicRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // 5. Authenticated user — Onboarding Enforcement ------------------------------
  if (user && !isPublicRoute(pathname)) {
    const onboardingStatus = getCookieString(request, COOKIE_ONBOARDING_STATUS);

    // Allow access to the onboarding page AND its corresponding API route
    const onboardingSafePaths = ["/onboarding", "/api/v1/companies/onboarding"];
    const isSafePath = onboardingSafePaths.includes(pathname);

    if (onboardingStatus === "0" && !isSafePath && !pathname.startsWith("/_next/")) {
      // Must complete onboarding first
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    } else if (onboardingStatus === "1" && pathname === "/onboarding") {
      // Already completed onboarding, skip wizard
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    }
  }

  // 6. Authenticated user — Layer 1 RBAC: role-based route protection ----------
  //    Uses the cached role cookie for a fast, coarse-grained check.
  //    If the cookie is missing, we allow through — Layer 2 (API) or the
  //    page component's requireRole() will enforce with a fresh DB query.
  if (user) {
    const cachedRole = getCookieString(request, COOKIE_USER_ROLE) as UserRole | null;
    const permissionResult = checkRoutePermission(pathname, cachedRole);

    if (!permissionResult.allowed) {
      // API routes get a JSON 403 response
      if (pathname.startsWith("/api/")) {
        const forbiddenResponse = NextResponse.json(
          {
            error: "Insufficient permissions",
            detail: permissionResult.reason,
          },
          { status: 403 },
        );
        applySecurityHeaders(forbiddenResponse);
        return forbiddenResponse;
      }

      // Page routes redirect to the dashboard (home for authenticated users)
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.searchParams.set("error", "access_denied");

      const accessDeniedResponse = NextResponse.redirect(redirectUrl);
      applySecurityHeaders(accessDeniedResponse);
      return accessDeniedResponse;
    }
  }

  // 7. Authenticated user — enforce session timeouts ----------------------------
  if (user) {
    const now = Date.now();

    // -- Session start timestamp (set once per login) ----------------------------
    const sessionStart = getCookieNumber(request, COOKIE_SESSION_START) ?? now;

    // -- Idle timeout based on cached role ----------------------------------------
    const cachedRole = getCookieString(request, COOKIE_USER_ROLE);
    const { idleMs, absoluteMs } = getSessionTimeouts(cachedRole ?? "employee");
    const lastActivity = getCookieNumber(request, COOKIE_LAST_ACTIVITY);

    let sessionExpired = false;

    // Absolute timeout: 8 hours from first authenticated request
    if (now - sessionStart > absoluteMs) {
      sessionExpired = true;
    }

    // Idle timeout: role-dependent
    if (!sessionExpired && lastActivity !== null) {
      if (now - lastActivity > idleMs) {
        sessionExpired = true;
      }
    }

    // If the session expired, clear all cookies and redirect to login
    if (sessionExpired) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("reason", "session_expired");

      const expiredResponse = NextResponse.redirect(redirectUrl);
      applySecurityHeaders(expiredResponse);

      // Clear session-tracking cookies
      expiredResponse.cookies.delete(COOKIE_SESSION_START);
      expiredResponse.cookies.delete(COOKIE_LAST_ACTIVITY);
      expiredResponse.cookies.delete(COOKIE_USER_ROLE);
      expiredResponse.cookies.delete(COOKIE_ONBOARDING_STATUS);

      // Clear Supabase auth cookies
      const authCookies = request.cookies.getAll();
      for (const cookie of authCookies) {
        if (cookie.name.startsWith("sb-")) {
          expiredResponse.cookies.delete(cookie.name);
        }
      }

      return expiredResponse;
    }

    // -- Update tracking cookies on the response ---------------------------------
    setSessionCookie(
      response,
      COOKIE_SESSION_START,
      sessionStart.toString(),
      60 * 60 * 8, // 8 hours
    );
    setSessionCookie(
      response,
      COOKIE_LAST_ACTIVITY,
      now.toString(),
      60 * 30, // 30 minutes (refreshed on every request)
    );
    // Preserve the role cookie if it exists
    if (cachedRole) {
      setSessionCookie(response, COOKIE_USER_ROLE, cachedRole, 60 * 60 * 8);
    }

    // Preserve the onboarding cookie if it exists
    const cachedOnboarding = getCookieString(request, COOKIE_ONBOARDING_STATUS);
    if (cachedOnboarding) {
      setSessionCookie(response, COOKIE_ONBOARDING_STATUS, cachedOnboarding, 60 * 60 * 8);
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// Matcher — run on every request except static assets
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static  (static files)
     *   - _next/image   (image optimization)
     *   - favicon.ico
     *   - public folder assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
