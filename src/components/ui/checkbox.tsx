import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  /** Label content displayed next to the checkbox — supports rich text / links */
  label?: React.ReactNode;
  /** Additional description below the label */
  description?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "peer h-5 w-5 shrink-0 rounded border border-border bg-card ring-offset-brand-dark-slate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand-primary data-[state=checked]:bg-brand-primary data-[state=checked]:text-text-inverse",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="grid gap-0.5 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-sm font-medium text-text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {label}
            </label>
          )}
          {description && <p className="text-xs text-text-tertiary">{description}</p>}
        </div>
      )}
    </div>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
