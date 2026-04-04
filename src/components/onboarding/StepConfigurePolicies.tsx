// ============================================
// HMN — Step 3: Configure Policies
// Choose from AI policy templates (minimum 1 required)
// ============================================

"use client";

import { useCallback, useState } from "react";
import { Shield, Clock, UserCheck, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { POLICY_TEMPLATES, policySelectionSchema } from "@/lib/validations/onboarding";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Policy template icon mapping
// ---------------------------------------------------------------------------

const POLICY_ICONS: Record<string, React.ReactNode> = {
  "attendance-punctuality": <Clock className="h-6 w-6 text-brand-primary" />,
  "workplace-conduct": <UserCheck className="h-6 w-6 text-brand-primary" />,
  "performance-management": <TrendingUp className="h-6 w-6 text-brand-primary" />,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StepConfigurePoliciesProps {
  onNext: () => void;
  onPrev: () => void;
}

export function StepConfigurePolicies({ onNext, onPrev }: StepConfigurePoliciesProps) {
  const { selectedPolicies, togglePolicy } = useOnboardingStore();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(
    (policyId: string) => {
      togglePolicy(policyId);
      // Clear error when user interacts
      if (error) setError(null);
    },
    [togglePolicy, error],
  );

  const handleContinue = useCallback(() => {
    const result = policySelectionSchema.safeParse(selectedPolicies);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setError(firstIssue?.message ?? "Please select at least one policy");
      return;
    }

    setError(null);
    onNext();
  }, [selectedPolicies, onNext]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10">
          <Shield className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Configure Policies
          </h2>
          <p className="text-sm text-text-secondary">
            Select AI policy templates for your organization. You can customize these
            later.
          </p>
        </div>
      </div>

      {/* Policy template cards */}
      <div className="space-y-3">
        {POLICY_TEMPLATES.map((template) => {
          const isSelected = selectedPolicies.includes(template.id);

          return (
            <Card
              key={template.id}
              clickable
              hoverable
              className={cn(
                "transition-all",
                isSelected && "border-brand-primary bg-brand-primary/5",
              )}
              onClick={() => handleToggle(template.id)}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={template.title}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  handleToggle(template.id);
                }
              }}
            >
              <CardContent className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isSelected ? "bg-brand-primary/20" : "bg-brand-slate",
                  )}
                >
                  {POLICY_ICONS[template.id] ?? (
                    <Shield className="h-6 w-6 text-brand-primary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold text-text-primary">
                    {template.title}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {template.description}
                  </p>
                </div>

                {/* Checkbox */}
                <div className="shrink-0 pt-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(template.id)}
                    aria-label={`Select ${template.title}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-lg border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-text-tertiary">
        Select at least one policy. You can add, remove, or customize policies at any time
        from your settings.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onPrev}>
          Back
        </Button>
        <Button type="button" size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
