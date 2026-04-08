/**
 * My Meetings — User's scheduled meetings.
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, Video, Users, MapPin, Plus } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  type: "video" | "in_person";
  attendees: number;
  status: "upcoming" | "completed" | "cancelled";
}

export default function MyMeetingsPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "My Meetings" }]);

  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setMeetings([
        {
          id: "1",
          title: "Performance Review - Alice Johnson",
          date: "2026-04-10",
          time: "10:00 AM",
          duration: 30,
          type: "video",
          attendees: 2,
          status: "upcoming",
        },
        {
          id: "2",
          title: "Quarterly Check-in",
          date: "2026-04-15",
          time: "2:00 PM",
          duration: 60,
          type: "video",
          attendees: 3,
          status: "upcoming",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const typeIcon = {
    video: <Video className="h-4 w-4" />,
    in_person: <MapPin className="h-4 w-4" />,
  };

  return (
    <PageContainer
      title="My Meetings"
      description="View and manage your scheduled meetings."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        )}

        {!loading && meetings.length === 0 && (
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="No meetings scheduled"
            description="You don't have any upcoming meetings."
          />
        )}

        {!loading && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant={meeting.status === "upcoming" ? "warning" : "default"}
                      >
                        {meeting.status}
                      </Badge>
                      {typeIcon[meeting.type]}
                    </div>
                    <h3 className="font-medium text-text-primary">{meeting.title}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {meeting.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {meeting.time} ({meeting.duration} min)
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {meeting.attendees} attendees
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Join
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
