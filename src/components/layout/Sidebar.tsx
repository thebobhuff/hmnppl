// ============================================
// HMN — Sidebar Component
// Expanded 240px / collapsed 64px / drawer on tablet
// Bottom nav on mobile
// ============================================

"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { getNavigationItems, getMobileNavItems } from "@/config/navigation";
import { RoleSwitcher } from "@/components/navigation/RoleSwitcher";
import { SidebarNavItem } from "@/components/navigation/SidebarNavItem";
import type { Breakpoint } from "@/types";

/** Sidebar widths per breakpoint */
const SIDEBAR_WIDTHS: Record<"expanded" | "collapsed", string> = {
  expanded: "w-60", // 240px
  collapsed: "w-16", // 64px
};

export function Sidebar() {
  const breakpoint = useBreakpoint();
  const {
    collapsed,
    mobileOpen,
    hoverExpanded,
    toggleCollapsed,
    setMobileOpen,
    setHoverExpanded,
  } = useSidebarStore();
  const user = useAuthStore((s) => s.user);

  const effectiveRole = useAuthStore((s) => s.effectiveRole) ?? user?.role;
const navItems = user ? getNavigationItems(effectiveRole) : [];
  const mobileNavItems = user ? getMobileNavItems(effectiveRole) : [];

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const isLaptop = breakpoint === "laptop";
  const isDesktop = breakpoint === "desktop";

  // Show bottom nav on mobile
  const showBottomNav = isMobile;
  // Show drawer on tablet
  const showDrawer = isTablet;
  // Show sidebar on laptop/desktop
  const showSidebar = isLaptop || isDesktop;

  // On laptop, sidebar is collapsed but expands on hover
  const isEffectivelyCollapsed = isLaptop ? !hoverExpanded : collapsed;

  // Close mobile drawer on route change or breakpoint change
  const closeDrawer = useCallback(() => {
    setMobileOpen(false);
  }, [setMobileOpen]);

  // Close drawer when resizing to desktop
  useEffect(() => {
    if (showSidebar || isMobile) {
      setMobileOpen(false);
    }
  }, [showSidebar, isMobile, setMobileOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        closeDrawer();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, closeDrawer]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ---- Desktop / Laptop Sidebar ---- */}
      {showSidebar && (
        <DesktopSidebar
          navItems={navItems}
          collapsed={isEffectivelyCollapsed}
          isLaptop={isLaptop}
          isDesktop={isDesktop}
          userCollapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          onMouseEnterLaptop={() => setHoverExpanded(true)}
          onMouseLeaveLaptop={() => setHoverExpanded(false)}
        />
      )}

      {/* ---- Tablet Drawer Overlay ---- */}
      {showDrawer && (
        <TabletDrawer navItems={navItems} isOpen={mobileOpen} onClose={closeDrawer} />
      )}

      {/* ---- Mobile Bottom Nav ---- */}
      {showBottomNav && <MobileBottomNav navItems={mobileNavItems} />}
    </>
  );
}

// ==============================
// Desktop Sidebar Sub-component
// ==============================

interface DesktopSidebarProps {
  navItems: ReturnType<typeof getNavigationItems>;
  collapsed: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  userCollapsed: boolean;
  onToggleCollapse: () => void;
  onMouseEnterLaptop: () => void;
  onMouseLeaveLaptop: () => void;
}

function DesktopSidebar({
  navItems,
  collapsed,
  isLaptop,
  isDesktop,
  userCollapsed,
  onToggleCollapse,
  onMouseEnterLaptop,
  onMouseLeaveLaptop,
}: DesktopSidebarProps) {
  const widthClass = collapsed ? SIDEBAR_WIDTHS.collapsed : SIDEBAR_WIDTHS.expanded;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-brand-dark-slate transition-all duration-300",
        widthClass,
        isLaptop && collapsed && "hover:w-60",
      )}
      onMouseEnter={isLaptop ? onMouseEnterLaptop : undefined}
      onMouseLeave={isLaptop ? onMouseLeaveLaptop : undefined}
      aria-label="Sidebar navigation"
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed && !isLaptop && "justify-center px-2",
          isLaptop && collapsed && "justify-center px-2",
        )}
      >
        {!collapsed || (isLaptop && !collapsed) ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
              <span className="text-sm font-bold text-text-inverse">HR</span>
            </div>
            <span className="font-display text-lg font-bold text-text-primary">
              AI HR
            </span>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
            <span className="text-sm font-bold text-text-inverse">HR</span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" role="navigation">
        <ul className="flex flex-col gap-1" role="list">
          {navItems.map((item) => (
            <li key={item.key}>
              <SidebarNavItem item={item} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </nav>

      <RoleSwitcher />
      {/* Collapse Toggle — desktop only */}
      {isDesktop && (
        <div className="border-t border-border p-3">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors",
              "hover:bg-card-hover hover:text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-slate",
              userCollapsed && "justify-center px-2",
            )}
            aria-label={userCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                userCollapsed && "rotate-180",
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {!userCollapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

// ==============================
// Tablet Drawer Sub-component
// ==============================

interface TabletDrawerProps {
  navItems: ReturnType<typeof getNavigationItems>;
  isOpen: boolean;
  onClose: () => void;
}

function TabletDrawer({ navItems, isOpen, onClose }: TabletDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-dark-slate shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            aria-label="Navigation drawer"
          >
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
                  <span className="text-sm font-bold text-text-inverse">HR</span>
                </div>
                <span className="font-display text-lg font-bold text-text-primary">
                  AI HR
                </span>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "rounded-lg p-2 text-text-secondary transition-colors",
                  "hover:bg-card-hover hover:text-text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-slate",
                )}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4" role="navigation">
              <ul className="flex flex-col gap-1" role="list">
                {navItems.map((item) => (
                  <li key={item.key}>
                    <div onClick={onClose}>
                      <SidebarNavItem item={item} collapsed={false} />
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

// ==============================
// Mobile Bottom Nav Sub-component
// ==============================

interface MobileBottomNavProps {
  navItems: ReturnType<typeof getMobileNavItems>;
}

function MobileBottomNav({ navItems }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-brand-dark-slate"
      aria-label="Mobile navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <SidebarNavItem key={item.key} item={item} variant="bottom-nav" />
        ))}
      </div>
    </nav>
  );
}
