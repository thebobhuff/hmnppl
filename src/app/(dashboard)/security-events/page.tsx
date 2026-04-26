"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Search,
  Loader2,
  Download,
  Filter,
  User,
  Settings,
  FileText,
  Login,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SecurityEvent {
  id: string;
  type: string;
  user_id: string;
  user_email?: string;
  action: string;
  details: string;
  ip_address?: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
}

const eventTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  login: { label: "Login", icon: Login, color: "text-brand-primary" },
  logout: { label: "Logout", icon: User, color: "text-text-secondary" },
  data_access: { label: "Data Access", icon: FileText, color: "text-brand-warning" },
  policy_change: { label: "Policy Change", icon: Settings, color: "text-brand-error" },
  user_management: { label: "User Management", icon: User, color: "text-brand-primary" },
  settings_change: { label: "Settings Change", icon: Settings, color: "text-text-secondary" },
};

const severityConfig: Record<string, { label: string; variant: "default" | "warning" | "error" }> = {
  low: { label: "Low", variant: "default" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "error" },
};

export default function SecurityEventsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Security Events" },
  ]);

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    async function loadEvents() {
      try {
        // Mock security events for demo
        const mockEvents: SecurityEvent[] = [
          {
            id: "1",
            type: "login",
            user_id: "user-1",
            user_email: "maria.garcia@company.com",
            action: "User logged in",
            details: "Successful login via Microsoft SSO",
            ip_address: "192.168.1.100",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            severity: "low",
          },
          {
            id: "2",
            type: "data_access",
            user_id: "user-2",
            user_email: "bob.smith@company.com",
            action: "Accessed employee records",
            details: "Viewed sensitive employee data",
            ip_address: "192.168.1.101",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            severity: "medium",
          },
          {
            id: "3",
            type: "policy_change",
            user_id: "user-1",
            user_email: "maria.garcia@company.com",
            action: "Updated policy",
            details: "Modified Attendance & Punctuality Policy",
            ip_address: "192.168.1.100",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            severity: "high",
          },
          {
            id: "4",
            type: "login",
            user_id: "user-3",
            user_email: "alice.williams@company.com",
            action: "Failed login attempt",
            details: "Incorrect password",
            ip_address: "10.0.0.50",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            severity: "medium",
          },
          {
            id: "5",
            type: "user_management",
            user_id: "user-1",
            user_email: "maria.garcia@company.com",
            action: "Invited new user",
            details: "Invited john.doe@company.com as HR_AGENT",
            ip_address: "192.168.1.100",
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            severity: "low",
          },
        ];
        if (active) setEvents(mockEvents);
      } catch (err) {
        console.error("Failed to load security events", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadEvents();
    return () => { active = false; };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || event.type === typeFilter;
      const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [events, searchQuery, typeFilter, severityFilter]);

  const stats = useMemo(() => ({
    total: events.length,
    highSeverity: events.filter((e) => e.severity === "high").length,
    todayEvents: events.filter((e) => {
      const today = new Date();
      const eventDate = new Date(e.timestamp);
      return eventDate.toDateString() === today.toDateString();
    }).length,
  }), [events]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <PageContainer
      title="Security Events"
      description="Audit trail and security monitoring."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Shield className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                  <p className="text-xs text-text-tertiary">Total Events</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                  <AlertTriangle className="h-5 w-5 text-brand-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.highSeverity}</p>
                  <p className="text-xs text-text-tertiary">High Severity</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <CheckCircle className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.todayEvents}</p>
                  <p className="text-xs text-text-tertiary">Today&apos;s Events</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Types</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="data_access">Data Access</option>
                <option value="policy_change">Policy Change</option>
                <option value="user_management">User Management</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            events.length === 0 ? (
              <Card className="p-8 text-center">
                <Shield className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Security Events
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Security events will appear here as they occur.
                </p>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Results Found
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Try adjusting your search or filters.
                </p>
              </Card>
            )
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const typeInfo = eventTypeConfig[event.type] || { label: event.type, icon: Shield, color: "text-text-secondary" };
                const severityInfo = severityConfig[event.severity] || { label: event.severity, variant: "default" as const };
                const Icon = typeInfo.icon;

                return (
                  <Card key={event.id} className="p-4 transition-colors hover:bg-card-hover">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light ${typeInfo.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-text-primary">{event.action}</span>
                          <Badge variant={severityInfo.variant}>{severityInfo.label}</Badge>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-text-secondary">{event.details}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.user_email || event.user_id}
                          </span>
                          {event.ip_address && (
                            <span>IP: {event.ip_address}</span>
                          )}
                          <span>{formatTime(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}