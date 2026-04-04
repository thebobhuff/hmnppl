import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressBarVariants = cva("relative h-2 w-full overflow-hidden rounded-full", {
  variants: {
    variant: {
      default: "bg-brand-slate",
      success: "bg-brand-slate",
      warning: "bg-brand-slate",
      error: "bg-brand-slate",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const indicatorVariants = cva(
  "h-full rounded-full transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-brand-primary",
        success: "bg-brand-success",
        warning: "bg-brand-warning",
        error: "bg-brand-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ProgressBarProps
  extends
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressBarVariants> {
  /** Progress value from 0 to 100 */
  value?: number;
  /** Max value (default 100) */
  max?: number;
  /** Whether to show the percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: "top" | "right" | "none";
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(
  (
    {
      className,
      variant,
      value = 0,
      max = 100,
      showLabel = false,
      labelPosition = "top",
      size = "md",
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(Math.round((value / max) * 100), 100);
    const sizeClasses = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    };

    return (
      <div className="w-full">
        {showLabel && labelPosition === "top" && (
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-text-secondary">Progress</span>
            <span className="text-xs font-medium text-text-primary">{percentage}%</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <ProgressPrimitive.Root
            ref={ref}
            className={cn(
              "relative w-full overflow-hidden rounded-full",
              variant === "default" && "bg-brand-slate",
              variant === "success" && "bg-brand-slate",
              variant === "warning" && "bg-brand-slate",
              variant === "error" && "bg-brand-slate",
              sizeClasses[size],
              className,
            )}
            value={value}
            max={max}
            {...props}
          >
            <ProgressPrimitive.Indicator
              className={cn(
                "h-full rounded-full transition-all duration-300 ease-in-out",
                variant === "default" && "bg-brand-primary",
                variant === "success" && "bg-brand-success",
                variant === "warning" && "bg-brand-warning",
                variant === "error" && "bg-brand-error",
              )}
              style={{ width: `${percentage}%` }}
            />
          </ProgressPrimitive.Root>
          {showLabel && labelPosition === "right" && (
            <span className="whitespace-nowrap text-xs font-medium text-text-primary">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    );
  },
);
ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
