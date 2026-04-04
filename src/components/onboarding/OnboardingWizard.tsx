// ============================================
// HMN/PPL — Onboarding Wizard
// Container component managing 5-step wizard flow
// with progress indicator and step transitions
// ============================================

"use client";

import { useCallback } from "react";
import Image from "next/image";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FormStepIndicator, type StepItem } from "@/components/domain/FormStepIndicator";
import { StepCompanyInfo } from "./StepCompanyInfo";
import { StepInviteTeam } from "./StepInviteTeam";
import { StepConfigurePolicies } from "./StepConfigurePolicies";
import { StepAISettings } from "./StepAISettings";
import { StepReviewActivate } from "./StepReviewActivate";
import { useOnboardingStore } from "@/stores/onboarding-store";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const WIZARD_STEPS: StepItem[] = [
  { number: 1, label: "Company Info" },
  { number: 2, label: "Invite Team" },
  { number: 3, label: "Policies" },
  { number: 4, label: "AI Settings" },
  { number: 5, label: "Review" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OnboardingWizardProps {
  /** Company name pre-filled from signup (optional) */
  initialCompanyName?: string;
}

export function OnboardingWizard({ initialCompanyName }: OnboardingWizardProps) {
  const { currentStep, completedSteps, goToStep } = useOnboardingStore();

  // Progress percentage based on completed steps
  const progressPercent = (completedSteps.length / WIZARD_STEPS.length) * 100;

  const handleStepClick = useCallback(
    (step: number) => {
      goToStep(step);
    },
    [goToStep],
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Logo / Branding */}
      <div className="text-center">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="HMN/PPL"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          Set up your workspace in a few quick steps
        </p>
      </div>

      {/* Step indicator */}
      <FormStepIndicator
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Progress bar */}
      <ProgressBar
        value={progressPercent}
        size="sm"
        variant="default"
        showLabel
        labelPosition="right"
      />

      {/* Step content */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        {currentStep === 1 && (
          <StepCompanyInfo
            initialCompanyName={initialCompanyName}
            onNext={() => useOnboardingStore.getState().nextStep()}
          />
        )}
        {currentStep === 2 && (
          <StepInviteTeam
            onNext={() => useOnboardingStore.getState().nextStep()}
            onPrev={() => useOnboardingStore.getState().prevStep()}
          />
        )}
        {currentStep === 3 && (
          <StepConfigurePolicies
            onNext={() => useOnboardingStore.getState().nextStep()}
            onPrev={() => useOnboardingStore.getState().prevStep()}
          />
        )}
        {currentStep === 4 && (
          <StepAISettings
            onNext={() => useOnboardingStore.getState().nextStep()}
            onPrev={() => useOnboardingStore.getState().prevStep()}
          />
        )}
        {currentStep === 5 && <StepReviewActivate />}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-text-tertiary">
        Your progress is automatically saved. You can close this page and resume later.
      </p>
    </div>
  );
}
