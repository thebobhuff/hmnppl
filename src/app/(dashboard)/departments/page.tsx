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
  Building2,
  Search,
  Loader2,
  Plus,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
  head_name?: string;
  head_id?: string;
  employee_count: number;
  health_score?: number;
  parent_id?: string;
}

export default function DepartmentsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Departments" },
  ]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDepartments() {
      try {
        // Mock departments for demo
        const mockDepartments: Department[] = [
          {
            id: "dept-1",
            name: "Engineering",
            head_name: "David Chen",
            head_id: "user-1",
            employee_count: 45,
            health_score: 87,
          },
          {
            id: "dept-2",
            name: "Sales",
            head_name: "Sarah Johnson",
            head_id: "user-2",
            employee_count: 30,
            health_score: 72,
          },
          {
            id: "dept-3",
            name: "Human Resources",
            head_name: "Maria Garcia",
            head_id: "user-3",
            employee_count: 8,
            health_score: 94,
          },
          {
            id: "dept-4",
            name: "Marketing",
            head_name: "John Smith",
            head_id: "user-4",
            employee_count: 15,
            health_score: 81,
          },
          {
            id: "dept-5",
            name: "Finance",
            head_name: "Lisa Wong",
            head_id: "user-5",
            employee_count: 12,
            health_score: 90,
          },
        ];
        if (active) setDepartments(mockDepartments);
      } catch (err) {
        console.error("Failed to load departments", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDepartments();
    return () => { active = false; };
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.head_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-brand-success";
    if (score >= 60) return "text-brand-warning";
    return "text-brand-error";
  };

  const stats = useMemo(() => ({
    total: departments.length,
    totalEmployees: departments.reduce((sum, d) => sum + d.employee_count, 0),
    avgHealth: departments.length > 0
      ? Math.round(departments.reduce((sum, d) => sum + (d.health_score || 0), 0) / departments.length)
      : 0,
  }), [departments]);

  return (
    <PageContainer
      title="Departments"
      description="Manage organizational structure and departments."
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
                  <Building2 className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                  <p className="text-xs text-text-tertiary">Total Departments</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <Users className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalEmployees}</p>
                  <p className="text-xs text-text-tertiary">Total Employees</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                  <Building2 className="h-5 w-5 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.avgHealth}%</p>
                  <p className="text-xs text-text-tertiary">Avg Health Score</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </div>

          {/* Department Grid */}
          {filteredDepartments.length === 0 ? (
            departments.length === 0 ? (
              <Card className="p-8 text-center">
                <Building2 className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Departments
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Create your first department to get started.
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Results Found
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Try adjusting your search query.
                </p>
              </Card>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDepartments.map((dept) => (
                <Card key={dept.id} className="p-4 transition-colors hover:bg-card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-slate-light">
                        <Building2 className="h-6 w-6 text-text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-text-primary">
                          {dept.name}
                        </h3>
                        <p className="text-sm text-text-tertiary">
                          Head: {dept.head_name || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {dept.employee_count} employees
                      </span>
                    </div>
                    {dept.health_score && (
                      <div className={`font-semibold ${getHealthColor(dept.health_score)}`}>
                        {dept.health_score}% health
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/employees?department=${dept.id}`}>
                        View Employees
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}