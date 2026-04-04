// ============================================
// HMN — FormStepIndicator
// Domain component for multi-step wizard progress
// Shows pending / current / completed states
// ============================================

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepItem {
  /** Unique step number (1-based) */
  number: number;
  /** Short label displayed below the indicator */
  label: string;
}

export interface FormStepIndicatorProps {
  /** Ordered list of steps */
  steps: StepItem[];
  /** Currently active step (1-based) */
  currentStep: number;
  /** Steps that have been completed */
  completedSteps: number[];
  /** Callback when user clicks a completed step */
  onStepClick?: (step: number) => void;
  /** Additional CSS class */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormStepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: FormStepIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = step.number === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <li key={step.number} className="flex flex-1 items-center">
              {/* Step circle + label */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.number)}
                className={cn(
                  "group flex flex-col items-center gap-1.5",
                  isClickable
                    ? "cursor-pointer"
                    : isCurrent
                      ? "cursor-default"
                      : "cursor-default",
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.number}: ${step.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
              >
                {/* Circle */}
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted &&
                      "border-brand-primary bg-brand-primary text-text-inverse",
                    isCurrent &&
                      !isCompleted &&
                      "border-brand-primary bg-transparent text-brand-primary",
                    !isCurrent &&
                      !isCompleted &&
                      "border-border bg-transparent text-text-tertiary",
                    isClickable && "hover:bg-brand-primary/10",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    step.number
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent && "text-brand-primary",
                    isCompleted && !isCurrent && "text-text-secondary",
                    !isCurrent && !isCompleted && "text-text-tertiary",
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                    isCompleted ? "bg-brand-primary" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
