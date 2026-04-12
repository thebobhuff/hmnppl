/**
 * Signup API route — POST /api/v1/auth/signup
 *
 * Creates a new user account with:
 *   1. Supabase Auth user (email/password)
 *   2. Company workspace
 *   3. User profile with company_admin role
 *
 * After successful signup the client should call the login endpoint
 * (or use `supabase.auth.signInWithPassword`) to establish a session.
 */
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(255, "Company name must be at most 255 characters"),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(255).optional(),
});

type SignupInput = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Rate limiting check
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = checkRateLimit(`signup_${ip}`, 3, 10 * 60 * 1000); // 3 requests per 10 minutes

  if (!success) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
  }

  const { email, password, firstName, lastName, companyName, phone, jobTitle } =
    parsed.data satisfies SignupInput;

  // --- Use admin client (bypasses RLS) ---
  const admin = createAdminClient();

  // --- 1. Create auth user ---
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email verification for MVP
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (authError) {
    // Handle duplicate email
    if (authError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }
    console.error("[signup] Auth user creation failed:", authError.message);
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
  }

  const userId = authData.user.id;

  // --- 2. Create company ---
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: companyName,
      size: "1-10",
      onboarding_completed: false,
    })
    .select("id, name")
    .single();

  if (companyError || !company) {
    console.error("[signup] Company creation failed:", companyError?.message);
    // Cleanup: delete the auth user we just created
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to create company workspace" },
      { status: 500 },
    );
  }

  // --- 3. Create user profile with company_admin role ---
  const { error: profileError } = await admin.from("users").insert({
    id: userId,
    company_id: company.id,
    role: "company_admin",
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone ?? null,
    job_title: jobTitle ?? null,
    status: "active",
    hire_date: new Date().toISOString().split("T")[0],
  });

  if (profileError) {
    console.error("[signup] Profile creation failed:", profileError.message);
    // Cleanup: delete company and auth user
    await admin.from("companies").delete().eq("id", company.id);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
  }

  // --- Success ---
  return NextResponse.json(
    {
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        role: "company_admin",
      },
      company: {
        id: company.id,
        name: company.name,
      },
    },
    { status: 201 },
  );
}
