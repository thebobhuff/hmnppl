import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {
  /** Label text displayed next to the switch */
  label?: string;
  /** Additional description below the label */
  description?: string;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <div className="flex items-start gap-3">
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        className={cn(
          "peer h-6 w-11 shrink-0 cursor-pointer rounded-full bg-brand-slate ring-offset-brand-dark-slate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-primary",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-text-primary shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
          )}
        />
      </SwitchPrimitive.Root>
      {(label || description) && (
        <div className="grid gap-0.5 leading-none">
          {label && (
            <label
              htmlFor={switchId}
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
Switch.displayName = "Switch";

export { Switch };
