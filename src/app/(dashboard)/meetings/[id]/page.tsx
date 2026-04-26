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
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Link2,
  Video,
  Edit3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { meetingsAPI } from "@/lib/api/client";

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
        if (active && res.meeting) {
          setMeeting(res.meeting);
        }
      } catch (err) {
        if (active) setError("Failed to load meeting");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMeeting();
    return () => { active = false; };
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

  if (error || !meeting) {
    return (
      <PageContainer title="Meeting Not Found">
        <Card className="p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-brand-warning" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            {error || "Meeting Not Found"}
          </h2>
          <p className="mt-2 text-text-secondary">
            The meeting you are looking for does not exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/meetings">Back to Meetings</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const scheduledDate = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null;

  return (
    <PageContainer
      title={meeting.type}
      description={meeting.agenda || `${meeting.status}`}
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
                  {meeting.status}
                </Badge>
                <Badge variant="default">{meeting.type}</Badge>
              </div>

              {meeting.agenda && (
                <>
                  <h3 className="mb-2 text-lg font-semibold text-text-primary">Agenda</h3>
                  <p className="text-text-secondary">{meeting.agenda}</p>
                </>
              )}

              {meeting.outcome && (
                <>
                  <h3 className="mb-2 mt-6 text-lg font-semibold text-text-primary">
                    Outcome
                  </h3>
                  <p className="text-text-secondary">{meeting.outcome}</p>
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
                {scheduledDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-text-tertiary" />
                    <span className="text-text-tertiary">Date:</span>
                    <span className="text-text-primary">{scheduledDate.toLocaleDateString()}</span>
                  </div>
                )}
                {scheduledDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    <span className="text-text-tertiary">Time:</span>
                    <span className="text-text-primary">{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {meeting.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    <span className="text-text-tertiary">Duration:</span>
                    <span className="text-text-primary">{meeting.duration_minutes} min</span>
                  </div>
                )}
              </div>
            </Card>

            {meeting.participants && meeting.participants.length > 0 && (
              <Card className="p-4">
                <h3 className="mb-3 font-medium text-text-primary">Participants</h3>
                <div className="space-y-2">
                  {meeting.participants.map((participant: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-slate-light">
                        <span className="text-xs font-medium text-text-primary">
                          {participant.user_id.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-text-primary">{participant.user_id}</span>
                        <p className="text-xs text-text-tertiary">{participant.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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
