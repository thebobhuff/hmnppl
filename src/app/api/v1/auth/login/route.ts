/**
 * Login API route — POST /api/v1/auth/login
 *
 * Authenticates a user with email and password, establishes a Supabase
 * session via HttpOnly cookies, and returns the user profile.
 *
 * This route wraps `supabase.auth.signInWithPassword()` server-side so we
 * can set additional session-tracking cookies (role, session start, etc.)
 * in a single round-trip.
 */
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---------------------------------------------------------------------------
// Cookie names — kept in sync with middleware.ts
// ---------------------------------------------------------------------------

const COOKIE_SESSION_START = "hr_session_start";
const COOKIE_USER_ROLE = "hr_user_role";
const COOKIE_ONBOARDING_STATUS = "hr_onboarding_completed";

async function signInWithoutCaptcha(email: string, password: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the dev login fallback");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    user?: { id: string };
    error_description?: string;
    msg?: string;
  };

  if (!response.ok || !data.access_token || !data.refresh_token || !data.user) {
    throw new Error(data.error_description ?? data.msg ?? "Fallback login failed");
  }

  return data;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Rate limiting check
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = checkRateLimit(`login_${ip}`, 5, 5 * 60 * 1000); // 5 requests per 5 minutes

  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  // --- Parse and validate input ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  // --- Create a Supabase server client that can set cookies on the response ---
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

  // --- Attempt sign in ---
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  let authenticatedUser = authData.user;

  if (authError) {
    const isDevCaptchaFailure =
      process.env.NODE_ENV !== "production" &&
      /captcha/i.test(authError.message);

    if (!isDevCaptchaFailure) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    try {
      const fallbackSession = await signInWithoutCaptcha(email, password);
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: fallbackSession.access_token!,
        refresh_token: fallbackSession.refresh_token!,
      });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      authenticatedUser = fallbackSession.user;
    } catch (fallbackError) {
      console.error("[login] Dev fallback failed:", fallbackError);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
  }

  // --- Fetch user profile (use admin client to guarantee access) ---
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select(
      "id, company_id, role, first_name, last_name, email, status, company:companies!company_id(onboarding_completed)",
    )
    .eq("id", authenticatedUser.id)
    .single();

  if (!profile) {
    // User exists in auth but has no profile — this shouldn't happen normally
    // but could occur if the signup flow was interrupted.
    console.warn(`[login] User ${authenticatedUser.id} has no profile row. Signing out.`);
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "User profile not found. Please contact support." },
      { status: 403 },
    );
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Account is inactive. Please contact your administrator." },
      { status: 403 },
    );
  }

  // --- Update last_login_at ---
  await admin
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", profile.id);

  // --- Set session-tracking cookies ---
  cookieStore.set({
    name: COOKIE_SESSION_START,
    value: Date.now().toString(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  cookieStore.set({
    name: COOKIE_USER_ROLE,
    value: profile.role,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  const isCompanyOnboarded =
    profile.company && !Array.isArray(profile.company)
      ? (profile.company as unknown as { onboarding_completed: boolean })
          .onboarding_completed
      : false;

  cookieStore.set({
    name: COOKIE_ONBOARDING_STATUS,
    value: isCompanyOnboarded ? "1" : "0",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  // --- Return user data ---
  return NextResponse.json({
    user: {
      id: profile.id,
      companyId: profile.company_id,
      role: profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
    },
  });
}
