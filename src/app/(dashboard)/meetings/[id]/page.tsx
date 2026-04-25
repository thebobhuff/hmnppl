/**
 * Meeting Detail — View and manage a specific meeting.
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { meetingsAPI, type MeetingResponse } from "@/lib/api/client";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Link2,
  Video,
  Edit3,
} from "lucide-react";
import Link from "next/link";

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<MeetingResponse | null>(null);

  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Meetings", href: "/meetings" },
    { label: id ? `Meeting ${id}` : "Meeting" },
  ]);

  useEffect(() => {
    let active = true;
    async function loadMeeting() {
      try {
        const res = await meetingsAPI.get(id);
        if (active) setMeeting(res.meeting);
      } catch (error) {
        console.error("Failed to load meeting", error);
        if (active) setMeeting(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) loadMeeting();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Meeting Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (!meeting) {
    return (
      <PageContainer title="Meeting Not Found">
        <Card className="p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-brand-warning" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            Meeting Not Found
          </h2>
          <p className="mt-2 text-text-secondary">
            The requested meeting does not exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/meetings">Back to Meetings</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${formatLabel(meeting.type)} Meeting`}
      description={`${formatLabel(meeting.type)} • ${formatDateTime(meeting.scheduled_at)}`}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/meetings">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Meetings
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant={meeting.status === "scheduled" ? "warning" : "success"}>
                  {formatLabel(meeting.status)}
                </Badge>
                <Badge variant="default">{formatLabel(meeting.type)}</Badge>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-text-primary">Agenda</h3>
              <p className="text-text-secondary">{meeting.agenda ?? "No agenda recorded."}</p>

              {(meeting.ai_summary || meeting.notes || meeting.outcome) && (
                <>
                  <h3 className="mb-2 mt-6 text-lg font-semibold text-text-primary">
                    Summary
                  </h3>
                  <p className="text-text-secondary">{formatSummary(meeting)}</p>
                </>
              )}
            </Card>

            {meeting.status === "scheduled" && (
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-text-primary">Actions</h3>
                <div className="flex gap-3">
                  {meeting.meeting_link && (
                    <Button asChild>
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Join Meeting
                      </a>
                    </Button>
                  )}
                  <Button variant="outline">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Date:</span>
                  <span className="text-text-primary">{formatDate(meeting.scheduled_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Time:</span>
                  <span className="text-text-primary">{formatTime(meeting.scheduled_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Duration:</span>
                  <span className="text-text-primary">{meeting.duration_minutes ?? 30} min</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Participants</h3>
              <div className="space-y-2">
                {(meeting.participants ?? []).map((participant, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-slate-light">
                      <span className="text-xs font-medium text-text-primary">
                        {participant.role
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <span className="text-sm text-text-primary">{formatLabel(participant.role)}</span>
                  </div>
                ))}
                {!meeting.participants?.length && (
                  <p className="text-sm text-text-tertiary">No participants listed.</p>
                )}
              </div>
            </Card>

            {meeting.meeting_link && (
              <Card className="p-4">
                <h3 className="mb-3 font-medium text-text-primary">Meeting Link</h3>
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
                >
                  <Link2 className="h-4 w-4" />
                  Join Video Call
                </a>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString();
}

function formatTime(value: string | null) {
  if (!value) return "Time TBD";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString();
}

function formatSummary(meeting: MeetingResponse) {
  if (meeting.outcome) return meeting.outcome;
  if (meeting.notes) return meeting.notes;
  if (meeting.ai_summary?.summary && typeof meeting.ai_summary.summary === "string") {
    return meeting.ai_summary.summary;
  }
  return "Summary captured.";
}
