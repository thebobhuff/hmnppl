// ============================================
// HMN — Step 1: Company Info
// Collects company name, industry, size, country, region
// ============================================

"use client";

import { useCallback, useState } from "react";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useOnboardingStore } from "@/stores/onboarding-store";
import {
  companyInfoSchema,
  INDUSTRY_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  COUNTRY_OPTIONS,
  type CompanyInfo,
} from "@/lib/validations/onboarding";

// ---------------------------------------------------------------------------
// Select option builders
// ---------------------------------------------------------------------------

const industryOptions = INDUSTRY_OPTIONS.map((opt) => ({
  value: opt,
  label: opt,
}));

const sizeOptions = COMPANY_SIZE_OPTIONS.map((opt) => ({
  value: opt,
  label:
    opt === "1-10"
      ? "1–10 employees"
      : opt === "11-50"
        ? "11–50 employees"
        : opt === "51-200"
          ? "51–200 employees"
          : opt === "201-500"
            ? "201–500 employees"
            : "500+ employees",
}));

const countryOptions = COUNTRY_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StepCompanyInfoProps {
  /** Called when the step is valid and the user clicks Continue */
  onNext: () => void;
  /** Pre-fill company name from signup (if available) */
  initialCompanyName?: string;
}

export function StepCompanyInfo({ onNext, initialCompanyName }: StepCompanyInfoProps) {
  const { companyInfo, setCompanyInfo } = useOnboardingStore();
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyInfo, string>>>({});

  // Pre-fill company name from signup if store is empty
  const currentName = companyInfo.name || initialCompanyName || "";

  const handleChange = useCallback(
    (field: keyof CompanyInfo, value: string) => {
      setCompanyInfo({ [field]: value });
      // Clear error for this field
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [setCompanyInfo],
  );

  const handleContinue = useCallback(() => {
    const data: CompanyInfo = {
      ...companyInfo,
      name: currentName,
    };

    const result = companyInfoSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CompanyInfo, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CompanyInfo;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    // Ensure the store has the latest name (in case it came from initialCompanyName)
    setCompanyInfo({ name: currentName });
    setErrors({});
    onNext();
  }, [companyInfo, currentName, setCompanyInfo, onNext]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10">
          <Building2 className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Company Information
          </h2>
          <p className="text-sm text-text-secondary">
            Tell us about your organization so we can tailor the experience
          </p>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Company Name */}
        <FormField
          label="Company Name"
          required
          htmlFor="company-name"
          error={errors.name}
        >
          <Input
            id="company-name"
            type="text"
            placeholder="Acme Corporation"
            value={currentName}
            onChange={(e) => handleChange("name", e.target.value)}
            variant={errors.name ? "error" : "default"}
            aria-invalid={!!errors.name}
          />
        </FormField>

        {/* Industry */}
        <FormField
          label="Industry"
          required
          htmlFor="company-industry"
          error={errors.industry}
        >
          <Select
            id="company-industry"
            options={industryOptions}
            value={companyInfo.industry}
            onValueChange={(value) => handleChange("industry", value)}
            error={!!errors.industry}
            placeholder="Select your industry"
          />
        </FormField>

        {/* Company Size */}
        <FormField
          label="Company Size"
          required
          htmlFor="company-size"
          error={errors.size}
        >
          <Select
            id="company-size"
            options={sizeOptions}
            value={companyInfo.size}
            onValueChange={(value) => handleChange("size", value)}
            error={!!errors.size}
            placeholder="Select company size"
          />
        </FormField>

        {/* Country */}
        <FormField
          label="Country"
          required
          htmlFor="company-country"
          error={errors.country}
        >
          <Select
            id="company-country"
            options={countryOptions}
            value={companyInfo.country}
            onValueChange={(value) => handleChange("country", value)}
            error={!!errors.country}
            placeholder="Select your country"
            searchable
          />
        </FormField>

        {/* Region / State */}
        <FormField
          label="Region / State"
          required
          htmlFor="company-region"
          error={errors.region}
          hint="State, province, or region"
        >
          <Input
            id="company-region"
            type="text"
            placeholder="California"
            value={companyInfo.region}
            onChange={(e) => handleChange("region", e.target.value)}
            variant={errors.region ? "error" : "default"}
            aria-invalid={!!errors.region}
          />
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
