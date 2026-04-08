/**
 * Platform Settings — Super Admin configuration.
 */

"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Key, Globe, Bell, Shield } from "lucide-react";

export default function PlatformSettingsPage() {
  usePageBreadcrumbs([{ label: "Platform Settings" }]);

  return (
    <PageContainer
      title="Platform Settings"
      description="Configure platform-wide settings."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">General Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Platform Name
              </label>
              <Input defaultValue="AI HR Platform" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Default Timezone
              </label>
              <Badge variant="outline">America/Los_Angeles (PST)</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Key className="h-5 w-5 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">API Configuration</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                OpenRouter API Key
              </label>
              <Input type="password" defaultValue="sk-or-..." className="font-mono" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Default AI Model
              </label>
              <Badge variant="default">stepfun/step-3.5-flash:free</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border py-2">
              <div>
                <p className="text-sm font-medium text-text-primary">Email Alerts</p>
                <p className="text-xs text-text-tertiary">
                  Send email for critical events
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-text-primary">Slack Integration</p>
                <p className="text-xs text-text-tertiary">Post alerts to Slack channel</p>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
