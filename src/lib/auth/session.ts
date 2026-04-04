/**
 * Session utilities for authentication and authorization.
 *
 * Provides helpers for getting the current user, enforcing auth
 * requirements, and managing role-based session timeouts.
 */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  companyId: string;
  departmentId: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  managerId: string | null;
  status: string;
  hireDate: string | null;
  lastLoginAt: string | null;
}

export type UserRole =
  | "super_admin"
  | "company_admin"
  | "hr_agent"
  | "manager"
  | "employee";

export interface SessionTimeouts {
  /** Idle timeout in milliseconds before session is invalidated. */
  idleMs: number;
  /** Absolute maximum session duration in milliseconds. */
  absoluteMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_ROLES: UserRole[] = ["super_admin", "company_admin", "hr_agent", "manager"];

const TIMEOUTS: Record<string, SessionTimeouts> = {
  admin: { idleMs: 15 * 60 * 1_000, absoluteMs: 8 * 60 * 60 * 1_000 },
  employee: { idleMs: 30 * 60 * 1_000, absoluteMs: 8 * 60 * 60 * 1_000 },
};

// ---------------------------------------------------------------------------
// Timeout helpers
// ---------------------------------------------------------------------------

/**
 * Returns session timeout configuration for the given role.
 *
 * Admin roles (super_admin, company_admin, hr_agent, manager) get 15-min idle.
 * Employees get 30-min idle. Absolute max is 8 hours for everyone.
 */
export function getSessionTimeouts(role: string): SessionTimeouts {
  const isAdmin = ADMIN_ROLES.includes(role as UserRole);
  return isAdmin ? TIMEOUTS.admin : TIMEOUTS.employee;
}

/**
 * Checks whether a role belongs to an admin-level user.
 */
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

// ---------------------------------------------------------------------------
// User retrieval
// ---------------------------------------------------------------------------

/**
 * Returns the current authenticated user's profile, or `null` if not
 * authenticated or if the profile row does not exist yet.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    companyId: profile.company_id,
    departmentId: profile.department_id,
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    jobTitle: profile.job_title,
    avatarUrl: profile.avatar_url,
    managerId: profile.manager_id,
    status: profile.status,
    hireDate: profile.hire_date,
    lastLoginAt: profile.last_login_at,
  };
}

/**
 * Returns the current user or redirects to `/login`.
 *
 * Use in Server Components and Server Actions that require authentication.
 */
export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Returns the current user only if they hold one of the specified roles.
 * Redirects to `/login` if unauthenticated, or to `/` if unauthorized.
 */
export async function requireRole(...roles: UserRole[]): Promise<UserProfile> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    redirect("/");
  }

  return user;
}
