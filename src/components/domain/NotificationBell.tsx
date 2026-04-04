/**
 * Notification Bell — In-app notifications with unread badge.
 *
 * Dropdown panel with notification list.
 * Unread: Vanilla left border. Read: dim.
 * "Mark all read" button.
 */
"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
  entityLink?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "incident_submitted",
    title: "New Incident Reported",
    message: "David Park submitted an incident for John Smith.",
    read: false,
    time: "2m ago",
    entityLink: "/incident-queue/1",
  },
  {
    id: "2",
    type: "document_approved",
    title: "Document Approved",
    message: "Maria Garcia approved the written warning for Jane Doe.",
    read: false,
    time: "15m ago",
    entityLink: "/incident-queue/2",
  },
  {
    id: "3",
    type: "meeting_scheduled",
    title: "Meeting Scheduled",
    message: "Disciplinary review for J. Smith scheduled for Apr 5 at 2:00 PM.",
    read: true,
    time: "1h ago",
    entityLink: "/meetings/1",
  },
  {
    id: "4",
    type: "document_signed",
    title: "Document Signed",
    message: "Bob Johnson signed the verbal warning document.",
    read: true,
    time: "3h ago",
    entityLink: "/documents/3",
  },
  {
    id: "5",
    type: "ai_evaluation_complete",
    title: "AI Evaluation Complete",
    message: "AI has evaluated INC-2026-0040 (Bob Johnson — Absence).",
    read: true,
    time: "5h ago",
    entityLink: "/incident-queue/3",
  },
];

export function NotificationBell() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-brand-slate-light hover:text-text-primary"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-text-inverse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-80 rounded-xl border border-border bg-card shadow-xl shadow-black/20",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Inbox className="h-8 w-8 text-text-tertiary" />
                <p className="text-sm text-text-tertiary">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    markRead(notif.id);
                    if (notif.entityLink) {
                      window.location.href = notif.entityLink;
                    }
                  }}
                  className={`w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-card-hover ${
                    !notif.read ? "border-l-2 border-l-brand-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                        !notif.read ? "bg-brand-primary" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          !notif.read ? "text-text-primary" : "text-text-secondary"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[10px] text-text-tertiary">{notif.time}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
