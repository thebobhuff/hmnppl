// ============================================
// HMN — Header Component
// Breadcrumbs + notification bell + user profile dropdown
// Reads breadcrumbs from BreadcrumbContext
// ============================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, ChevronDown, LogOut, UserCircle, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { NotificationBell } from "@/components/domain/NotificationBell";

export function Header() {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const { toggleMobileOpen, collapsed } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { breadcrumbs } = useBreadcrumbs();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      type: string;
      id: string;
      title: string;
      subtitle: string;
      href: string;
      score?: number;
    }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    if (!profileOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
      if (key === "escape") {
        setSearchOpen(false);
      }
    }

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    if (!profileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [profileOpen]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSelectedResultIndex(0);
      return;
    }

    const handle = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(searchQuery)}`, {
          credentials: "include",
        });
        const data = await res.json();
        setSearchResults(data.results || []);
        setSelectedResultIndex(0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedResultIndex >= searchResults.length) {
      setSelectedResultIndex(0);
    }
  }, [searchResults, selectedResultIndex]);

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
        <div ref={searchRef} className="relative hidden md:block">
          <div className="flex items-center rounded-lg border border-border bg-card px-3 py-1.5">
            <Search className="h-4 w-4 text-text-tertiary" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (!searchOpen) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedResultIndex((prev) =>
                    Math.min(prev + 1, Math.max(searchResults.length - 1, 0)),
                  );
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedResultIndex((prev) => Math.max(prev - 1, 0));
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const item = searchResults[selectedResultIndex];
                  if (item) {
                    router.push(item.href);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }
              }}
              placeholder="Search people, policies..."
              className="ml-2 w-56 bg-transparent text-sm outline-none placeholder:text-text-tertiary"
            />
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 text-text-tertiary"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {searchOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[28rem] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              {searchResults.length === 0 && !searchLoading ? (
                <div className="p-4 text-sm text-text-tertiary">No results found.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto py-1">
                  {searchResults.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        router.push(item.href);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover",
                        searchResults[selectedResultIndex]?.id === item.id &&
                          searchResults[selectedResultIndex]?.type === item.type &&
                          "bg-card-hover",
                      )}
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-brand-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-text-tertiary">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-sm text-brand-error transition-colors",
                    "hover:bg-brand-error-dim/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
                  )}
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
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
