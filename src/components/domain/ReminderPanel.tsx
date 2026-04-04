/**
 * Reminder System — client-side reminder scheduler and display.
 *
 * Shows pending reminders for:
 *   - 24h before meeting
 *   - 72h before document signature deadline
 *   - 7d before policy expiry
 *   - Overdue items
 *
 * In production, reminders are pushed via Supabase Realtime
 * and/or email/SMS notifications.
 */
"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Bell,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Reminder {
  id: string;
  type: "meeting_24h" | "signature_72h" | "policy_expiry_7d" | "overdue";
  title: string;
  message: string;
  dueDate: string;
  entityLink: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_REMINDERS: Reminder[] = [
  {
    id: "1",
    type: "meeting_24h",
    title: "Meeting Tomorrow",
    message: "Disciplinary review for John Smith is scheduled for tomorrow at 2:00 PM.",
    dueDate: "2026-04-05T14:00:00Z",
    entityLink: "/meetings/1",
    read: false,
  },
  {
    id: "2",
    type: "signature_72h",
    title: "Document Signature Due Soon",
    message: "Written Warning for Jane Doe requires signature by Apr 8.",
    dueDate: "2026-04-08T23:59:59Z",
    entityLink: "/documents/1",
    read: false,
  },
  {
    id: "3",
    type: "overdue",
    title: "Overdue: PIP Follow-up",
    message: "PIP follow-up meeting for Alice Williams was due on Apr 1.",
    dueDate: "2026-04-01T10:00:00Z",
    entityLink: "/meetings/2",
    read: false,
  },
  {
    id: "4",
    type: "policy_expiry_7d",
    title: "Policy Expiring Soon",
    message: "Remote Work Guidelines policy expires on Apr 11. Review and renew.",
    dueDate: "2026-04-11T23:59:59Z",
    entityLink: "/policies/2",
    read: true,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReminderPanel() {
  const reminders = MOCK_REMINDERS;
  const unreadCount = reminders.filter((r) => !r.read).length;
  const overdueCount = reminders.filter((r) => r.type === "overdue").length;

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      // Overdue first, then by due date
      if (a.type === "overdue" && b.type !== "overdue") return -1;
      if (a.type !== "overdue" && b.type === "overdue") return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [reminders]);

  const typeConfig = {
    meeting_24h: {
      icon: <Calendar className="h-4 w-4 text-brand-primary" />,
      badge: "warning" as const,
      badgeLabel: "24h",
    },
    signature_72h: {
      icon: <FileText className="h-4 w-4 text-brand-warning" />,
      badge: "default" as const,
      badgeLabel: "72h",
    },
    policy_expiry_7d: {
      icon: <Clock className="h-4 w-4 text-text-tertiary" />,
      badge: "outline" as const,
      badgeLabel: "7d",
    },
    overdue: {
      icon: <AlertTriangle className="h-4 w-4 text-brand-error" />,
      badge: "error" as const,
      badgeLabel: "Overdue",
    },
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Bell className="h-4 w-4 text-brand-primary" />
          Reminders
          {unreadCount > 0 && <Badge variant="warning">{unreadCount}</Badge>}
        </h3>
        {overdueCount > 0 && <Badge variant="error">{overdueCount} overdue</Badge>}
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          title="All caught up!"
          description="No pending reminders."
          icon={<CheckCircle className="h-8 w-8 text-brand-success" />}
        />
      ) : (
        <div className="space-y-2">
          {sortedReminders.map((reminder) => {
            const config = typeConfig[reminder.type];
            return (
              <div
                key={reminder.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-card-hover ${
                  !reminder.read ? "border-l-2 border-l-brand-primary" : "border-border"
                }`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-slate-light">
                  {config.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">
                      {reminder.title}
                    </p>
                    <Badge variant={config.badge} className="text-[10px]">
                      {config.badgeLabel}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">
                    {reminder.message}
                  </p>
                  <p className="mt-1 text-[10px] text-text-tertiary">
                    Due: {new Date(reminder.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
                  <Link href={reminder.entityLink}>
                    View
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
