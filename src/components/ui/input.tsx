import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-card px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-tertiary ring-offset-brand-dark-slate transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-border hover:border-border-light",
        error:
          "border-brand-error hover:border-brand-error focus-visible:ring-brand-error",
      },
      inputSize: {
        default: "h-10",
        sm: "h-8 text-xs px-2",
        lg: "h-12 text-base px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /** Icon to display inside the input */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, icon, iconPosition = "left", ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center",
              iconPosition === "left" ? "left-0 pl-3" : "right-0 pr-3",
            )}
          >
            <span className="text-text-tertiary">{icon}</span>
          </div>
          <input
            className={cn(
              inputVariants({ variant, inputSize, className }),
              iconPosition === "left" ? "pl-10" : "pr-10",
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
