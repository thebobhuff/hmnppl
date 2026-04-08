/**
 * Company service — get and update company settings.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface CompanySettingsResponse {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  country: string | null;
  region: string | null;
  subscription_tier: string;
  ai_confidence_threshold: number;
  dispute_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_step: number | null;
  settings: {
    notification_prefs?: Record<string, unknown>;
    feature_flags?: Record<string, boolean>;
    ai_monthly_budget_usd?: number;
    contacts?: {
      hr_email?: string;
      legal_email?: string;
    };
    location?: {
      primary_location?: string;
      state_jurisdiction?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export async function getCompanySettings(
  companyId: string,
): Promise<CompanySettingsResponse | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch company settings: ${error.message}`);
  }

  return data as CompanySettingsResponse;
}

export async function updateCompanySettings(
  companyId: string,
  updates: Partial<{
    name: string;
    industry: string | null;
    size: string | null;
    country: string | null;
    region: string | null;
    ai_confidence_threshold: number;
    dispute_enabled: boolean;
    settings: Record<string, unknown>;
  }>,
): Promise<CompanySettingsResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update company settings: ${error.message}`);
  }

  return data as CompanySettingsResponse;
}
