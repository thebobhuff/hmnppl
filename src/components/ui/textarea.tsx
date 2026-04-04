import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Whether the textarea has an error */
  error?: boolean;
  /** Maximum character count to display */
  maxCount?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, maxCount, value, onChange, ...props }, ref) => {
    const charCount = typeof value === "string" ? value.length : 0;
    const isOverLimit = maxCount !== undefined && charCount > maxCount;

    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border bg-card px-3 py-2 font-body text-sm text-text-primary ring-offset-brand-dark-slate transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error || isOverLimit
              ? "border-brand-error hover:border-brand-error focus-visible:ring-brand-error"
              : "border-border hover:border-border-light",
            className,
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          aria-invalid={error || isOverLimit}
          {...props}
        />
        {maxCount !== undefined && (
          <div
            className={cn(
              "mt-1 text-right text-xs",
              isOverLimit ? "text-brand-error" : "text-text-tertiary",
            )}
          >
            {charCount}/{maxCount}
          </div>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
