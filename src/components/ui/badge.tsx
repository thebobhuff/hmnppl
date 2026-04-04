import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-dark-slate",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-slate text-text-primary",
        success: "border-transparent bg-brand-success/15 text-brand-success",
        warning: "border-transparent bg-brand-warning/15 text-brand-warning",
        error: "border-transparent bg-brand-error/15 text-brand-error",
        critical: "border-transparent bg-brand-error-dim/15 text-brand-error-dim",
        outline: "border-border text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  /** Optional dot indicator before the label */
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-brand-success",
            variant === "warning" && "bg-brand-warning",
            variant === "error" && "bg-brand-error",
            variant === "critical" && "bg-brand-error-dim",
            variant === "default" && "bg-text-primary",
            variant === "outline" && "bg-text-secondary",
          )}
        />
      )}
      {children}
    </div>
  );
}
Badge.displayName = "Badge";

export { Badge, badgeVariants };
