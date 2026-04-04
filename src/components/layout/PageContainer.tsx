// ============================================
// HMN — PageContainer Component
// Consistent page content wrapper with proper spacing
// ============================================

"use client";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useBreakpoint } from "@/hooks/use-breakpoint";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Optional page title rendered as an h1 */
  title?: string;
  /** Optional page description */
  description?: string;
  /** Actions slot (top right of the header area) */
  actions?: React.ReactNode;
}

export function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}: PageContainerProps) {
  const breakpoint = useBreakpoint();
  const collapsed = useSidebarStore((s) => s.collapsed);

  const isLaptop = breakpoint === "laptop";
  const isDesktop = breakpoint === "desktop";
  const isMobile = breakpoint === "mobile";

  // Dynamic left margin for sidebar
  // lg:ml-16 covers laptop (≥1024px) with collapsed sidebar
  // xl:ml-60 expands to 240px on desktop (≥1280px) when not collapsed
  const contentMarginClass = cn(
    (isLaptop || isDesktop) && "lg:ml-16",
    isDesktop && !collapsed && "xl:ml-60",
  );

  // Bottom padding for mobile bottom nav
  const bottomPadding = isMobile ? "pb-20" : "";

  return (
    <main
      className={cn(
        "min-h-screen pt-16 transition-all duration-300",
        contentMarginClass,
        bottomPadding,
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {title && (
                <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-text-secondary sm:text-base">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex flex-shrink-0 items-center gap-3">{actions}</div>
            )}
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
    </main>
  );
}
