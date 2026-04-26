"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  Loader2,
  Download,
  Calendar,
  Globe,
  Zap,
} from "lucide-react";

interface AnalyticsData {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  dailyActiveUsers: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  apiCallsToday: number;
  avgResponseTime: number;
  uptime: number;
  regionalData: Array<{ region: string; users: number; companies: number }>;
  growthTrend: Array<{ month: string; mrr: number; users: number }>;
}

export default function PlatformAnalyticsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Platform Analytics" },
  ]);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setData({
        totalCompanies: 127,
        activeCompanies: 112,
        totalUsers: 4580,
        dailyActiveUsers: 892,
        monthlyRecurringRevenue: 89400,
        churnRate: 2.3,
        apiCallsToday: 45892,
        avgResponseTime: 145,
        uptime: 99.97,
        regionalData: [
          { region: "North America", users: 2100, companies: 58 },
          { region: "Europe", users: 1450, companies: 42 },
          { region: "Asia Pacific", users: 780, companies: 18 },
          { region: "Latin America", users: 250, companies: 9 },
        ],
        growthTrend: [
          { month: "Nov", mrr: 72000, users: 3800 },
          { month: "Dec", mrr: 78500, users: 4100 },
          { month: "Jan", mrr: 82100, users: 4250 },
          { month: "Feb", mrr: 85800, users: 4400 },
          { month: "Mar", mrr: 89400, users: 4580 },
        ],
      });
      setLoading(false);
    }, 500);
  }, [dateRange]);

  const maxMrr = data ? Math.max(...data.growthTrend.map((g) => g.mrr), 1) : 1;

  return (
    <PageContainer
      title="Platform Analytics"
      description="Multi-tenant SaaS metrics and platform health."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : data ? (
        <>
          {/* Date Range */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-text-primary">Overview</h2>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {/* KPI Grid */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Globe className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.activeCompanies}</p>
                  <p className="text-xs text-text-tertiary">Active Companies / {data.totalCompanies} total</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-success/10">
                  <Users className="h-6 w-6 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-text-tertiary">Total Users</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-warning/10">
                  <DollarSign className="h-6 w-6 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">${(data.monthlyRecurringRevenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-text-tertiary">MRR</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-error/10">
                  <TrendingDown className="h-6 w-6 text-brand-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.churnRate}%</p>
                  <p className="text-xs text-text-tertiary">Monthly Churn</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* DAU Card */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <Activity className="h-5 w-5 text-brand-primary" />
                Daily Active Users
              </h3>
              <div className="flex items-end gap-4">
                <p className="text-4xl font-bold text-text-primary">{data.dailyActiveUsers.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-brand-success">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">12% vs last month</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-text-tertiary">
                {((data.dailyActiveUsers / data.totalUsers) * 100).toFixed(1)}% of total users
              </p>
            </Card>

            {/* API Calls */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <Zap className="h-5 w-5 text-brand-primary" />
                API Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.apiCallsToday.toLocaleString()}</p>
                  <p className="text-xs text-text-tertiary">API calls today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.avgResponseTime}ms</p>
                  <p className="text-xs text-text-tertiary">Avg response time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-success">{data.uptime}%</p>
                  <p className="text-xs text-text-tertiary">Uptime (30d)</p>
                </div>
              </div>
            </Card>

            {/* Revenue Trend */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Revenue Growth
              </h3>
              <div className="flex items-end gap-3">
                {data.growthTrend.map((item, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-brand-primary transition-all hover:bg-brand-primary/80"
                      style={{ height: `${(item.mrr / maxMrr) * 120}px`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-text-tertiary">{item.month}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Regional Distribution */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <Globe className="h-5 w-5 text-brand-primary" />
                Regional Distribution
              </h3>
              <div className="space-y-3">
                {data.regionalData.map((region) => (
                  <div key={region.region} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{region.region}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-text-primary">{region.users.toLocaleString()} users</span>
                      <span className="mx-2 text-text-tertiary">•</span>
                      <span className="text-sm text-text-tertiary">{region.companies} companies</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
            No Data Available
          </h3>
        </Card>
      )}
    </PageContainer>
  );
}