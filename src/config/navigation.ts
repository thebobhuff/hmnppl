// ============================================
// HMN — Navigation Configuration
// Role-adaptive navigation items
// ============================================

import type { NavItem, UserRole } from "@/types";

/**
 * Navigation items per role, as specified in UX.md.
 * Icons reference lucide-react icon names.
 */

const SUPER_ADMIN_NAV: NavItem[] = [
  {
    key: "command-center",
    label: "Command Center",
    href: "/command-center",
    iconName: "LayoutDashboard",
  },
  { key: "tenants", label: "Tenants", href: "/tenants", iconName: "Building2" },
  {
    key: "platform-analytics",
    label: "Platform Analytics",
    href: "/platform-analytics",
    iconName: "BarChart3",
  },
  {
    key: "ai-performance",
    label: "AI Performance",
    href: "/ai-performance",
    iconName: "Brain",
  },
  {
    key: "security-events",
    label: "Security Events",
    href: "/security-events",
    iconName: "ShieldAlert",
  },
  {
    key: "platform-settings",
    label: "Platform Settings",
    href: "/platform-settings",
    iconName: "Settings",
  },
  { key: "my-profile", label: "My Profile", href: "/profile", iconName: "UserCircle" },
];

const COMPANY_ADMIN_NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    iconName: "LayoutDashboard",
  },
  {
    key: "departments",
    label: "Departments",
    href: "/departments",
    iconName: "Building2",
  },
  { key: "employees", label: "Employees", href: "/employees", iconName: "Users" },
  { key: "policies", label: "Policies", href: "/policies", iconName: "FileText" },
  { key: "reports", label: "Reports", href: "/reports", iconName: "BarChart3" },
  {
    key: "company-settings",
    label: "Company Settings",
    href: "/company-settings",
    iconName: "Settings",
  },
  { key: "my-profile", label: "My Profile", href: "/profile", iconName: "UserCircle" },
];

const HR_AGENT_NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    iconName: "LayoutDashboard",
  },
  {
    key: "incident-queue",
    label: "Incident Queue",
    href: "/incident-queue",
    iconName: "Inbox",
    badge: 0,
  },
  { key: "employees", label: "Employees", href: "/employees", iconName: "Users" },
  {
    key: "departments",
    label: "Departments",
    href: "/departments",
    iconName: "Building2",
  },
  { key: "meetings", label: "Meetings", href: "/meetings", iconName: "Calendar" },
  { key: "policies", label: "Policies", href: "/policies", iconName: "FileText" },
  {
    key: "my-reports",
    label: "My Reports",
    href: "/my-reports",
    iconName: "FileBarChart",
  },
  { key: "my-profile", label: "My Profile", href: "/profile", iconName: "UserCircle" },
];

const MANAGER_NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    iconName: "LayoutDashboard",
  },
  {
    key: "report-issue",
    label: "Report Issue",
    href: "/report-issue",
    iconName: "PlusCircle",
    isCta: true,
  },
  { key: "employees", label: "Employees", href: "/employees", iconName: "Users" },
  {
    key: "conduct-interview",
    label: "Conduct Interview",
    href: "/conduct-interview",
    iconName: "MessageSquare",
  },
  {
    key: "my-reports",
    label: "My Reports",
    href: "/my-reports",
    iconName: "FileBarChart",
  },
  { key: "my-team", label: "My Team", href: "/my-team", iconName: "Users" },
  {
    key: "my-meetings",
    label: "My Meetings",
    href: "/my-meetings",
    iconName: "Calendar",
  },
  { key: "my-profile", label: "My Profile", href: "/profile", iconName: "UserCircle" },
];

const EMPLOYEE_NAV: NavItem[] = [
  {
    key: "my-documents",
    label: "My Documents",
    href: "/my-documents",
    iconName: "FileText",
  },
  {
    key: "my-meetings",
    label: "My Meetings",
    href: "/my-meetings",
    iconName: "Calendar",
  },
  { key: "my-profile", label: "My Profile", href: "/profile", iconName: "UserCircle" },
];

const NAVIGATION_MAP: Record<UserRole, NavItem[]> = {
  SUPER_ADMIN: SUPER_ADMIN_NAV,
  COMPANY_ADMIN: COMPANY_ADMIN_NAV,
  HR_AGENT: HR_AGENT_NAV,
  MANAGER: MANAGER_NAV,
  EMPLOYEE: EMPLOYEE_NAV,
};

export function getNavigationItems(role: UserRole): NavItem[] {
  return NAVIGATION_MAP[role] ?? EMPLOYEE_NAV;
}

/**
 * Returns the top 5 nav items for the mobile bottom nav bar.
 * Prefers the first items plus "My Profile" at the end.
 */
export function getMobileNavItems(role: UserRole): NavItem[] {
  const items = NAVIGATION_MAP[role] ?? EMPLOYEE_NAV;

  if (items.length <= 5) return items;

  // Take first 4 items + always include profile at the end
  const top = items.slice(0, 4);
  const profile = items.find((i) => i.key === "my-profile");
  if (profile) {
    return [...top, profile];
  }
  return items.slice(0, 5);
}
