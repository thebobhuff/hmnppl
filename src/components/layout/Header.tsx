// ============================================
// HMN — Header Component
// Breadcrumbs + notification bell + user profile dropdown
// Reads breadcrumbs from BreadcrumbContext
// ============================================

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronDown, LogOut, UserCircle, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { NotificationBell } from "@/components/domain/NotificationBell";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const { toggleMobileOpen, collapsed } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { breadcrumbs } = useBreadcrumbs();

  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const isLaptop = breakpoint === "laptop";
  const isDesktop = breakpoint === "desktop";

  const showHamburger = isMobile || isTablet;

  // Dynamic left margin based on sidebar state
  const headerMarginClass = cn(
    (isLaptop || isDesktop) && "lg:ml-16",
    isDesktop && !collapsed && "xl:ml-60",
  );

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  async function handleSignOut() {
    setProfileOpen(false);
    setIsSigningOut(true);

    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      logout();
      router.push("/login");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-brand-slate/95 px-4 backdrop-blur-sm transition-all duration-300",
        // Base: full width (mobile/tablet)
        "left-0",
        // Laptop/Desktop: offset for sidebar
        headerMarginClass,
      )}
    >
      {/* Hamburger menu for tablet/mobile */}
      {showHamburger && (
        <button
          onClick={toggleMobileOpen}
          className={cn(
            "flex-shrink-0 rounded-lg p-2 text-text-secondary transition-colors",
            "hover:bg-card-hover hover:text-text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-slate",
          )}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Breadcrumbs */}
      <div className="min-w-0 flex-1">
        {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      </div>

      {/* Right side actions */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/feedback">
            <Bug className="mr-2 h-4 w-4" />
            Report Bug / Request Feature
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Report bug or request feature"
        >
          <Link href="/feedback">
            <Bug className="h-4 w-4" />
          </Link>
        </Button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
              "hover:bg-card-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-slate",
            )}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-slate-light">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-text-primary">
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : "U"}
                </span>
              )}
            </div>

            {/* Name & Role — hidden on small screens */}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-text-primary">
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </p>
              <p className="text-xs leading-tight text-text-tertiary">
                {user ? formatRole(user.role) : "Sign in"}
              </p>
            </div>

            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-text-tertiary transition-transform duration-200 sm:block",
                profileOpen && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div
              className={cn(
                "absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl",
                "ring-1 ring-black/5",
              )}
              role="menu"
              aria-orientation="vertical"
            >
              {/* User info header */}
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">
                  {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                </p>
                <p className="text-xs text-text-tertiary">{user?.email ?? ""}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors",
                    "hover:bg-card-hover hover:text-text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
                  )}
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-sm text-brand-error transition-colors",
                    "hover:bg-brand-error-dim/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
                  )}
                  role="menuitem"
                  disabled={isSigningOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Format role enum to display string */
function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}
