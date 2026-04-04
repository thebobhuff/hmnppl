// ============================================
// HMN — Dashboard Route Group Layout
// Wraps all authenticated pages with the Shell
// ============================================

import { Shell } from "@/components/layout/Shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
