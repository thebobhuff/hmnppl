// ============================================
// HMN — SidebarNavItem
// Individual navigation item for the sidebar
// ============================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "./DynamicIcon";
import type { NavItem } from "@/types";

interface SidebarNavItemProps {
  item: NavItem;
  /** Whether the sidebar is in collapsed (icons-only) mode */
  collapsed?: boolean;
  /** Compact variant for mobile bottom nav */
  variant?: "sidebar" | "bottom-nav";
}

export function SidebarNavItem({
  item,
  collapsed = false,
  variant = "sidebar",
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  if (variant === "bottom-nav") {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-slate",
          isActive ? "text-brand-primary" : "text-text-secondary hover:text-text-primary",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="relative">
          <DynamicIcon name={item.iconName} className="h-5 w-5" />
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-error-dim px-1 text-[10px] font-bold text-text-primary">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </div>
        <span className="truncate text-[11px] leading-tight">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-slate",
        collapsed && "justify-center px-2",
        item.isCta
          ? isActive
            ? "bg-brand-primary text-text-inverse shadow-md shadow-brand-primary/20"
            : "bg-brand-warning text-text-inverse shadow-md shadow-brand-warning/20 hover:bg-brand-warning/90"
          : isActive
            ? "bg-brand-primary text-text-inverse shadow-md shadow-brand-primary/20"
            : "text-text-secondary hover:bg-card-hover hover:text-text-primary",
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
    >
      {/* Icon */}
      <div className="relative flex-shrink-0">
        <DynamicIcon
          name={item.iconName}
          className={cn(
            "h-5 w-5 transition-colors",
            isActive && !item.isCta
              ? "text-text-inverse"
              : item.isCta
                ? "text-text-inverse"
                : "text-text-tertiary group-hover:text-text-primary",
          )}
        />
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-error-dim px-1 text-[10px] font-bold text-text-primary">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </div>

      {/* Label — hidden when collapsed */}
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Tooltip on collapsed sidebar */}
      {collapsed && (
        <div
          className={cn(
            "pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-text-primary shadow-lg",
            "opacity-0 transition-opacity group-hover:opacity-100",
          )}
          role="tooltip"
        >
          {item.label}
        </div>
      )}
    </Link>
  );
}
