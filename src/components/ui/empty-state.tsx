import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  /** Icon to display in the circle */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** CTA button label */
  actionLabel?: string;
  /** CTA button click handler */
  onAction?: () => void;
  /** Additional class names */
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-slate-light text-text-tertiary">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
EmptyState.displayName = "EmptyState";

export { EmptyState };
