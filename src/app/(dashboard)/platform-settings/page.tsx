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
  Settings,
  Building,
  Palette,
  Bell,
  Shield,
  Plug,
  Key,
  Database,
  Loader2,
  Save,
} from "lucide-react";

type SettingsTab = "company" | "branding" | "notifications" | "integrations" | "security" | "api";

export default function PlatformSettingsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Platform Settings" },
  ]);

  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: "company" as const, label: "Company", icon: Building },
    { id: "branding" as const, label: "Branding", icon: Palette },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "integrations" as const, label: "Integrations", icon: Plug },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "api" as const, label: "API Keys", icon: Key },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <PageContainer
      title="Platform Settings"
      description="System-wide configuration and settings."
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-brand-primary text-text-inverse"
                        : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card className="p-6">
            {activeTab === "company" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">Company Profile</h2>
                  <p className="mt-1 text-sm text-text-secondary">Manage your company information.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Company Name</label>
                    <Input defaultValue="HMN/PPL" className="mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Website</label>
                    <Input defaultValue="https://hmnppl.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Contact Email</label>
                    <Input defaultValue="support@hmnppl.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Support Phone</label>
                    <Input defaultValue="+1 (555) 123-4567" className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "branding" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">Branding</h2>
                  <p className="mt-1 text-sm text-text-secondary">Customize your platform appearance.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Primary Color</label>
                    <div className="mt-1 flex gap-2">
                      <div className="h-10 w-10 rounded-md border border-border bg-brand-primary" />
                      <Input defaultValue="#4F46E5" className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Logo URL</label>
                    <Input defaultValue="/logo.png" className="mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Email Header Color</label>
                    <div className="mt-1 flex gap-2">
                      <div className="h-10 w-10 rounded-md border border-border bg-brand-slate" />
                      <Input defaultValue="#1E293B" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">Notifications</h2>
                  <p className="mt-1 text-sm text-text-secondary">Configure email and in-app notifications.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "New incident reported", description: "Email HR when a new incident is submitted" },
                    { label: "Document signed", description: "Notify relevant parties when a document is signed" },
                    { label: "AI evaluation complete", description: "Send notification when AI evaluation finishes" },
                    { label: "Weekly digest", description: "Send weekly summary of platform activity" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium text-text-primary">{item.label}</p>
                        <p className="text-sm text-text-tertiary">{item.description}</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">Integrations</h2>
                  <p className="mt-1 text-sm text-text-secondary">Connect with third-party services.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { name: "Slack", status: "connected", description: "Send notifications to Slack channels" },
                    { name: "Microsoft Teams", status: "disconnected", description: "Sync with Teams calendar" },
                    { name: "Google Workspace", status: "connected", description: "Sync calendar and contacts" },
                    { name: "Okta SSO", status: "disconnected", description: "Single sign-on with Okta" },
                  ].map((integration) => (
                    <Card key={integration.name} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{integration.name}</p>
                          <p className="text-sm text-text-tertiary">{integration.description}</p>
                        </div>
                        <Badge variant={integration.status === "connected" ? "success" : "default"}>
                          {integration.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        {integration.status === "connected" ? "Configure" : "Connect"}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">Security</h2>
                  <p className="mt-1 text-sm text-text-secondary">Configure security settings and policies.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Require MFA for all users", enabled: true },
                    { label: "Enforce strong passwords", enabled: true },
                    { label: "Session timeout after 8 hours", enabled: false },
                    { label: "IP allowlist enabled", enabled: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium text-text-primary">{item.label}</p>
                      </div>
                      <Switch defaultChecked={item.enabled} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">API Keys</h2>
                  <p className="mt-1 text-sm text-text-secondary">Manage API access keys.</p>
                </div>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-text-primary">sk_live_xxxxxxxxxxxx</p>
                      <p className="text-xs text-text-tertiary">Created: Jan 15, 2026</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Active</Badge>
                      <Button variant="outline" size="sm">Revoke</Button>
                    </div>
                  </div>
                </Card>
                <Button variant="outline">
                  <Key className="mr-2 h-4 w-4" />
                  Generate New Key
                </Button>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
