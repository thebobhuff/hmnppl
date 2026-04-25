/**
 * Meetings Page — List of upcoming and completed meetings.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { meetingsAPI, type MeetingResponse } from "@/lib/api/client";
import { Calendar, Clock, Users, Link2, FileText, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

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
        const res = await meetingsAPI.list(undefined, undefined, 100);
        if (active) setMeetings(res.meetings);
      } catch (error) {
        console.error("Failed to load meetings", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMeetings();
    return () => {
      active = false;
    };
  }, []);

  const upcoming = useMemo(() => meetings.filter((m) => m.status === "scheduled"), [meetings]);
  const completed = useMemo(
    () => meetings.filter((m) => ["completed", "cancelled", "no_show"].includes(m.status)),
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
              {upcoming.map((meeting) => (
                <Card key={meeting.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-text-primary">
                        {formatMeetingTitle(meeting)}
                      </h3>
                      <Badge variant="warning" className="mt-1">
                        {formatLabel(meeting.type)}
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
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(meeting.scheduled_at)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {meeting.duration_minutes ?? 30} minutes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {formatParticipants(meeting)}
                    </div>
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
              ))}
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
              {completed.map((meeting) => (
                <Card key={meeting.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-text-primary">
                        {formatMeetingTitle(meeting)}
                      </h3>
                      <Badge variant="success" className="mt-1">
                        {formatLabel(meeting.type)}
                      </Badge>
                    </div>
                    <span className="text-xs text-text-tertiary">{formatDate(meeting.scheduled_at)}</span>
                  </div>
                  {(meeting.ai_summary || meeting.notes || meeting.outcome) && (
                    <div className="mt-3 rounded-lg border border-border p-2">
                      <p className="text-xs font-medium text-text-secondary">Summary</p>
                      <p className="mt-1 text-xs text-text-tertiary">{formatSummary(meeting)}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </PageContainer>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMeetingTitle(meeting: MeetingResponse) {
  return `${formatLabel(meeting.type)} Meeting`;
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString();
}

function formatParticipants(meeting: MeetingResponse) {
  if (!meeting.participants?.length) return "No participants listed";
  return meeting.participants.map((p) => formatLabel(p.role)).join(", ");
}

function formatSummary(meeting: MeetingResponse) {
  if (meeting.outcome) return meeting.outcome;
  if (meeting.notes) return meeting.notes;
  if (meeting.ai_summary?.summary && typeof meeting.ai_summary.summary === "string") {
    return meeting.ai_summary.summary;
  }
  return "Summary captured.";
}
