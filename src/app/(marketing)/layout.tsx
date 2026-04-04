import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HMN/PPL — Agentic Human Resources Platform",
  description:
    "Streamline hiring, onboarding, compliance, and employee lifecycle management with AI-powered automation.",
  openGraph: {
    title: "HMN/PPL — Agentic Human Resources Platform",
    description:
      "Streamline hiring, onboarding, compliance, and employee lifecycle management with AI-powered automation.",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
