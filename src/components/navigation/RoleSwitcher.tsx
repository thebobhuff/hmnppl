/**
 * RoleSwitcher - Allows Company Admins to switch between admin and manager views.
 * Appears in the sidebar when user is a COMPANY_ADMIN.
 */
"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

const ROLE_VIEWS: { role: UserRole; label: string; description: string }[] = [
  { role: "COMPANY_ADMIN", label: "Admin View", description: "Full access" },
  { role: "MANAGER", label: "Manager View", description: "Manager perspective" },
];

export function RoleSwitcher() {
  const user = useAuthStore((s) => s.user);
  const effectiveRole = useAuthStore((s) => s.effectiveRole) ?? user?.role;
  const setEffectiveRole = useAuthStore((s) => s.setEffectiveRole);

  if (user?.role !== "COMPANY_ADMIN") return null;

  return (
    <div className="border-t border-border-default p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
        View As
      </p>
      <div className="flex gap-1">
        {ROLE_VIEWS.map((view) => (
          <button
            key={view.role}
            onClick={() => setEffectiveRole(effectiveRole === view.role ? null : view.role)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              effectiveRole === view.role
                ? "bg-brand-primary text-white"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
            }`}
            title={view.description}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
