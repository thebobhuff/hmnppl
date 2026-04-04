/**
 * Microsoft SSO — Azure AD OAuth2 authentication.
 *
 * Flow:
 *   1. User clicks "Sign in with Microsoft"
 *   2. Redirect to Azure AD authorization endpoint
 *   3. User authenticates with Microsoft
 *   4. Azure AD redirects to /api/v1/auth/microsoft/callback
 *   5. Exchange code for tokens, verify, create Supabase session
 *
 * Environment variables required:
 *   - AZURE_AD_CLIENT_ID
 *   - AZURE_AD_CLIENT_SECRET
 *   - AZURE_AD_TENANT_ID
 *   - NEXT_PUBLIC_APP_URL
 */

import { NextResponse } from "next/server";

const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID ?? "";
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET ?? "";
const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? "common";
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1/auth/microsoft/callback`;

const AUTHORITY = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}`;
const SCOPES = ["openid", "profile", "email", "User.Read"];

/**
 * GET /api/v1/auth/microsoft/login — Redirect to Azure AD
 */
export async function GET() {
  if (!AZURE_AD_CLIENT_ID) {
    return NextResponse.json(
      { error: "Microsoft SSO is not configured" },
      { status: 501 },
    );
  }

  const state = generateState();
  const nonce = generateNonce();

  const params = new URLSearchParams({
    client_id: AZURE_AD_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    state,
    nonce,
    response_mode: "query",
  });

  const authUrl = `${AUTHORITY}/oauth2/v2.0/authorize?${params.toString()}`;

  // Store state in cookie for CSRF protection
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("ms_sso_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  response.cookies.set("ms_sso_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}

function generateState(): string {
  return crypto.randomUUID();
}

function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
