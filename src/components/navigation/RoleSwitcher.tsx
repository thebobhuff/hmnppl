/**
 * RoleSwitcher - Allows Company Admins to switch between admin and manager views.
 */
"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

const ROLE_VIEWS: { role: UserRole; label: string }[] = [
  { role: "COMPANY_ADMIN", label: "Admin" },
  { role: "MANAGER", label: "Manager" },
];

export function RoleSwitcher() {
  const user = useAuthStore((s) => s.user);
  const effectiveRole = useAuthStore((s) => s.effectiveRole) ?? user?.role;
  const setEffectiveRole = useAuthStore((s) => s.setEffectiveRole);

  if (user?.role !== "COMPANY_ADMIN") return null;

  return (
    <div className="border-t border-border-default px-3 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          View As
        </span>
        <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
          {effectiveRole === "MANAGER" ? "MGR" : "ADMIN"}
        </span>
      </div>
      <div className="flex gap-1 rounded-lg bg-surface-secondary p-1">
        {ROLE_VIEWS.map((view) => (
          <button
            key={view.role}
            onClick={() => setEffectiveRole(effectiveRole === view.role ? null : view.role)}
            className={"flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all " + (effectiveRole === view.role ? "bg-brand-primary text-white shadow-sm" : "text-text-tertiary hover:text-text-primary")}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}