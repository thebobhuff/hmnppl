/**
 * Notification Bell — In-app notifications with unread badge.
 *
 * Dropdown panel with notification list.
 * Unread: Vanilla left border. Read: dim.
 * "Mark all read" button.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  entity_type?: string | null;
  entity_id?: string | null;
}

function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoTimestamp).toLocaleDateString();
}

function getEntityLink(notification: Notification): string | undefined {
  if (!notification.entity_id) return undefined;

  if (notification.entity_type === "incident") {
    return `/incident-queue/${notification.entity_id}`;
  }

  if (notification.entity_type === "disciplinary_action") {
    return `/documents/${notification.entity_id}`;
  }

  if (notification.entity_type === "meeting") {
    return `/meetings/${notification.entity_id}`;
  }

  return undefined;
}

export function NotificationBell() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, read, created_at, entity_type, entity_id")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[notifications] Failed to load notifications:", error.message);
      setLoading(false);
      return;
    }

    setNotifications(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let disposed = false;
    let channelName = "";

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (disposed) {
        return;
      }

      await loadNotifications();

      if (!user) {
        return;
      }

      channelName = `notifications:${user.id}`;
      supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadNotifications();
          },
        )
        .subscribe();
    };

    void setup();

    const pollId = window.setInterval(() => {
      void loadNotifications();
    }, 5000);

    return () => {
      disposed = true;
      window.clearInterval(pollId);
      if (channelName) {
        void supabase.removeChannel(supabase.channel(channelName));
      }
    };
  }, [loadNotifications, supabase]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) {
      return;
    }

    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: readAt })
      .in("id", unreadIds);

    if (error) {
      console.error("[notifications] Failed to mark all as read:", error.message);
      await loadNotifications();
    }
  }, [loadNotifications, notifications, supabase]);

  const markRead = useCallback(
    async (id: string) => {
      const readAt = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: readAt })
        .eq("id", id);

      if (error) {
        console.error("[notifications] Failed to mark as read:", error.message);
        await loadNotifications();
      }
    },
    [loadNotifications, supabase],
  );

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
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-text-tertiary">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Inbox className="h-8 w-8 text-text-tertiary" />
                <p className="text-sm text-text-tertiary">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={async () => {
                    await markRead(notif.id);
                    const entityLink = getEntityLink(notif);
                    if (entityLink) {
                      setOpen(false);
                      router.push(entityLink);
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
                      <p className="mt-1 text-[10px] text-text-tertiary">
                        {formatRelativeTime(notif.created_at)}
                      </p>
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
