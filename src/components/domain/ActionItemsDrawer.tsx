/**
 * ActionItemsDrawer — Manager's slide-out action center.
 *
 * Shows:
 *   - Meetings scheduled within the next 48h
 *   - Overdue PIP follow-ups
 *   - Documents awaiting signature
 *   - Pending items requiring manager attention
 *
 * PRD Epic 1: Slide-Out Reminders
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Calendar, Clock, FileText, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { notificationsAPI } from "@/lib/api/client";
import type { NotificationResponse, MeetingResponse, DisciplinaryActionResponse } from "@/lib/api/client";
import Link from "next/link";

interface ActionItem {
  id: string;
  type: "meeting" | "document" | "reminder" | "overdue";
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant: "default" | "success" | "warning" | "error" | "outline";
  href: string;
  dueDate?: string;
  isOverdue?: boolean;
}

interface ActionItemsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const typeConfig = {
  meeting: {
    icon: <Calendar className="h-4 w-4 text-brand-primary" />,
  },
  document: {
    icon: <FileText className="h-4 w-4 text-brand-warning" />,
  },
  reminder: {
    icon: <Clock className="h-4 w-4 text-text-tertiary" />,
  },
  overdue: {
    icon: <AlertTriangle className="h-4 w-4 text-brand-error" />,
  },
};

export function ActionItemsDrawer({ open, onClose }: ActionItemsDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ActionItem[]>([]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, meetingsRes, docsRes] = await Promise.all([
        notificationsAPI.list({ unread: true, limit: 20 }),
        meetingsAPI.list("scheduled", "", 10),
        disciplinaryAPI.list("pending_signature", "", 10),
      ]);

      const actionItems: ActionItem[] = [];

      // Add notifications as reminders
      for (const notif of notifRes.notifications) {
        actionItems.push({
          id: `notif-${notif.id}`,
          type: "reminder",
          title: notif.title,
          subtitle: notif.message,
          badge: formatNotifBadge(notif.type),
          badgeVariant: "outline",
          href: getNotifLink(notif),
        });
      }

      // Add upcoming meetings (next 48h)
      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      for (const meeting of meetingsRes.meetings) {
        const scheduledAt = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null;
        if (scheduledAt && scheduledAt >= now && scheduledAt <= in48h) {
          actionItems.push({
            id: `meeting-${meeting.id}`,
            type: "meeting",
            title: `${formatMeetingType(meeting.type)} Meeting`,
            subtitle: scheduledAt.toLocaleString(),
            badge: "Upcoming",
            badgeVariant: "warning",
            href: `/meetings/${meeting.id}`,
            dueDate: meeting.scheduled_at ?? undefined,
          });
        }
      }

      // Add overdue meetings (scheduled_at in the past)
      for (const meeting of meetingsRes.meetings) {
        const scheduledAt = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null;
        if (scheduledAt && scheduledAt < now && meeting.status === "scheduled") {
          actionItems.push({
            id: `overdue-meeting-${meeting.id}`,
            type: "overdue",
            title: `Overdue: ${formatMeetingType(meeting.type)}`,
            subtitle: `Was scheduled for ${scheduledAt.toLocaleString()}`,
            badge: "Overdue",
            badgeVariant: "error",
            href: `/meetings/${meeting.id}`,
            dueDate: meeting.scheduled_at ?? undefined,
            isOverdue: true,
          });
        }
      }

      // Add pending signature documents
      for (const doc of docsRes.actions ?? []) {
        actionItems.push({
          id: `doc-${doc.id}`,
          type: "document",
          title: doc.action_type?.replaceAll("_", " ") ?? "Document",
          subtitle: `Awaiting signature · Created ${formatRelativeDate(doc.created_at)}`,
          badge: "Needs signature",
          badgeVariant: "warning",
          href: `/documents/${doc.id}/sign`,
        });
      }

      setItems(actionItems);
    } catch (err) {
      console.error("[ActionItemsDrawer] Failed to load items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadItems();
    }
  }, [open, loadItems]);

  const overdueCount = items.filter((i) => i.isOverdue).length;
  const totalCount = items.length;

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent side="right">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-primary" />
              <DrawerTitle>Action Items</DrawerTitle>
              {totalCount > 0 && (
                <Badge variant="warning" className="ml-1">
                  {totalCount}
                </Badge>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription>
            {overdueCount > 0
              ? `${overdueCount} overdue item${overdueCount !== 1 ? "s" : ""} need your attention`
              : "Upcoming tasks and reminders for the next 48 hours"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Clock className="h-6 w-6 animate-spin text-text-tertiary" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="All caught up!"
              description="No pending action items right now."
              icon={<CheckCircle className="h-8 w-8 text-brand-success" />}
            />
          ) : (
            <div className="space-y-3">
              {overdueCount > 0 && (
                <div className="rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-brand-error">
                    <AlertTriangle className="h-4 w-4" />
                    {overdueCount} overdue item{overdueCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {items.map((item) => {
                const config = typeConfig[item.type];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-card-hover"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-slate-light">
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <Badge variant={item.badgeVariant} className="text-[10px]">
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-text-tertiary">{item.subtitle}</p>
                      {item.dueDate && (
                        <p
                          className={`mt-1 text-[10px] ${item.isOverdue ? "text-brand-error font-medium" : "text-text-tertiary"}`}
                        >
                          {item.isOverdue ? "Was due: " : "Due: "}
                          {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function formatNotifBadge(type: string): string {
  if (type.includes("meeting")) return "Meeting";
  if (type.includes("document")) return "Document";
  if (type.includes("incident")) return "Incident";
  if (type.includes("reminder")) return "Reminder";
  return "Notification";
}

function getNotifLink(notif: NotificationResponse): string {
  if (!notif.entity_id) return "#";
  if (notif.entity_type === "incident") return `/incident-queue/${notif.entity_id}`;
  if (notif.entity_type === "disciplinary_action") return `/documents/${notif.entity_id}`;
  if (notif.entity_type === "meeting") return `/meetings/${notif.entity_id}`;
  return "#";
}

function formatMeetingType(type: string): string {
  return (type || "Meeting")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const meetingsAPI = {
  list: (status?: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    return fetch(`/api/v1/meetings?${params.toString()}`, {
      credentials: "include",
    }).then((r) => r.json()) as Promise<{ meetings: MeetingResponse[] }>;
  },
};

const disciplinaryAPI = {
  list: (status?: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    return fetch(`/api/v1/disciplinary-actions?${params.toString()}`, {
      credentials: "include",
    }).then((r) => r.json()) as Promise<{ actions: DisciplinaryActionResponse[] }>;
  },
};