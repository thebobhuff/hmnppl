/**
 * Tests for API authorization Layer 2 (require-role.ts).
 *
 * Covers:
 *   - withAuth() HOF authentication enforcement
 *   - withAuth() role-based authorization
 *   - withAuth() API permission map checking
 *   - validateTenantOwnership()
 *   - validateTenantOwnershipBatch()
 *   - roleGuards constants
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the session module before importing the module under test
vi.mock("../session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock the permissions module for checkApiPermission
vi.mock("../permissions", () => ({
  checkApiPermission: vi.fn(),
}));

// Mock CSRF validation so authorization tests are not tied to a Next request scope
vi.mock("../../csrf", () => ({
  validateCsrfToken: vi.fn().mockResolvedValue(null),
}));

import {
  withAuth,
  validateTenantOwnership,
  validateTenantOwnershipBatch,
  roleGuards,
} from "../require-role";
import { getCurrentUser } from "../session";
import { checkApiPermission } from "../permissions";
import type { UserProfile } from "../session";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    companyId: "company-1",
    departmentId: null,
    role: "employee",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: null,
    jobTitle: null,
    avatarUrl: null,
    managerId: null,
    status: "active",
    hireDate: null,
    lastLoginAt: null,
    ...overrides,
  };
}

const mockEmployee = makeProfile({ role: "employee" });
const mockHrAgent = makeProfile({ role: "hr_agent", id: "user-hr" });
const mockCompanyAdmin = makeProfile({ role: "company_admin", id: "user-admin" });
const mockSuperAdmin = makeProfile({ role: "super_admin", id: "user-super" });
const mockManager = makeProfile({ role: "manager", id: "user-mgr" });

function mockRequest(url = "http://localhost/api/v1/test", method = "GET"): Request {
  return new Request(url, { method });
}

const mockContext = { params: Promise.resolve({}) };

// ---------------------------------------------------------------------------
// withAuth — authentication
// ---------------------------------------------------------------------------

describe("withAuth — authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const response = await wrapped(mockRequest(), mockContext);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Authentication required");
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler when user is authenticated (no role requirement)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockEmployee);
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withAuth(handler);

    const response = await wrapped(mockRequest(), mockContext);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    // Verify auth context is passed
    const authContext = handler.mock.calls[0][2];
    expect(authContext.user).toEqual(mockEmployee);
  });
});

// ---------------------------------------------------------------------------
// withAuth — role authorization
// ---------------------------------------------------------------------------

describe("withAuth — role authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when user lacks required role", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockEmployee);

    const handler = vi.fn();
    const wrapped = withAuth({ roles: ["hr_agent"] }, handler);

    const response = await wrapped(mockRequest(), mockContext);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Insufficient permissions");
    expect(body.detail).toContain("employee");
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler when user has required role", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockHrAgent);
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withAuth({ roles: ["hr_agent", "company_admin"] }, handler);

    const response = await wrapped(mockRequest(), mockContext);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("allows when multiple roles are specified and user matches one", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockCompanyAdmin);
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withAuth({ roles: ["hr_agent", "company_admin"] }, handler);

    const response = await wrapped(mockRequest(), mockContext);
    expect(response.status).toBe(200);
  });

  it("super_admin is NOT automatically allowed — must be in roles list", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockSuperAdmin);
    const handler = vi.fn();
    const wrapped = withAuth({ roles: ["hr_agent"] }, handler);

    const response = await wrapped(mockRequest(), mockContext);
    expect(response.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// withAuth — API permission map check
// ---------------------------------------------------------------------------

describe("withAuth — checkApiPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks API permission map when checkApiPermission is true", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockHrAgent);
    vi.mocked(checkApiPermission).mockReturnValue({ allowed: true });
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const wrapped = withAuth({ checkApiPermission: true }, handler);
    const request = mockRequest("http://localhost/api/v1/policies", "GET");
    const response = await wrapped(request, mockContext);

    expect(response.status).toBe(200);
    expect(checkApiPermission).toHaveBeenCalledWith(
      "GET",
      "/api/v1/policies",
      "hr_agent",
    );
  });

  it("returns 403 when API permission check fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockEmployee);
    vi.mocked(checkApiPermission).mockReturnValue({
      allowed: false,
      reason: "Role 'employee' cannot POST /api/v1/policies",
    });
    const handler = vi.fn();

    const wrapped = withAuth({ checkApiPermission: true }, handler);
    const request = mockRequest("http://localhost/api/v1/policies", "POST");
    const response = await wrapped(request, mockContext);

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("both roles and checkApiPermission must pass when both set", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockHrAgent);
    vi.mocked(checkApiPermission).mockReturnValue({ allowed: false, reason: "denied" });
    const handler = vi.fn();

    // hr_agent passes roles check but fails API permission check
    const wrapped = withAuth({ roles: ["hr_agent"], checkApiPermission: true }, handler);
    const response = await wrapped(mockRequest(), mockContext);

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// withAuth — role is read from DB (not JWT alone)
// ---------------------------------------------------------------------------

describe("withAuth — DB-verified role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getCurrentUser which queries the database", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockHrAgent);
    const handler = vi.fn().mockResolvedValue(new Response("ok"));

    const wrapped = withAuth(handler);
    await wrapped(mockRequest(), mockContext);

    expect(getCurrentUser).toHaveBeenCalledOnce();
  });

  it("role change takes effect immediately (fresh DB query)", async () => {
    // First call: user is employee
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockEmployee);
    // Second call: user was promoted to hr_agent
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockHrAgent);

    const handler = vi.fn().mockResolvedValue(new Response("ok"));
    const wrapped = withAuth({ roles: ["hr_agent"] }, handler);

    // First request: denied (employee)
    const resp1 = await wrapped(mockRequest(), mockContext);
    expect(resp1.status).toBe(403);

    // Second request: allowed (hr_agent — role changed in DB)
    const resp2 = await wrapped(mockRequest(), mockContext);
    expect(resp2.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// validateTenantOwnership
// ---------------------------------------------------------------------------

describe("validateTenantOwnership", () => {
  it("returns null when company IDs match", () => {
    const result = validateTenantOwnership(mockEmployee, "company-1");
    expect(result).toBeNull();
  });

  it("returns 403 when company IDs differ", () => {
    const result = validateTenantOwnership(mockEmployee, "company-2");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("403 body contains access denied message", async () => {
    const result = validateTenantOwnership(mockEmployee, "other-company");
    const body = await result!.json();
    expect(body.error).toContain("Insufficient permissions");
    expect(body.detail).toContain("different company");
  });
});

// ---------------------------------------------------------------------------
// validateTenantOwnershipBatch
// ---------------------------------------------------------------------------

describe("validateTenantOwnershipBatch", () => {
  it("returns null when all company IDs match", () => {
    const result = validateTenantOwnershipBatch(mockEmployee, [
      "company-1",
      "company-1",
      "company-1",
    ]);
    expect(result).toBeNull();
  });

  it("returns 403 when any company ID differs", () => {
    const result = validateTenantOwnershipBatch(mockEmployee, [
      "company-1",
      "company-2", // foreign
      "company-1",
    ]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns null for empty array", () => {
    const result = validateTenantOwnershipBatch(mockEmployee, []);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// roleGuards
// ---------------------------------------------------------------------------

describe("roleGuards", () => {
  it("superAdmin includes super_admin only", () => {
    expect(roleGuards.superAdmin).toEqual(["super_admin"]);
  });

  it("companyAdmin includes super_admin and company_admin", () => {
    expect(roleGuards.companyAdmin).toEqual(["super_admin", "company_admin"]);
  });

  it("hrAgent includes the management chain above", () => {
    expect(roleGuards.hrAgent).toEqual(["super_admin", "company_admin", "hr_agent"]);
  });

  it("manager includes all above plus manager", () => {
    expect(roleGuards.manager).toEqual([
      "super_admin",
      "company_admin",
      "hr_agent",
      "manager",
    ]);
  });

  it("companyAdminOnly is strictly company_admin", () => {
    expect(roleGuards.companyAdminOnly).toEqual(["company_admin"]);
  });

  it("hrAgentOnly is strictly hr_agent", () => {
    expect(roleGuards.hrAgentOnly).toEqual(["hr_agent"]);
  });
});
