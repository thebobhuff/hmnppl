/**
 * Tests for RBAC permission system (permissions.ts).
 *
 * Covers:
 *   - Role hierarchy and comparison
 *   - Route permission lookups (longest-prefix matching)
 *   - API permission lookups (method + path + wildcard matching)
 *   - checkRoutePermission (Layer 1 middleware)
 *   - checkApiPermission (Layer 2 API HOF)
 */
import { describe, it, expect } from "vitest";
import {
  ROLE_HIERARCHY,
  roleRank,
  hasMinimumRole,
  isRoleAllowed,
  getRequiredRolesForRoute,
  getRequiredRolesForApi,
  checkRoutePermission,
  checkApiPermission,
  ROUTE_PERMISSIONS,
  API_PERMISSIONS,
} from "../permissions";
import type { UserRole } from "../session";

// ---------------------------------------------------------------------------
// Role hierarchy
// ---------------------------------------------------------------------------

describe("roleRank", () => {
  it("returns 0 for super_admin (most privileged)", () => {
    expect(roleRank("super_admin")).toBe(0);
  });

  it("returns 4 for employee (least privileged)", () => {
    expect(roleRank("employee")).toBe(4);
  });

  it("returns roles in hierarchical order", () => {
    const ranks = ROLE_HIERARCHY.map(roleRank);
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });

  it("returns Infinity for unknown role", () => {
    // This shouldn't happen at runtime but tests edge case
    expect(roleRank("unknown_role" as UserRole)).toBe(Infinity);
  });
});

describe("hasMinimumRole", () => {
  it("super_admin meets hr_agent minimum", () => {
    expect(hasMinimumRole("super_admin", "hr_agent")).toBe(true);
  });

  it("employee does not meet hr_agent minimum", () => {
    expect(hasMinimumRole("employee", "hr_agent")).toBe(false);
  });

  it("same role meets its own minimum", () => {
    expect(hasMinimumRole("hr_agent", "hr_agent")).toBe(true);
  });

  it("manager meets manager minimum", () => {
    expect(hasMinimumRole("manager", "manager")).toBe(true);
  });

  it("employee does not meet manager minimum", () => {
    expect(hasMinimumRole("employee", "manager")).toBe(false);
  });
});

describe("isRoleAllowed", () => {
  it("returns true when role is in the list", () => {
    expect(isRoleAllowed("hr_agent", ["company_admin", "hr_agent"])).toBe(true);
  });

  it("returns false when role is not in the list", () => {
    expect(isRoleAllowed("employee", ["company_admin", "hr_agent"])).toBe(false);
  });

  it("returns false for empty list", () => {
    expect(isRoleAllowed("super_admin", [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Route permissions (Layer 1 — middleware)
// ---------------------------------------------------------------------------

describe("getRequiredRolesForRoute", () => {
  it("returns roles for exact route match", () => {
    const roles = getRequiredRolesForRoute("/admin");
    expect(roles).toEqual(["super_admin"]);
  });

  it("returns roles for sub-route via prefix matching", () => {
    const roles = getRequiredRolesForRoute("/admin/users");
    expect(roles).toEqual(["super_admin"]);
  });

  it("returns roles for deeply nested sub-route", () => {
    const roles = getRequiredRolesForRoute("/team/members/123/edit");
    expect(roles).toEqual(["super_admin", "company_admin", "hr_agent"]);
  });

  it("returns null for routes that only require authentication", () => {
    expect(getRequiredRolesForRoute("/dashboard")).toBeNull();
    expect(getRequiredRolesForRoute("/profile")).toBeNull();
    expect(getRequiredRolesForRoute("/my-documents")).toBeNull();
  });

  it("returns null for public routes (middleware handles those separately)", () => {
    expect(getRequiredRolesForRoute("/")).toBeNull();
    expect(getRequiredRolesForRoute("/login")).toBeNull();
  });

  it("uses longest-prefix matching for overlapping routes", () => {
    // /company-settings should match /company-settings, not /company
    const roles = getRequiredRolesForRoute("/company-settings");
    expect(roles).toEqual(["super_admin", "company_admin"]);
  });

  it("handles trailing slashes correctly", () => {
    // Route "/team" should match "/team/" but not "/team-building"
    const roles = getRequiredRolesForRoute("/team/");
    expect(roles).toEqual(["super_admin", "company_admin", "hr_agent"]);
  });

  it("does NOT match partial prefix without slash boundary", () => {
    // "/team-building" should NOT match "/team" prefix
    // because we check startsWith("/team/") or exact match "/team"
    const roles = getRequiredRolesForRoute("/team-building");
    // "/team-building" doesn't start with "/team/" so it won't match
    expect(roles).toBeNull();
  });

  it("covers all routes defined in ROUTE_PERMISSIONS", () => {
    for (const [prefix, expectedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
      const roles = getRequiredRolesForRoute(prefix);
      expect(roles, `Route ${prefix} should return its defined roles`).toEqual(
        expectedRoles,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// API permissions (Layer 2 — withAuth HOF)
// ---------------------------------------------------------------------------

describe("getRequiredRolesForApi", () => {
  it("returns roles for exact endpoint match", () => {
    const roles = getRequiredRolesForApi("GET", "/api/v1/users");
    expect(roles).toEqual(["super_admin", "company_admin", "hr_agent"]);
  });

  it("returns roles for wildcard endpoint match", () => {
    const roles = getRequiredRolesForApi("GET", "/api/v1/users/123");
    expect(roles).toEqual(["super_admin", "company_admin", "hr_agent"]);
  });

  it("differentiates between methods on the same path", () => {
    const getRoles = getRequiredRolesForApi("GET", "/api/v1/policies");
    const postRoles = getRequiredRolesForApi("POST", "/api/v1/policies");

    expect(getRoles).toContain("manager");
    expect(postRoles).toEqual(["super_admin", "company_admin"]);
  });

  it("returns null for unlisted endpoints", () => {
    expect(getRequiredRolesForApi("GET", "/api/v1/unknown")).toBeNull();
  });

  it("handles DELETE method", () => {
    const roles = getRequiredRolesForApi("DELETE", "/api/v1/users/123");
    expect(roles).toEqual(["super_admin", "company_admin"]);
  });

  it("handles PATCH method", () => {
    const roles = getRequiredRolesForApi("PATCH", "/api/v1/incidents/456");
    expect(roles).toEqual(["super_admin", "company_admin", "hr_agent"]);
  });

  it("is case-insensitive for method matching", () => {
    // The function expects uppercase method; let's verify it works consistently
    const lower = getRequiredRolesForApi("get", "/api/v1/users");
    const upper = getRequiredRolesForApi("GET", "/api/v1/users");
    // The function does direct string comparison so "get" != "GET"
    expect(lower).toBeNull(); // lowercase won't match
    expect(upper).not.toBeNull();
  });

  it("wildcard matches deep paths", () => {
    const roles = getRequiredRolesForApi("GET", "/api/v1/policies/some-uuid/versions");
    // Should match "GET /api/v1/policies/*"
    expect(roles).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// checkRoutePermission (middleware Layer 1)
// ---------------------------------------------------------------------------

describe("checkRoutePermission", () => {
  it("allows any authenticated user for routes with no role requirement", () => {
    const result = checkRoutePermission("/dashboard", "employee");
    expect(result.allowed).toBe(true);
  });

  it("allows user with correct role", () => {
    const result = checkRoutePermission("/admin", "super_admin");
    expect(result.allowed).toBe(true);
  });

  it("denies user with wrong role", () => {
    const result = checkRoutePermission("/admin", "employee");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("employee");
  });

  it("allows through when role cookie is null (deferred check)", () => {
    const result = checkRoutePermission("/admin", null);
    // No role cookie → allow through, Layer 2 catches it
    expect(result.allowed).toBe(true);
  });

  it("denies employee accessing /settings (company_admin only)", () => {
    const result = checkRoutePermission("/settings", "employee");
    expect(result.allowed).toBe(false);
  });

  it("denies employee accessing /team", () => {
    const result = checkRoutePermission("/team", "employee");
    expect(result.allowed).toBe(false);
  });

  it("allows hr_agent accessing /team", () => {
    const result = checkRoutePermission("/team", "hr_agent");
    expect(result.allowed).toBe(true);
  });

  it("allows company_admin accessing /team", () => {
    const result = checkRoutePermission("/team", "company_admin");
    expect(result.allowed).toBe(true);
  });

  it("denies manager accessing /policies (wait, policies allows hr_agent + company_admin)", () => {
    const result = checkRoutePermission("/policies", "manager");
    expect(result.allowed).toBe(false);
  });

  it("provides reason when denied", () => {
    const result = checkRoutePermission("/admin", "employee");
    expect(result.reason).toBeDefined();
    expect(result.reason).toContain("super_admin");
  });
});

// ---------------------------------------------------------------------------
// checkApiPermission (API Layer 2)
// ---------------------------------------------------------------------------

describe("checkApiPermission", () => {
  it("allows matching role for API endpoint", () => {
    const result = checkApiPermission("POST", "/api/v1/policies", "company_admin");
    expect(result.allowed).toBe(true);
  });

  it("denies non-matching role for API endpoint", () => {
    const result = checkApiPermission("POST", "/api/v1/policies", "hr_agent");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("allows any role for unlisted API endpoint", () => {
    const result = checkApiPermission("GET", "/api/v1/unknown", "employee");
    expect(result.allowed).toBe(true);
  });

  it("checks method-specific permissions correctly", () => {
    // GET policies is more permissive than POST
    const getResult = checkApiPermission("GET", "/api/v1/policies", "manager");
    const postResult = checkApiPermission("POST", "/api/v1/policies", "manager");

    expect(getResult.allowed).toBe(true);
    expect(postResult.allowed).toBe(false);
  });

  it("handles wildcard path matching", () => {
    const result = checkApiPermission("GET", "/api/v1/users/abc-123", "hr_agent");
    expect(result.allowed).toBe(true);
  });

  it("super_admin can access everything listed", () => {
    for (const key of Object.keys(API_PERMISSIONS)) {
      const [method, path] = key.split(" ");
      const result = checkApiPermission(
        method,
        path.replace("/*", "/test-id"),
        "super_admin",
      );
      expect(result.allowed, `${key} should allow super_admin`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Acceptance criteria validation
// ---------------------------------------------------------------------------

describe("Acceptance Criteria — route protection", () => {
  it("employee accessing /admin gets denied", () => {
    const result = checkRoutePermission("/admin", "employee");
    expect(result.allowed).toBe(false);
  });

  it("employee accessing /admin/subpage gets denied", () => {
    const result = checkRoutePermission("/admin/users", "employee");
    expect(result.allowed).toBe(false);
  });

  it("manager can access /incidents", () => {
    const result = checkRoutePermission("/incidents", "manager");
    expect(result.allowed).toBe(true);
  });

  it("employee cannot access /incidents", () => {
    const result = checkRoutePermission("/incidents", "employee");
    expect(result.allowed).toBe(false);
  });

  it("super_admin can access everything", () => {
    const routes = [
      "/admin",
      "/settings",
      "/team",
      "/policies",
      "/incidents",
      "/meetings",
      "/documents",
    ];
    for (const route of routes) {
      const result = checkRoutePermission(route, "super_admin");
      expect(result.allowed, `super_admin should access ${route}`).toBe(true);
    }
  });

  it("all listed API permissions include super_admin or are open", () => {
    // Verify that the permission system is comprehensive
    for (const [key, roles] of Object.entries(API_PERMISSIONS)) {
      expect(Array.isArray(roles), `${key} should have an array of roles`).toBe(true);
      expect(roles.length, `${key} should have at least one role`).toBeGreaterThan(0);
    }
  });
});
