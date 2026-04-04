import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  /** Label text */
  label?: string;
  /** Whether the field is required — shows Vanilla asterisk */
  required?: boolean;
  /** Error message to display below the field */
  error?: string;
  /** Hint text displayed below the field (shown when no error) */
  hint?: string;
  /** HTML id attribute for the input element */
  htmlFor?: string;
  /** The input element to wrap */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

function FormField({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-text-secondary">
          {label}
          {required && (
            <span className="ml-0.5 text-brand-primary" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-brand-error" role="alert">
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-text-tertiary">{hint}</p>}
    </div>
  );
}
FormField.displayName = "FormField";

export { FormField };
