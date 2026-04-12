import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI HR Platform for Employee Discipline & Compliance | HMN/PPL",
  description:
    "Automate progressive discipline tracking, manager coaching, termination paperwork, and multi-layer compliance with AI agents. Built for mid-market HR teams.",
  keywords: [
    "AI HR platform",
    "employee discipline software",
    "progressive discipline tracking",
    "HR compliance software",
    "AI employee management",
    "HR automation platform",
    "termination paperwork",
    "employee relations software",
    "manager coaching AI",
    "multi jurisdiction compliance",
    "HR KPI dashboard",
    "employee churn analytics",
  ],
  openGraph: {
    title: "AI HR Platform for Employee Discipline & Compliance | HMN/PPL",
    description:
      "The only HR platform with autonomous AI agents that handle discipline, compliance, and coaching. Built for mid-market companies.",
    type: "website",
    url: "https://hmnppl.ai",
    siteName: "HMN/PPL",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HMN/PPL - AI-Powered HR Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI HR Platform for Employee Discipline & Compliance | HMN/PPL",
    description:
      "Autonomous AI agents for HR. Discipline tracking, compliance, coaching. Start free.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://hmnppl.ai",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
