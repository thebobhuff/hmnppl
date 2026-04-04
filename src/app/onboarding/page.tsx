/**
 * Onboarding Page — /onboarding
 *
 * Full-screen page that renders the 5-step company onboarding wizard.
 * Centered layout consistent with the auth pages (no sidebar/shell).
 */
import type { Metadata } from "next";
import { OnboardingPageClient } from "./OnboardingPageClient";

export const metadata: Metadata = {
  title: "HMN/PPL — Setup Your Workspace",
  description: "Complete your company setup in a few quick steps",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark-slate px-4 py-12">
      <OnboardingPageClient />
    </div>
  );
}
