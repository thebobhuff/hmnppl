/**
 * My Team — Manager's direct reports list.
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Users, Mail, MoreVertical, MessageSquare } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
}

export default function MyTeamPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "My Team" }]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setMembers([
        {
          id: "1",
          name: "Alice Johnson",
          email: "alice@company.com",
          role: "Engineer",
          department: "Engineering",
          status: "active",
        },
        {
          id: "2",
          name: "Bob Smith",
          email: "bob@company.com",
          role: "Designer",
          department: "Design",
          status: "active",
        },
        {
          id: "3",
          name: "Carol Williams",
          email: "carol@company.com",
          role: "Product Manager",
          department: "Product",
          status: "active",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer title="My Team" description="Manage your direct reports.">
      <div className="space-y-4">
        {/* Search and Actions */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild>
            <Link href="/conduct-interview">
              <MessageSquare className="mr-2 h-4 w-4" />
              Conduct Interview
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        )}

        {!loading && filteredMembers.length === 0 && (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No team members"
            description="You don't have any direct reports assigned."
          />
        )}

        {!loading && filteredMembers.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-slate-light">
                      <span className="text-sm font-medium text-text-primary">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{member.name}</p>
                      <p className="text-xs text-text-tertiary">{member.role}</p>
                    </div>
                  </div>
                  <button className="text-text-tertiary hover:text-text-primary">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
                  <Mail className="h-3 w-3" />
                  {member.email}
                </div>
                <div className="mt-3 flex gap-2">
                  <Badge variant={member.status === "active" ? "success" : "default"}>
                    {member.status}
                  </Badge>
                  <Badge variant="outline">{member.department}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
