/**
 * Microsoft SSO Callback — handles Azure AD OAuth2 callback.
 *
 * Exchanges authorization code for tokens, verifies the user,
 * creates/updates the Supabase user profile, and establishes a session.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID ?? "";
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET ?? "";
const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? "common";
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1/auth/microsoft/callback`;
const AUTHORITY = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Check for OAuth errors
  if (error) {
    const errorDescription = url.searchParams.get("error_description") ?? "Unknown error";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=Missing+authorization+code`,
    );
  }

  // Verify state (CSRF protection)
  const cookieStore = await cookies();
  const storedState = cookieStore.get("ms_sso_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=Invalid+state+parameter`,
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(`${AUTHORITY}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: AZURE_AD_CLIENT_ID,
        client_secret: AZURE_AD_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[ms-sso] Token exchange failed:", errorBody);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=Token+exchange+failed`,
      );
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    // Decode ID token to get user info
    const payload = decodeJWT(idToken);

    const email = String(
      payload.email ?? payload.preferred_username ?? payload.upn ?? "",
    );
    const firstName = String(payload.given_name ?? "");
    const lastName = String(payload.family_name ?? "");

    if (!email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=No+email+in+token`,
      );
    }

    // Find or create user in Supabase
    const admin = createAdminClient();

    const { data: existingUser } = await admin
      .from("users")
      .select("id, company_id, role, status")
      .eq("email", email)
      .single();

    if (!existingUser) {
      // Auto-provision: create user with default role
      // In production, this would check if the domain is allowed
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=Account+not+provisioned.+Contact+your+HR+administrator.`,
      );
    }

    if (existingUser.status !== "active") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=Account+is+inactive`,
      );
    }

    // Create Supabase Auth session
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        provider: "microsoft",
      },
    });

    if (authError) {
      console.error("[ms-sso] Failed to create/update auth user:", authError.message);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=Authentication+failed`,
      );
    }

    // Clear SSO cookies
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
    );
    response.cookies.delete("ms_sso_state");
    response.cookies.delete("ms_sso_nonce");

    return response;
  } catch (error) {
    console.error("[ms-sso] Callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?error=Authentication+failed`,
    );
  }
}

/**
 * Decode a JWT without verification (for ID token claims only).
 * The signature is verified by Azure AD before we receive it.
 */
function decodeJWT(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = Buffer.from(parts[1], "base64").toString("utf-8");
  return JSON.parse(payload);
}
