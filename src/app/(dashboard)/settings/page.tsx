/**
 * Settings Page — Tabbed settings for Company, Profile, Notifications, AI.
 */
"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AICostTracker } from "@/components/domain/AICostTracker";
import { ReminderPanel } from "@/components/domain/ReminderPanel";
import { Settings, Building2, User, Bell, Brain, Shield, Save } from "lucide-react";

type TabKey = "company" | "profile" | "notifications" | "ai";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "company", label: "Company", icon: <Building2 className="h-4 w-4" /> },
  { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { key: "ai", label: "AI Configuration", icon: <Brain className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("company");

  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Settings" },
  ]);

  return (
    <PageContainer
      title="Settings"
      description="Manage your account and platform configuration."
    >
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Sidebar */}
        <nav className="flex flex-col gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-text-secondary hover:bg-brand-slate-light hover:text-text-primary"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div>
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "ai" && <AISettings />}
        </div>
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Company Settings
// ---------------------------------------------------------------------------

function CompanySettings() {
  return (
    <div className="grid gap-6">
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
          <Building2 className="h-5 w-5" />
          Company Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Company Name
            </label>
            <Input defaultValue="Acme Corp" className="mt-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Industry
            </label>
            <Select
              value="technology"
              onValueChange={() => {}}
              placeholder="Select industry..."
              options={[
                { value: "technology", label: "Technology" },
                { value: "healthcare", label: "Healthcare" },
                { value: "finance", label: "Finance" },
                { value: "education", label: "Education" },
                { value: "retail", label: "Retail" },
                { value: "manufacturing", label: "Manufacturing" },
                { value: "other", label: "Other" },
              ]}
              className="mt-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Company Size
            </label>
            <Select
              value="11-50"
              onValueChange={() => {}}
              placeholder="Select size..."
              options={[
                { value: "1-10", label: "1-10 employees" },
                { value: "11-50", label: "11-50 employees" },
                { value: "51-200", label: "51-200 employees" },
                { value: "201-500", label: "201-500 employees" },
                { value: "500+", label: "500+ employees" },
              ]}
              className="mt-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Country</label>
            <Select
              value="US"
              onValueChange={() => {}}
              placeholder="Select country..."
              options={[
                { value: "US", label: "United States" },
                { value: "CA", label: "Canada" },
                { value: "UK", label: "United Kingdom" },
                { value: "AU", label: "Australia" },
              ]}
              className="mt-2"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button>
            <Save className="mr-1.5 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
          <Shield className="h-5 w-5" />
          Security
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Microsoft SSO</p>
              <p className="text-xs text-text-tertiary">
                Allow employees to sign in with Azure AD.
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Google SSO</p>
              <p className="text-xs text-text-tertiary">
                Allow employees to sign in with Google Workspace.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Email/Password</p>
              <p className="text-xs text-text-tertiary">
                Allow traditional email and password login.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Settings
// ---------------------------------------------------------------------------

function ProfileSettings() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
        <User className="h-5 w-5" />
        Profile Settings
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary">
            First Name
          </label>
          <Input defaultValue="Maria" className="mt-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary">Last Name</label>
          <Input defaultValue="Garcia" className="mt-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary">Email</label>
          <Input defaultValue="maria@acme.com" type="email" className="mt-2" disabled />
          <p className="mt-1 text-xs text-text-tertiary">
            Contact your administrator to change email.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary">Phone</label>
          <Input defaultValue="+1 (555) 123-4567" className="mt-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary">Job Title</label>
          <Input defaultValue="HR Specialist" className="mt-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary">Role</label>
          <div className="mt-2">
            <Badge variant="outline">HR Agent</Badge>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button>
          <Save className="mr-1.5 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Notification Settings
// ---------------------------------------------------------------------------

function NotificationSettings() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
        <Bell className="h-5 w-5" />
        Notification Preferences
      </h2>
      <div className="space-y-4">
        <NotificationToggle
          title="New Incidents Reported"
          description="Receive a notification when a manager reports a new incident."
          defaultChecked
        />
        <NotificationToggle
          title="AI Evaluation Complete"
          description="Notified when AI finishes evaluating an incident."
          defaultChecked
        />
        <NotificationToggle
          title="Document Approved"
          description="Notified when an HR agent approves a disciplinary document."
          defaultChecked
        />
        <NotificationToggle
          title="Meeting Scheduled"
          description="Notified when a disciplinary meeting is scheduled."
          defaultChecked
        />
        <NotificationToggle
          title="Document Awaiting Signature"
          description="Remind employees when a document requires their signature."
          defaultChecked
        />
        <NotificationToggle
          title="Document Signed"
          description="Notified when an employee signs a document."
          defaultChecked
        />
        <NotificationToggle
          title="Dispute Submitted"
          description="Notified when an employee disputes a document."
          defaultChecked
        />
        <NotificationToggle
          title="AI Budget Alerts"
          description="Notified when AI spending reaches 50%, 80%, or 100% of monthly budget."
          defaultChecked
        />
        <NotificationToggle
          title="Reminder: 24h Before Meeting"
          description="Reminder notification 24 hours before a scheduled meeting."
          defaultChecked
        />
        <NotificationToggle
          title="Reminder: 72h Before Signature Deadline"
          description="Reminder notification 72 hours before a document signature deadline."
          defaultChecked
        />
      </div>
    </Card>
  );
}

function NotificationToggle({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Configuration
// ---------------------------------------------------------------------------

function AISettings() {
  return (
    <div className="grid gap-6">
      <AICostTracker />

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
          <Brain className="h-5 w-5" />
          AI Behavior
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Default Confidence Threshold
            </label>
            <p className="text-xs text-text-tertiary">
              Minimum AI confidence required to auto-generate documents.
            </p>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="range"
                min={50}
                max={99}
                defaultValue={90}
                className="flex-1 accent-brand-primary"
              />
              <span className="text-lg font-bold text-brand-primary">90%</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Auto-Generate Documents
              </p>
              <p className="text-xs text-text-tertiary">
                Automatically generate disciplinary documents when confidence exceeds
                threshold.
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Allow Employee Disputes
              </p>
              <p className="text-xs text-text-tertiary">
                Show dispute button on document signing screen.
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">
                AI Meeting Summaries
              </p>
              <p className="text-xs text-text-tertiary">
                Generate AI summaries after disciplinary meetings.
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Monthly AI Budget
            </label>
            <p className="text-xs text-text-tertiary">
              Maximum monthly spend on AI services. Calls are blocked when exceeded.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-text-tertiary">$</span>
              <Input defaultValue="50.00" type="number" step="0.01" className="w-32" />
              <span className="text-xs text-text-tertiary">per month</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button>
            <Save className="mr-1.5 h-4 w-4" />
            Save AI Settings
          </Button>
        </div>
      </Card>

      <ReminderPanel />
    </div>
  );
}
