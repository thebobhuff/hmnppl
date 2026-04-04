/**
 * Meetings Page — List of upcoming and completed meetings.
 */
"use client";

import { useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, Users, Link2, FileText } from "lucide-react";

const MOCK_MEETINGS = [
  {
    id: "1",
    title: "Disciplinary Review — J. Smith",
    type: "Written Warning",
    date: "2026-04-05",
    time: "2:00 PM",
    duration: 30,
    participants: ["Maria Garcia", "David Park", "John Smith"],
    status: "scheduled" as const,
    meetingLink: "https://zoom.us/j/123456",
    agenda: "Review attendance policy violation, discuss corrective actions.",
  },
  {
    id: "2",
    title: "PIP Follow-up — A. Williams",
    type: "PIP",
    date: "2026-04-05",
    time: "4:30 PM",
    duration: 45,
    participants: ["Maria Garcia", "Alice Williams"],
    status: "scheduled" as const,
    meetingLink: "https://teams.microsoft.com/l/meetup-join/abc",
    agenda: "Review PIP progress, discuss performance improvements.",
  },
  {
    id: "3",
    title: "Verbal Warning — B. Johnson",
    type: "Verbal Warning",
    date: "2026-04-01",
    time: "10:00 AM",
    duration: 20,
    participants: ["Maria Garcia", "Bob Johnson"],
    status: "completed" as const,
    meetingLink: null,
    summary: "Employee acknowledged the verbal warning and committed to improvement.",
  },
];

export default function MeetingsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Meetings" },
  ]);

  const upcoming = useMemo(
    () => MOCK_MEETINGS.filter((m) => m.status === "scheduled"),
    [],
  );
  const completed = useMemo(
    () => MOCK_MEETINGS.filter((m) => m.status === "completed"),
    [],
  );

  return (
    <PageContainer
      title="Meetings"
      description="Manage disciplinary meetings and AI-generated summaries."
    >
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
                        {meeting.title}
                      </h3>
                      <Badge variant="warning" className="mt-1">
                        {meeting.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {meeting.date} at {meeting.time}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {meeting.duration} minutes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {meeting.participants.join(", ")}
                    </div>
                    {meeting.meetingLink && (
                      <div className="flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        <a
                          href={meeting.meetingLink}
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
                        {meeting.title}
                      </h3>
                      <Badge variant="success" className="mt-1">
                        {meeting.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-text-tertiary">{meeting.date}</span>
                  </div>
                  {meeting.summary && (
                    <div className="mt-3 rounded-lg border border-border p-2">
                      <p className="text-xs font-medium text-text-secondary">Summary</p>
                      <p className="mt-1 text-xs text-text-tertiary">{meeting.summary}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
