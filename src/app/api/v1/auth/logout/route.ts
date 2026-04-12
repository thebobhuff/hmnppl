/**
 * Logout API route — POST /api/v1/auth/logout
 *
 * Signs the user out of Supabase Auth and clears all session cookies
 * (Supabase auth tokens + custom session-tracking cookies).
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Cookie names — kept in sync with middleware.ts
// ---------------------------------------------------------------------------

const COOKIE_SESSION_START = "hr_session_start";
const COOKIE_LAST_ACTIVITY = "hr_last_activity";
const COOKIE_USER_ROLE = "hr_user_role";
const COOKIE_ONBOARDING_STATUS = "hr_onboarding_completed";

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // We need the callback but signOut doesn't set new cookies —
          // it only needs to read existing ones.
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              path: "/",
            });
          });
        },
      },
    },
  );

  // Sign out from Supabase Auth (invalidates the session server-side)
  await supabase.auth.signOut();

  // Build the response
  const response = NextResponse.json({ success: true });

  // Clear all custom session cookies
  response.cookies.delete(COOKIE_SESSION_START);
  response.cookies.delete(COOKIE_LAST_ACTIVITY);
  response.cookies.delete(COOKIE_USER_ROLE);
  response.cookies.delete(COOKIE_ONBOARDING_STATUS);

  // Clear any Supabase auth cookies that might remain
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
