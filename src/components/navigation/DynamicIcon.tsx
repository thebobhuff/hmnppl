// ============================================
// HMN — Icon Component
// Dynamic lucide-react icon resolver
// ============================================

"use client";

import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Brain,
  ShieldAlert,
  Settings,
  UserCircle,
  Users,
  FileText,
  Inbox,
  Calendar,
  FileBarChart,
  PlusCircle,
  Activity,
  GraduationCap,
  MessagesSquare,
  Search,
  type LucideProps,
} from "lucide-react";
import type { FC } from "react";

const ICON_MAP: Record<string, FC<LucideProps>> = {
  LayoutDashboard,
  Building2,
  BarChart3,
  Brain,
  ShieldAlert,
  Settings,
  UserCircle,
  Users,
  FileText,
  Inbox,
  Calendar,
  FileBarChart,
  PlusCircle,
  Activity,
  GraduationCap,
  MessagesSquare,
  Search,
};

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    // Fallback to a generic icon
    return <Settings {...props} />;
  }

  return <IconComponent {...props} />;
}
