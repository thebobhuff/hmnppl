"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Calendar,
  Clock,
  Users,
  Link2,
  Video,
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { meetingsAPI, type MeetingResponse } from "@/lib/api/client";

type ViewMode = "list" | "calendar";

export default function MyMeetingsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Meetings" },
  ]);

  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentWeek, setCurrentWeek] = useState(new Date());

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

  const { upcoming, completed } = useMemo(() => {
    const now = new Date();
    const upcomingMeetings = meetings.filter(
      (m) => m.status === "scheduled" && m.scheduled_at && new Date(m.scheduled_at) > now
    );
    const completedMeetings = meetings.filter(
      (m) => m.status === "completed" || (m.scheduled_at && new Date(m.scheduled_at) <= now)
    );
    return { upcoming: upcomingMeetings, completed: completedMeetings };
  }, [meetings]);

  const weekDays = useMemo(() => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeek]);

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter((m) => {
      if (!m.scheduled_at) return false;
      const meetingDate = new Date(m.scheduled_at);
      return (
        meetingDate.getFullYear() === day.getFullYear() &&
        meetingDate.getMonth() === day.getMonth() &&
        meetingDate.getDate() === day.getDate()
      );
    });
  };

  const stats = {
    total: meetings.length,
    upcoming: upcoming.length,
    completed: completed.length,
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageContainer
      title="My Meetings"
      description="View and manage your meeting schedule."
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
                  <Calendar className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                  <p className="text-xs text-text-tertiary">Total Meetings</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                  <Clock className="h-5 w-5 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.upcoming}</p>
                  <p className="text-xs text-text-tertiary">Upcoming</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <FileText className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.completed}</p>
                  <p className="text-xs text-text-tertiary">Completed</p>
                </div>
              </div>
            </Card>
          </div>

          {/* View Toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg bg-brand-slate-light p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-brand-primary text-text-inverse"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "calendar"
                    ? "bg-brand-primary text-text-inverse"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                Calendar
              </button>
            </div>

            {viewMode === "calendar" && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => {
                  const prev = new Date(currentWeek);
                  prev.setDate(prev.getDate() - 7);
                  setCurrentWeek(prev);
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-text-primary">
                  {weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
                <Button variant="ghost" size="icon" onClick={() => {
                  const next = new Date(currentWeek);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeek(next);
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {viewMode === "calendar" ? (
            /* Calendar View */
            <Card className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs font-medium text-text-tertiary">
                      {day.toLocaleDateString([], { weekday: 'short' })}
                    </p>
                    <p className={`text-sm font-semibold ${new Date().toDateString() === day.toDateString() ? 'text-brand-primary' : 'text-text-primary'}`}>
                      {day.getDate()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {weekDays.map((day, i) => {
                  const dayMeetings = getMeetingsForDay(day);
                  return (
                    <div key={i} className="min-h-[60px] rounded-lg border border-border p-2">
                      {dayMeetings.length === 0 ? (
                        <p className="text-xs text-text-tertiary">No meetings</p>
                      ) : (
                        dayMeetings.map((meeting) => (
                          <Link
                            key={meeting.id}
                            href={`/meetings/${meeting.id}`}
                            className="block rounded px-2 py-1 text-xs hover:bg-card-hover"
                          >
                            <span className="font-medium">{formatTime(meeting.scheduled_at)}</span>
                            <span className="ml-2 text-text-secondary">{meeting.type}</span>
                          </Link>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            /* List View */
            <>
              {/* Upcoming Meetings */}
              <div className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                  <Calendar className="h-5 w-5 text-brand-primary" />
                  Upcoming Meetings
                </h2>
                {upcoming.length === 0 ? (
                  <Card className="p-6">
                    <EmptyState
                      title="No upcoming meetings"
                      description="Your scheduled meetings will appear here."
                      icon={<Calendar className="h-8 w-8" />}
                    />
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {upcoming.map((meeting) => (
                      <Card key={meeting.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-text-primary">{meeting.type}</h3>
                            <Badge variant="warning" className="mt-1">{meeting.status}</Badge>
                          </div>
                          {meeting.meeting_link && (
                            <Button asChild size="sm" variant="ghost">
                              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs text-text-tertiary">
                          {meeting.scheduled_at && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(meeting.scheduled_at).toLocaleDateString()} at {formatTime(meeting.scheduled_at)}
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
                              {meeting.participants.length} participants
                            </div>
                          )}
                        </div>
                        {meeting.agenda && (
                          <div className="mt-3 rounded-lg border border-border bg-brand-slate-dark p-2">
                            <p className="text-xs font-medium text-text-secondary">Agenda</p>
                            <p className="mt-1 text-xs text-text-tertiary line-clamp-2">{meeting.agenda}</p>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/meetings/${meeting.id}`}>
                              View Details
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                          {meeting.meeting_link && (
                            <Button asChild size="sm">
                              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                <Video className="mr-1 h-3 w-3" />
                                Join
                              </a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Meetings */}
              <div>
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                  <FileText className="h-5 w-5 text-brand-success" />
                  Completed Meetings
                </h2>
                {completed.length === 0 ? (
                  <Card className="p-6">
                    <EmptyState
                      title="No completed meetings"
                      description="Your past meetings will appear here."
                      icon={<FileText className="h-8 w-8" />}
                    />
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {completed.map((meeting) => (
                      <Card key={meeting.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-text-primary">{meeting.type}</h3>
                            <Badge variant="success" className="mt-1">{meeting.status}</Badge>
                          </div>
                          {meeting.scheduled_at && (
                            <span className="text-xs text-text-tertiary">
                              {new Date(meeting.scheduled_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {meeting.outcome && (
                          <div className="mt-3 rounded-lg border border-border bg-brand-slate-dark p-2">
                            <p className="text-xs font-medium text-text-secondary">Outcome</p>
                            <p className="mt-1 text-xs text-text-tertiary line-clamp-2">{meeting.outcome}</p>
                          </div>
                        )}
                        <div className="mt-4 flex justify-end">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/meetings/${meeting.id}`}>
                              View Summary
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}