/**
 * API Route Authorization — Layer 2 of 3-layer RBAC.
 *
 * Provides the `withAuth()` higher-order function that wraps API route
 * handlers (Next.js App Router) to enforce:
 *
 *   1. Authentication — user must have a valid session
 *   2. Role verification — role is read from the database (not JWT alone),
 *      ensuring role changes take effect immediately
 *   3. Tenant ownership — utilities for verifying entity-to-company mapping
 *
 * Usage:
 * ```ts
 * // Require authentication only
 * export const GET = withAuth(async (req, ctx, { user }) => { ... });
 *
 * // Require specific role(s)
 * export const GET = withAuth(
 *   { roles: ["hr_agent", "company_admin"] },
 *   async (req, ctx, { user }) => { ... },
 * );
 *
 * // With API permission check from API_PERMISSIONS map
 * export const GET = withAuth(
 *   { checkApiPermission: true },
 *   async (req, ctx, { user }) => { ... },
 * );
 * ```
 *
 * The `user` object is a `UserProfile` from session.ts, which is populated
 * by querying the `users` table on every call to `getCurrentUser()`.
 * This means role changes in the DB are reflected immediately.
 */
import { NextResponse } from "next/server";
import { getCurrentUser, type UserProfile, type UserRole } from "./session";
import { checkApiPermission } from "./permissions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Authentication context injected into the wrapped handler. */
export interface AuthContext {
  /** The authenticated user's profile, loaded fresh from the database. */
  user: UserProfile;
}

/**
 * A Next.js App Router API route handler that receives the auth context.
 *
 * The first two parameters match the standard Next.js route handler signature:
 *   - `request`: the incoming Request object
 *   - `context`: `{ params: Promise<Record<string, string>> }`
 *
 * The third parameter is the auth context with the verified user profile.
 */
export type AuthenticatedHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> },
  auth: AuthContext,
) => Promise<Response>;

/**
 * Options for the `withAuth` wrapper.
 */
export interface WithAuthOptions {
  /**
   * List of roles that are allowed to access this endpoint.
   * If omitted or empty, any authenticated user is allowed.
   */
  roles?: UserRole[];

  /**
   * If true, checks the request against the API_PERMISSIONS map
   * using the HTTP method and path. This provides centralized
   * permission management from permissions.ts.
   *
   * When both `roles` and `checkApiPermission` are set, both checks
   * must pass.
   */
  checkApiPermission?: boolean;
}

// ---------------------------------------------------------------------------
// Error responses
// ---------------------------------------------------------------------------

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

function forbiddenResponse(reason?: string): NextResponse {
  return NextResponse.json(
    {
      error: "Insufficient permissions",
      ...(reason ? { detail: reason } : {}),
    },
    { status: 403 },
  );
}

// ---------------------------------------------------------------------------
// withAuth HOF
// ---------------------------------------------------------------------------

/**
 * Wraps an API route handler with authentication and authorization checks.
 *
 * The handler receives a guaranteed-authenticated `AuthContext` as its
 * third argument. The user profile is loaded from the database on every
 * request (not from the JWT alone), so role changes take effect immediately.
 *
 * @param optionsOrHandler — Either an options object, or the handler itself
 *   (shorthand for requiring auth only).
 * @param handler — The route handler (when options are provided).
 */
export function withAuth(
  handler: AuthenticatedHandler,
): (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;
export function withAuth(
  options: WithAuthOptions,
  handler: AuthenticatedHandler,
): (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;
export function withAuth(
  optionsOrHandler: WithAuthOptions | AuthenticatedHandler,
  handler?: AuthenticatedHandler,
): (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response> {
  // Normalize overload: figure out which overload was used
  const opts: WithAuthOptions =
    typeof optionsOrHandler === "function" ? {} : optionsOrHandler;
  const fn: AuthenticatedHandler =
    typeof optionsOrHandler === "function" ? optionsOrHandler : handler!;

  return async (
    request: Request,
    context: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    // ── 1. Authenticate — read from DB, not JWT alone ──────────────────
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // ── 2. Role check (explicit roles from options) ────────────────────
    if (opts.roles?.length) {
      if (!opts.roles.includes(user.role)) {
        return forbiddenResponse(
          `Role '${user.role}' is not permitted. Required: ${opts.roles.join(", ")}`,
        );
      }
    }

    // ── 3. API permission map check ────────────────────────────────────
    if (opts.checkApiPermission) {
      const method = request.method.toUpperCase();
      const url = new URL(request.url);
      const result = checkApiPermission(method, url.pathname, user.role);

      if (!result.allowed) {
        return forbiddenResponse(result.reason);
      }
    }

    // ── 4. Call the handler with verified auth context ─────────────────
    return fn(request, context, { user });
  };
}

// ---------------------------------------------------------------------------
// Tenant ownership validation
// ---------------------------------------------------------------------------

/**
 * Validates that an entity belongs to the same company (tenant) as the
 * authenticated user.
 *
 * Call this inside a `withAuth`-wrapped handler when accessing a specific
 * entity by ID to prevent cross-tenant data access.
 *
 * @returns `null` if validation passes, or a `NextResponse` with 403
 *   that should be returned immediately.
 *
 * ```ts
 * export const GET = withAuth(
 *   { roles: ["hr_agent"] },
 *   async (req, ctx, { user }) => {
 *     const incident = await fetchIncident(id);
 *     const tenantError = validateTenantOwnership(user, incident.companyId);
 *     if (tenantError) return tenantError;
 *     // ... safe to proceed
 *   },
 * );
 * ```
 */
export function validateTenantOwnership(
  user: UserProfile,
  entityCompanyId: string,
): NextResponse | null {
  if (user.companyId !== entityCompanyId) {
    return forbiddenResponse("Access denied: resource belongs to a different company");
  }
  return null;
}

/**
 * Batch variant — validates that ALL entities belong to the user's company.
 *
 * @returns `null` if all pass, or a `NextResponse` with 403.
 */
export function validateTenantOwnershipBatch(
  user: UserProfile,
  entityCompanyIds: string[],
): NextResponse | null {
  const userCompanyId = user.companyId;
  const foreign = entityCompanyIds.find((cid) => cid !== userCompanyId);
  if (foreign !== undefined) {
    return forbiddenResponse(
      "Access denied: one or more resources belong to a different company",
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Convenience pre-built guards
// ---------------------------------------------------------------------------

/**
 * Pre-configured `withAuth` wrappers for common role requirements.
 * Import and spread them to keep route handlers concise.
 *
 * ```ts
 * // Only HR agents can POST
 * export const POST = withAuth(
 *   { roles: roleGuards.hrAgent },
 *   async (req, ctx, { user }) => { ... },
 * );
 * ```
 */
export const roleGuards = {
  superAdmin: ["super_admin"] as UserRole[],
  companyAdmin: ["super_admin", "company_admin"] as UserRole[],
  hrAgent: ["super_admin", "company_admin", "hr_agent"] as UserRole[],
  manager: ["super_admin", "company_admin", "hr_agent", "manager"] as UserRole[],
  companyAdminOnly: ["company_admin"] as UserRole[],
  hrAgentOnly: ["hr_agent"] as UserRole[],
} as const;
