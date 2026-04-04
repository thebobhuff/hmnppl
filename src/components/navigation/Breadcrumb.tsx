// ============================================
// HMN — Breadcrumb Component
// Clickable breadcrumbs with current page highlight
// ============================================

"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <ol className="flex items-center gap-1" role="list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary"
                  aria-hidden
                />
              )}
              {isLast ? (
                <span className="font-medium text-brand-primary" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href ?? "#"}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-text-secondary transition-colors",
                    "hover:bg-card-hover hover:text-text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-slate",
                  )}
                >
                  {index === 0 ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" aria-hidden />
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
