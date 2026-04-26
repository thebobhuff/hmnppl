"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  Save,
  Users,
  Bell,
  Link2,
} from "lucide-react";

export default function CompanySettingsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Settings" },
    { label: "Company" },
  ]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <PageContainer
      title="Company Settings"
      description="Organization-level configuration and preferences."
    >
      <div className="space-y-6">
        {/* Company Information */}
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-brand-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">Company Information</h2>
              <p className="text-sm text-text-secondary">Basic company details.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary">Company Name</label>
              <Input defaultValue="Acme Corporation" className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">Legal Name</label>
              <Input defaultValue="Acme Corporation Inc." className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">DBA (if applicable)</label>
              <Input defaultValue="" className="mt-1" placeholder="Doing Business As" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">Tax ID / EIN</label>
              <Input defaultValue="12-3456789" className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">Industry</label>
              <select className="mt-1 w-full rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary">
                <option>Technology</option>
                <option>Healthcare</option>
                <option>Finance</option>
                <option>Manufacturing</option>
                <option>Retail</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <Phone className="h-5 w-5 text-brand-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">Contact Information</h2>
              <p className="text-sm text-text-secondary">How we can reach your company.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-primary">Primary Email</label>
              <Input defaultValue="hr@acmecorp.com" className="mt-1" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">Phone Number</label>
              <Input defaultValue="+1 (555) 123-4567" className="mt-1" type="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary">Address</label>
              <Input defaultValue="123 Business Ave, Suite 400" className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">City</label>
              <Input defaultValue="San Francisco" className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">State / Province</label>
              <Input defaultValue="California" className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">ZIP / Postal Code</label>
              <Input defaultValue="94102" className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">Country</label>
              <select className="mt-1 w-full rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary">
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
              </select>
            </div>
          </div>
        </Card>

        {/* HRIS Integration */}
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-brand-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">HRIS Integration</h2>
              <p className="text-sm text-text-secondary">Sync employee data with your HR system.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { name: "Workday", connected: false, description: "Sync employees and org structure" },
              { name: "BambooHR", connected: true, description: "Employee records sync" },
              { name: "ADP", connected: false, description: "Payroll and benefits data" },
              { name: "Gusto", connected: false, description: "Payroll integration" },
            ].map((integration) => (
              <div key={integration.name} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{integration.name}</p>
                    <p className="text-sm text-text-tertiary">{integration.description}</p>
                  </div>
                  <Badge variant={integration.connected ? "success" : "default"}>
                    {integration.connected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  {integration.connected ? "Configure" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Compliance Settings */}
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <Users className="h-5 w-5 text-brand-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">Compliance Settings</h2>
              <p className="text-sm text-text-secondary">EEOC, FLSA, and state-specific requirements.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Enable state-specific compliance rules", description: "Automatically apply state employment laws" },
              { label: "Require manager training before PIP", description: "Managers must complete training before issuing PIPs" },
              { label: "Auto-escalate to legal for terminations", description: "Flag cases requiring legal review before proceeding" },
              { label: "Send compliance reminders", description: "Email alerts for pending compliance deadlines" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-text-primary">{item.label}</p>
                  <p className="text-sm text-text-tertiary">{item.description}</p>
                </div>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
