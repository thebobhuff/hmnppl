import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Whether pagination is disabled */
  disabled?: boolean;
  /** Whether to show first/last page buttons */
  showEdges?: boolean;
  /** Sibling count (how many pages to show on each side of current) */
  siblingCount?: number;
  /** Additional class names */
  className?: string;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | "ellipsis-start" | "ellipsis-end")[] {
  const totalNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipsis slots
  const totalPageNumbers = Math.min(totalNumbers, totalPages);

  if (totalPageNumbers === totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-end", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1,
    );
    return [1, "ellipsis-start", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  );
  return [1, "ellipsis-start", ...middleRange, "ellipsis-end", totalPages];
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  showEdges = true,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages, siblingCount);

  const btnBase =
    "h-9 w-9 p-0 text-sm font-medium rounded-md inline-flex items-center justify-center";

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
    >
      {/* First page */}
      {showEdges && (
        <Button
          variant="ghost"
          size="icon"
          className={btnBase}
          onClick={() => onPageChange(1)}
          disabled={disabled || currentPage === 1}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Previous page */}
      <Button
        variant="ghost"
        size="icon"
        className={btnBase}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === "ellipsis-start" || page === "ellipsis-end") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-9 w-9 items-center justify-center text-text-tertiary"
              aria-hidden
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        const isActive = page === currentPage;
        return (
          <Button
            key={page}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            className={cn(btnBase, isActive && "pointer-events-none")}
            onClick={() => onPageChange(page)}
            disabled={disabled}
            aria-label={`Go to page ${page}`}
            aria-current={isActive ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}

      {/* Next page */}
      <Button
        variant="ghost"
        size="icon"
        className={btnBase}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page */}
      {showEdges && (
        <Button
          variant="ghost"
          size="icon"
          className={btnBase}
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
Pagination.displayName = "Pagination";

export { Pagination };
