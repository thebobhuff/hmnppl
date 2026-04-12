/**
 * OAuth callback route handler.
 *
 * Handles the redirect from OAuth providers (Google, Microsoft).
 * Exchanges the authorization code for a session, then:
 *   - For new users: creates a company workspace + user profile
 *   - For returning users: updates last_login_at
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cookie names — kept in sync with middleware.ts */
const COOKIE_SESSION_START = "hr_session_start";
const COOKIE_USER_ROLE = "hr_user_role";
const COOKIE_ONBOARDING_STATUS = "hr_onboarding_completed";

/**
 * Sets a session-tracking cookie with strict security attributes.
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
 * Extracts a display name from user metadata for first_name / last_name.
 */
function extractName(userMeta: Record<string, unknown> | undefined): {
  firstName: string;
  lastName: string;
} {
  const fullName = (userMeta?.full_name as string) || (userMeta?.name as string) || "";

  if (fullName.includes(" ")) {
    const parts = fullName.split(" ");
    return {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? "",
    };
  }

  return {
    firstName: fullName || "User",
    lastName: "",
  };
}

// ---------------------------------------------------------------------------
// GET handler — code exchange + profile provisioning
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` lets the client request a specific redirect target
  const next = searchParams.get("next") ?? "/";

  // --- Error code from OAuth provider ---
  const errorParam = searchParams.get("error");
  if (errorParam) {
    const errorDescription =
      searchParams.get("error_description") ?? "OAuth authentication failed";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Missing authorization code")}`,
    );
  }

  // --- Prepare response for the redirect ---
  const response = NextResponse.redirect(`${origin}${next}`);

  // --- Create Supabase client tied to this request/response for cookie mgmt ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          } catch {
            // NextRequest tracking fails in route handlers, but response headers will apply
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax", // Must be lax for OAuth redirects!
              path: "/",
            });
          });
        },
      },
    },
  );

  // --- Exchange code for session ---
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] Code exchange failed:", exchangeError.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  // --- Get the authenticated user ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("User not found after code exchange")}`,
    );
  }

  // --- Use admin client for profile lookups / creation (bypasses RLS) ---
  const admin = createAdminClient();

  // Check if user already has a profile in the users table
  const { data: existingProfile } = await admin
    .from("users")
    .select("id, role, company:companies!company_id(onboarding_completed)")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    // Returning user — update last_login_at
    await admin
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    // Set session cookies with the existing role
    setSessionCookie(response, COOKIE_SESSION_START, Date.now().toString(), 60 * 60 * 8);
    setSessionCookie(response, COOKIE_USER_ROLE, existingProfile.role, 60 * 60 * 8);

    const isCompanyOnboarded =
      existingProfile.company && !Array.isArray(existingProfile.company)
        ? (existingProfile.company as unknown as { onboarding_completed: boolean })
            .onboarding_completed
        : false;
    setSessionCookie(
      response,
      COOKIE_ONBOARDING_STATUS,
      isCompanyOnboarded ? "1" : "0",
      60 * 60 * 8,
    );

    return response;
  }

  // --- New user — create company workspace + profile ---
  try {
    const { firstName, lastName } = extractName(
      user.user_metadata as Record<string, unknown> | undefined,
    );
    const userEmail = user.email ?? "";

    // 1. Create company
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({
        name: `${firstName}'s Company`,
        size: "1-10",
        onboarding_completed: false,
      })
      .select("id")
      .single();

    if (companyError || !company) {
      console.error("[auth/callback] Company creation failed:", companyError?.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Failed to create company workspace")}`,
      );
    }

    // 2. Create user profile with company_admin role
    const { error: profileError } = await admin.from("users").insert({
      id: user.id,
      company_id: company.id,
      role: "company_admin",
      first_name: firstName,
      last_name: lastName,
      email: userEmail,
      status: "active",
      hire_date: new Date().toISOString().split("T")[0],
      last_login_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("[auth/callback] Profile creation failed:", profileError.message);
      // Attempt cleanup: delete the company we just created
      await admin.from("companies").delete().eq("id", company.id);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Failed to create user profile")}`,
      );
    }

    // 3. Set session cookies
    setSessionCookie(response, COOKIE_SESSION_START, Date.now().toString(), 60 * 60 * 8);
    setSessionCookie(response, COOKIE_USER_ROLE, "company_admin", 60 * 60 * 8);
    setSessionCookie(response, COOKIE_ONBOARDING_STATUS, "0", 60 * 60 * 8); // Because we just created it
  } catch (err) {
    console.error("[auth/callback] Unexpected error:", err);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("An unexpected error occurred")}`,
    );
  }

  return response;
}
