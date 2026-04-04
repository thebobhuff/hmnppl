import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Retry button label */
  retryLabel?: string;
  /** Retry click handler */
  onRetry?: () => void;
  /** Custom icon (defaults to AlertTriangle) */
  icon?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  retryLabel = "Try again",
  onRetry,
  icon,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-error/15">
        {icon || <AlertTriangle className="h-8 w-8 text-brand-error" />}
      </div>
      <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>
      )}
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
ErrorState.displayName = "ErrorState";

export { ErrorState };
