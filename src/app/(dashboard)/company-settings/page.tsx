/**
 * Company Settings — Company Admin configuration.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { companySettingsAPI, type CompanySettingsResponse } from "@/lib/api/client";
import { Building, Users, Save, Globe, Shield, Loader2 } from "lucide-react";

interface CompanySettingsForm {
  name: string;
  industry: string;
  size: string;
  country: string;
  region: string;
  ai_confidence_threshold: string;
  ai_monthly_budget_usd: string;
  dispute_enabled: boolean;
  hr_email: string;
  legal_email: string;
  primary_location: string;
  state_jurisdiction: string;
}

function toForm(company: CompanySettingsResponse): CompanySettingsForm {
  return {
    name: company.name || "",
    industry: company.industry || "",
    size: company.size || "",
    country: company.country || "",
    region: company.region || "",
    ai_confidence_threshold: String(company.ai_confidence_threshold ?? 0.9),
    ai_monthly_budget_usd: String(company.settings.ai_monthly_budget_usd ?? 50),
    dispute_enabled: company.dispute_enabled,
    hr_email: company.settings.contacts?.hr_email || "",
    legal_email: company.settings.contacts?.legal_email || "",
    primary_location: company.settings.location?.primary_location || "",
    state_jurisdiction: company.settings.location?.state_jurisdiction || "",
  };
}

export default function CompanySettingsPage() {
  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Company Settings" },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<CompanySettingsResponse | null>(null);
  const [form, setForm] = useState<CompanySettingsForm | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await companySettingsAPI.get();
        setCompany(data.company);
        setForm(toForm(data.company));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const hasChanges = useMemo(() => {
    if (!company || !form) return false;
    return JSON.stringify(form) !== JSON.stringify(toForm(company));
  }, [company, form]);

  const isValid = useMemo(() => {
    const threshold = Number(form?.ai_confidence_threshold ?? 0);
    const budget = Number(form?.ai_monthly_budget_usd ?? 0);
    return !!form?.name.trim() && threshold >= 0 && threshold <= 1 && budget >= 0;
  }, [form]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const result = await companySettingsAPI.update({
        name: form.name,
        industry: form.industry || null,
        size: form.size || null,
        country: form.country || null,
        region: form.region || null,
        ai_confidence_threshold: Number(form.ai_confidence_threshold || 0.9),
        dispute_enabled: form.dispute_enabled,
        settings: {
          ai_monthly_budget_usd: Number(form.ai_monthly_budget_usd || 0),
          contacts: {
            hr_email: form.hr_email,
            legal_email: form.legal_email,
          },
          location: {
            primary_location: form.primary_location,
            state_jurisdiction: form.state_jurisdiction,
          },
        },
      });
      setCompany(result.company);
      setForm(toForm(result.company));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form || !company) {
    return (
      <PageContainer title="Company Settings" description="Loading company settings...">
        <div className="grid gap-4">
          <div className="h-40 animate-pulse rounded-lg bg-brand-slate-light" />
          <div className="h-40 animate-pulse rounded-lg bg-brand-slate-light" />
          <div className="h-40 animate-pulse rounded-lg bg-brand-slate-light" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Company Settings"
      description="Configure your organization settings."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Building className="h-5 w-5 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">
              Company Information
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Company Name
              </label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Industry
              </label>
              <Input
                value={form.industry}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, industry: e.target.value } : prev))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Company Size
              </label>
              <Input
                value={form.size}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, size: e.target.value } : prev))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Subscription
              </label>
              <Badge variant="default">{company.subscription_tier}</Badge>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Onboarding
              </label>
              <Badge variant={company.onboarding_completed ? "success" : "outline"}>
                {company.onboarding_completed
                  ? "Completed"
                  : `Step ${company.onboarding_step ?? 1}`}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">
              Location & Jurisdiction
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Primary Location
              </label>
              <Input
                value={form.primary_location}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, primary_location: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Country
              </label>
              <Input
                value={form.country}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, country: e.target.value.toUpperCase() } : prev,
                  )
                }
                maxLength={2}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Region
              </label>
              <Input
                value={form.region}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, region: e.target.value } : prev))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-text-primary">
                State Jurisdiction
              </label>
              <Input
                value={form.state_jurisdiction}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, state_jurisdiction: e.target.value } : prev,
                  )
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">HR Contacts</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                HR Director Email
              </label>
              <Input
                type="email"
                value={form.hr_email}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, hr_email: e.target.value } : prev))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Legal Contact Email
              </label>
              <Input
                type="email"
                value={form.legal_email}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, legal_email: e.target.value } : prev,
                  )
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">
              AI & Risk Controls
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                AI Confidence Threshold
              </label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={form.ai_confidence_threshold}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, ai_confidence_threshold: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                AI Monthly Budget (USD)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.ai_monthly_budget_usd}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, ai_monthly_budget_usd: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4 sm:col-span-2">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Employee Disputes Enabled
                </p>
                <p className="text-xs text-text-tertiary">
                  Allow employees to dispute AI-generated documents.
                </p>
              </div>
              <Button
                variant={form.dispute_enabled ? "success" : "outline"}
                onClick={() =>
                  setForm((prev) =>
                    prev ? { ...prev, dispute_enabled: !prev.dispute_enabled } : prev,
                  )
                }
              >
                {form.dispute_enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setForm(toForm(company))}
            disabled={!hasChanges || saving}
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || !isValid || saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
