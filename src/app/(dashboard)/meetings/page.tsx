/**
 * Meetings Page ΓÇö List of upcoming and completed meetings.
 */
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, Calendar, Clock, Users, Link2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { meetingsAPI, type MeetingResponse } from "@/lib/api/client";

export default function MeetingsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Meetings" },
  ]);

  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadMeetings() {
      try {
        const res = await meetingsAPI.list(undefined, undefined, 50);
        if (active) setMeetings(res.meetings);
      } catch (err) {
        console.error("Failed to load meetings", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMeetings();
    return () => { active = false; };
  }, []);

  const upcoming = useMemo(
    () => meetings.filter((m) => m.status === "scheduled"),
    [meetings],
  );
  const completed = useMemo(
    () => meetings.filter((m) => m.status === "completed"),
    [meetings],
  );

  return (
    <PageContainer
      title="Meetings"
      description="Manage disciplinary meetings and AI-generated summaries."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Upcoming */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
              <Calendar className="h-5 w-5 text-brand-primary" />
              Upcoming Meetings
            </h2>
            {upcoming.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title="No upcoming meetings"
                  description="Scheduled meetings will appear here."
                  icon={<Calendar className="h-8 w-8" />}
                />
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((meeting) => {
                  const scheduledDate = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null;
                  return (
                    <Card key={meeting.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-text-primary">
                            {meeting.type}
                          </h3>
                          <Badge variant="warning" className="mt-1">
                            {meeting.status}
                          </Badge>
                        </div>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/meetings/${meeting.id}`}>
                            View
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs text-text-tertiary">
                        {scheduledDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {meeting.duration_minutes && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {meeting.duration_minutes} minutes
                          </div>
                        )}
                        {meeting.participants && meeting.participants.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {meeting.participants.map(p => p.user_id).join(", ")}
                          </div>
                        )}
                        {meeting.meeting_link && (
                          <div className="flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5" />
                            <a
                              href={meeting.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-primary hover:underline"
                            >
                              Join Meeting
                            </a>
                          </div>
                        )}
                      </div>
                      {meeting.agenda && (
                        <div className="mt-3 rounded-lg border border-border p-2">
                          <p className="text-xs font-medium text-text-secondary">Agenda</p>
                          <p className="mt-1 text-xs text-text-tertiary">{meeting.agenda}</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
              <FileText className="h-5 w-5 text-brand-success" />
              Completed Meetings
            </h2>
            {completed.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title="No completed meetings"
                  description="Meeting summaries will appear here."
                  icon={<FileText className="h-8 w-8" />}
                />
              </Card>
            ) : (
              <div className="grid gap-3">
                {completed.map((meeting) => {
                  const scheduledDate = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null;
                  return (
                    <Card key={meeting.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-text-primary">
                            {meeting.type}
                          </h3>
                          <Badge variant="success" className="mt-1">
                            {meeting.status}
                          </Badge>
                        </div>
                        {scheduledDate && (
                          <span className="text-xs text-text-tertiary">{scheduledDate.toLocaleDateString()}</span>
                        )}
                      </div>
                      {meeting.outcome && (
                        <div className="mt-3 rounded-lg border border-border p-2">
                          <p className="text-xs font-medium text-text-secondary">Outcome</p>
                          <p className="mt-1 text-xs text-text-tertiary">{meeting.outcome}</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
