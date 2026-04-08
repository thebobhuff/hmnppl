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
  Users,
  Link2,
  Video,
  FileText,
  CheckCircle,
  XCircle,
  Edit3,
} from "lucide-react";
import Link from "next/link";

interface MeetingDetail {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
  status: "scheduled" | "completed" | "cancelled";
  meetingLink?: string;
  agenda: string;
  summary?: string;
  notes?: string;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);

  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Meetings", href: "/meetings" },
    { label: id ? `Meeting ${id}` : "Meeting" },
  ]);

  useEffect(() => {
    setTimeout(() => {
      setMeeting({
        id: id || "1",
        title: "Disciplinary Review — J. Smith",
        type: "Written Warning",
        date: "2026-04-05",
        time: "2:00 PM",
        duration: 30,
        participants: ["Maria Garcia", "David Park", "John Smith"],
        status: "scheduled",
        meetingLink: "https://zoom.us/j/123456789",
        agenda: "Review attendance policy violation, discuss corrective actions.",
      });
      setLoading(false);
    }, 300);
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
            The meeting you're looking for doesn't exist.
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
      title={meeting.title}
      description={`${meeting.type} • ${meeting.date} at ${meeting.time}`}
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

              <h3 className="mb-2 text-lg font-semibold text-text-primary">Agenda</h3>
              <p className="text-text-secondary">{meeting.agenda}</p>

              {meeting.summary && (
                <>
                  <h3 className="mb-2 mt-6 text-lg font-semibold text-text-primary">
                    Summary
                  </h3>
                  <p className="text-text-secondary">{meeting.summary}</p>
                </>
              )}
            </Card>

            {meeting.status === "scheduled" && (
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-text-primary">Actions</h3>
                <div className="flex gap-3">
                  {meeting.meetingLink && (
                    <Button asChild>
                      <a
                        href={meeting.meetingLink}
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
                  <span className="text-text-primary">{meeting.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Time:</span>
                  <span className="text-text-primary">{meeting.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Duration:</span>
                  <span className="text-text-primary">{meeting.duration} min</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Participants</h3>
              <div className="space-y-2">
                {meeting.participants.map((participant, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-slate-light">
                      <span className="text-xs font-medium text-text-primary">
                        {participant
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <span className="text-sm text-text-primary">{participant}</span>
                  </div>
                ))}
              </div>
            </Card>

            {meeting.meetingLink && (
              <Card className="p-4">
                <h3 className="mb-3 font-medium text-text-primary">Meeting Link</h3>
                <a
                  href={meeting.meetingLink}
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
