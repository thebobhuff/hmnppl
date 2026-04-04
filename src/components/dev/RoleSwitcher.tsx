// ============================================
// HMN — Role Switcher (Dev Only)
// Allows switching between roles to test nav layouts
// ============================================

"use client";

import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLES: { role: UserRole; label: string; color: string }[] = [
  { role: "SUPER_ADMIN", label: "Super Admin", color: "bg-purple-500" },
  { role: "COMPANY_ADMIN", label: "Company Admin", color: "bg-brand-primary" },
  { role: "HR_AGENT", label: "HR Agent", color: "bg-brand-warning" },
  { role: "MANAGER", label: "Manager", color: "bg-brand-success" },
  { role: "EMPLOYEE", label: "Employee", color: "bg-blue-500" },
];

export function RoleSwitcher() {
  const currentRole = useAuthStore((s) => s.user?.role);
  const loginAs = useAuthStore((s) => s.loginAs);

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Dev: Switch Role</h3>
      <div className="flex flex-wrap gap-2">
        {ROLES.map(({ role, label, color }) => (
          <button
            key={role}
            onClick={() => loginAs(role)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              currentRole === role
                ? `${color} text-text-inverse shadow-md ring-2 ring-white/20`
                : "bg-card-hover text-text-secondary hover:bg-card-active hover:text-text-primary",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", color)} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
