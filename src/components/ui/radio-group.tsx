import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
> {
  /** Orientation of the radio group */
  orientation?: "horizontal" | "vertical";
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation = "vertical", ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(
      "grid gap-3",
      orientation === "horizontal" ? "grid-flow-col" : "grid-flow-row",
      className,
    )}
    {...props}
  />
));
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  /** Label text displayed next to the radio */
  label?: string;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, id, ...props }, ref) => {
  const generatedId = React.useId();
  const radioId = id || generatedId;

  return (
    <div className="flex items-center gap-3">
      <RadioGroupPrimitive.Item
        ref={ref}
        id={radioId}
        className={cn(
          "aspect-square h-5 w-5 rounded-full border border-border bg-card text-text-primary ring-offset-brand-dark-slate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className="h-2.5 w-2.5 fill-brand-primary text-brand-primary" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {label && (
        <label
          htmlFor={radioId}
          className="cursor-pointer text-sm font-medium text-text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      )}
    </div>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
