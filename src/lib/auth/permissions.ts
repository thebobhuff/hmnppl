/**
 * RBAC Permission Constants and Route-to-Role Mapping.
 *
 * This module defines the permission model used across all three RBAC layers:
 *   Layer 1 — Middleware: coarse route-prefix checks using cached role cookie
 *   Layer 2 — API routes: fine-grained method+path checks using DB-verified role
 *   Layer 3 — RLS: row-level tenant isolation in PostgreSQL
 *
 * The canonical role values (lowercase) match the `user_role` Postgres enum
 * and the `UserRole` type exported from `session.ts`.
 */
import type { UserRole } from "./session";

// ---------------------------------------------------------------------------
// Role hierarchy
// ---------------------------------------------------------------------------

/**
 * Roles ordered from most to least privileged.
 * Used by `hasMinimumRole()` for hierarchical comparisons.
 */
export const ROLE_HIERARCHY: UserRole[] = [
  "super_admin",
  "company_admin",
  "hr_agent",
  "manager",
  "employee",
];

/**
 * Returns the numeric rank of a role (0 = most privileged).
 * Returns `Infinity` for unknown roles.
 */
export function roleRank(role: UserRole): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? Infinity : idx;
}

/**
 * Checks whether `userRole` meets or exceeds the `minimumRequired` role.
 * E.g. `hasMinimumRole("company_admin", "hr_agent")` → true
 */
export function hasMinimumRole(userRole: UserRole, minimumRequired: UserRole): boolean {
  return roleRank(userRole) <= roleRank(minimumRequired);
}

/**
 * Checks if `userRole` is in a list of allowed roles.
 */
export function isRoleAllowed(userRole: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(userRole);
}

// ---------------------------------------------------------------------------
// Route permissions (Layer 1 — middleware)
// ---------------------------------------------------------------------------

/**
 * Maps route prefixes to the set of roles allowed to access them.
 * The middleware uses longest-prefix matching so more specific paths
 * take precedence.
 *
 * Routes NOT listed here require only authentication (any logged-in role).
 * Routes in PUBLIC_ROUTES (middleware.ts) require no authentication at all.
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // ── Super admin only ────────────────────────────────────────────────
  "/admin": ["super_admin"],
  "/command-center": ["super_admin"],
  "/tenants": ["super_admin"],
  "/platform-analytics": ["super_admin"],
  "/ai-performance": ["super_admin"],
  "/security-events": ["super_admin"],
  "/platform-settings": ["super_admin"],

  // ── Company admin (+ super_admin always allowed) ─────────────────────
  "/settings": ["super_admin", "company_admin"],
  "/company-settings": ["super_admin", "company_admin"],
  "/onboarding": ["super_admin", "company_admin"],

  // ── Company admin + HR agent (+ super_admin always allowed) ──────────
  "/team": ["super_admin", "company_admin", "hr_agent"],
  "/employees": ["super_admin", "company_admin", "hr_agent"],
  "/policies": ["super_admin", "company_admin", "hr_agent"],

  // ── HR agent + manager ──────────────────────────────────────────────
  "/incidents": ["super_admin", "company_admin", "hr_agent", "manager"],
  "/incident-queue": ["super_admin", "company_admin", "hr_agent"],
  "/report-issue": ["super_admin", "company_admin", "hr_agent", "manager"],

  // ── HR agent + manager (meetings) ───────────────────────────────────
  "/meetings": ["super_admin", "company_admin", "hr_agent", "manager"],

  // ── HR agent + employee (documents) ─────────────────────────────────
  "/documents": ["super_admin", "company_admin", "hr_agent", "employee"],

  // ── Self-service (all authenticated) ────────────────────────────────
  // /dashboard, /profile, /my-documents, /my-meetings, /my-team, etc.
  // are not listed — they only require authentication.
};

/**
 * Sorted route prefixes, longest first, for efficient longest-prefix matching.
 * Pre-computed at module load time to avoid sorting on every request.
 */
const SORTED_ROUTE_PREFIXES = Object.keys(ROUTE_PERMISSIONS).sort(
  (a, b) => b.length - a.length,
);

/**
 * Finds the required roles for a given pathname using longest-prefix matching.
 * Returns `null` if the route only requires authentication (no specific role).
 */
export function getRequiredRolesForRoute(pathname: string): UserRole[] | null {
  for (const prefix of SORTED_ROUTE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return ROUTE_PERMISSIONS[prefix];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// API permissions (Layer 2 — route handler authorization)
// ---------------------------------------------------------------------------

/**
 * Maps HTTP method + path pattern to the set of roles allowed.
 * Used by the `withAuth` HOF for fine-grained API authorization.
 *
 * Path patterns support exact match (e.g., "/api/v1/users") and
 * prefix match (e.g., "/api/v1/users/*").
 *
 * If an endpoint is not listed, it only requires authentication.
 */
export const API_PERMISSIONS: Record<string, UserRole[]> = {
  // ── Users ───────────────────────────────────────────────────────────
  "GET /api/v1/users": ["super_admin", "company_admin", "hr_agent"],
  "POST /api/v1/users": ["super_admin", "company_admin", "hr_agent"],
  "GET /api/v1/users/*": ["super_admin", "company_admin", "hr_agent"],
  "PATCH /api/v1/users/*": ["super_admin", "company_admin", "hr_agent"],
  "DELETE /api/v1/users/*": ["super_admin", "company_admin"],

  // ── Policies ────────────────────────────────────────────────────────
  "GET /api/v1/policies": ["super_admin", "company_admin", "hr_agent", "manager"],
  "POST /api/v1/policies": ["super_admin", "company_admin"],
  "GET /api/v1/policies/*": ["super_admin", "company_admin", "hr_agent", "manager"],
  "PATCH /api/v1/policies/*": ["super_admin", "company_admin", "hr_agent"],
  "DELETE /api/v1/policies/*": ["super_admin", "company_admin"],

  // ── Incidents ───────────────────────────────────────────────────────
  "GET /api/v1/incidents": ["super_admin", "company_admin", "hr_agent", "manager"],
  "POST /api/v1/incidents": ["super_admin", "company_admin", "hr_agent", "manager"],
  "GET /api/v1/incidents/*": ["super_admin", "company_admin", "hr_agent", "manager"],
  "PATCH /api/v1/incidents/*": ["super_admin", "company_admin", "hr_agent"],
  "DELETE /api/v1/incidents/*": ["super_admin", "company_admin", "hr_agent"],

  // ── Meetings ────────────────────────────────────────────────────────
  "GET /api/v1/meetings": ["super_admin", "company_admin", "hr_agent", "manager"],
  "POST /api/v1/meetings": ["super_admin", "company_admin", "hr_agent"],
  "GET /api/v1/meetings/*": ["super_admin", "company_admin", "hr_agent", "manager"],
  "PATCH /api/v1/meetings/*": ["super_admin", "company_admin", "hr_agent"],
  "DELETE /api/v1/meetings/*": ["super_admin", "company_admin", "hr_agent"],

  // ── Documents ───────────────────────────────────────────────────────
  "GET /api/v1/documents": ["super_admin", "company_admin", "hr_agent", "employee"],
  "POST /api/v1/documents": ["super_admin", "company_admin", "hr_agent"],
  "GET /api/v1/documents/*": ["super_admin", "company_admin", "hr_agent", "employee"],
  "PATCH /api/v1/documents/*": ["super_admin", "company_admin", "hr_agent"],
  "DELETE /api/v1/documents/*": ["super_admin", "company_admin", "hr_agent"],

  // ── Departments ─────────────────────────────────────────────────────
  "GET /api/v1/departments": ["super_admin", "company_admin", "hr_agent", "manager"],
  "POST /api/v1/departments": ["super_admin", "company_admin", "hr_agent"],
  "PATCH /api/v1/departments/*": ["super_admin", "company_admin", "hr_agent"],
  "DELETE /api/v1/departments/*": ["super_admin", "company_admin"],

  // ── Companies ───────────────────────────────────────────────────────
  "GET /api/v1/companies": ["super_admin"],
  "GET /api/v1/companies/*": ["super_admin", "company_admin"],
  "PATCH /api/v1/companies/*": ["super_admin", "company_admin"],

  // ── Audit log ───────────────────────────────────────────────────────
  "GET /api/v1/audit-log": ["super_admin", "company_admin"],
  "GET /api/v1/audit-log/*": ["super_admin", "company_admin"],

  // ── Signatures ──────────────────────────────────────────────────────
  "POST /api/v1/signatures": ["super_admin", "company_admin", "hr_agent", "employee"],
  "GET /api/v1/signatures/*": ["super_admin", "company_admin", "hr_agent", "employee"],

  // ── Notifications ───────────────────────────────────────────────────
  "GET /api/v1/notifications": [
    "super_admin",
    "company_admin",
    "hr_agent",
    "manager",
    "employee",
  ],
  "PATCH /api/v1/notifications/*": [
    "super_admin",
    "company_admin",
    "hr_agent",
    "manager",
    "employee",
  ],
};

/**
 * Matches an API permission key against an actual method and path.
 * Supports exact match and wildcard suffix (e.g., "/api/v1/users/*").
 */
function matchesApiPattern(key: string, method: string, pathname: string): boolean {
  const [keyMethod, keyPath] = splitApiPermissionKey(key);
  if (keyMethod !== method) return false;

  // Exact match
  if (keyPath === pathname) return true;

  // Wildcard prefix match: "/api/v1/users/*" matches "/api/v1/users/123"
  if (keyPath.endsWith("/*")) {
    const prefix = keyPath.slice(0, -2);
    return pathname === prefix || pathname.startsWith(prefix + "/");
  }

  return false;
}

/**
 * Splits "METHOD /path" into [method, path].
 */
function splitApiPermissionKey(key: string): [string, string] {
  const spaceIdx = key.indexOf(" ");
  return [key.slice(0, spaceIdx), key.slice(spaceIdx + 1)];
}

/**
 * Pre-sorted API permission keys, most specific first (longest path first).
 */
const SORTED_API_KEYS = Object.keys(API_PERMISSIONS).sort((a, b) => {
  const [, pathA] = splitApiPermissionKey(a);
  const [, pathB] = splitApiPermissionKey(b);
  // Longer (more specific) paths first
  return pathB.length - pathA.length;
});

/**
 * Finds the required roles for an API request using method + path matching.
 * Returns `null` if the endpoint only requires authentication.
 */
export function getRequiredRolesForApi(
  method: string,
  pathname: string,
): UserRole[] | null {
  for (const key of SORTED_API_KEYS) {
    if (matchesApiPattern(key, method, pathname)) {
      return API_PERMISSIONS[key];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Permission check utility
// ---------------------------------------------------------------------------

/**
 * Result of a permission check.
 */
export interface PermissionCheckResult {
  /** Whether access is granted. */
  allowed: boolean;
  /** Human-readable reason if denied. */
  reason?: string;
}

/**
 * Performs a complete permission check for a page route.
 * Used by the middleware (Layer 1) with the cached role cookie.
 */
export function checkRoutePermission(
  pathname: string,
  userRole: UserRole | null,
): PermissionCheckResult {
  const requiredRoles = getRequiredRolesForRoute(pathname);

  // No specific role requirement — any authenticated user can access
  if (requiredRoles === null) {
    return { allowed: true };
  }

  // No role information available (cookie missing) — allow through;
  // Layer 2 or the page component's requireRole() will catch it.
  if (userRole === null) {
    return { allowed: true };
  }

  if (isRoleAllowed(userRole, requiredRoles)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Role '${userRole}' is not allowed to access '${pathname}'. Required: ${requiredRoles.join(", ")}`,
  };
}

/**
 * Performs a complete permission check for an API endpoint.
 * Used by the `withAuth` HOF (Layer 2) with the DB-verified role.
 */
export function checkApiPermission(
  method: string,
  pathname: string,
  userRole: UserRole,
): PermissionCheckResult {
  const requiredRoles = getRequiredRolesForApi(method, pathname);

  if (requiredRoles === null) {
    return { allowed: true };
  }

  if (isRoleAllowed(userRole, requiredRoles)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Role '${userRole}' cannot ${method} ${pathname}. Required: ${requiredRoles.join(", ")}`,
  };
}
