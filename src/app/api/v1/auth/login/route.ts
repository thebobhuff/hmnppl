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
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
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

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
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

  // We build the response first so the `setAll` callback can write to it.
  const response = NextResponse.json({});

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

  if (authError) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // --- Fetch user profile (use admin client to guarantee access) ---
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("id, company_id, role, first_name, last_name, email, status")
    .eq("id", authData.user.id)
    .single();

  if (!profile) {
    // User exists in auth but has no profile — this shouldn't happen normally
    // but could occur if the signup flow was interrupted.
    console.warn(`[login] User ${authData.user.id} has no profile row. Signing out.`);
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "User profile not found. Please contact support." },
      { status: 403 },
    );
  }

  // --- Check if user is active ---
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
  response.cookies.set({
    name: COOKIE_SESSION_START,
    value: Date.now().toString(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  response.cookies.set({
    name: COOKIE_USER_ROLE,
    value: profile.role,
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
