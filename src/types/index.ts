// ============================================
// HMN — Shared Types
// ============================================

export type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "HR_AGENT"
  | "MANAGER"
  | "EMPLOYEE";

export interface NavItem {
  /** Unique key for the navigation item */
  key: string;
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Lucide icon name or React element */
  iconName: string;
  /** Optional badge count (e.g., notification count) */
  badge?: number;
  /** Whether this is a CTA-style item */
  isCta?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  tenantId?: string;
  tenantName?: string;
}

export type Breakpoint = "mobile" | "tablet" | "laptop" | "desktop";
