import { PageContainer } from "@/components/layout/PageContainer";
import { AiPerformanceCharts } from "./charts";
import { createClient } from "@/lib/supabase/server";

export default async function AiPerformancePage() {
  const supabase = await createClient();

  // Note: we fetch all incidents and aggregate them in JS here for speed.
  // In a real production system, this could be a Postgres materialized view or SQL aggregation.
  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("id, status, ai_confidence_score, ai_evaluation_status, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <PageContainer title="AI Performance">
        <p className="text-red-500">Error loading metrics data.</p>
      </PageContainer>
    );
  }

  const validIncidents = incidents || [];

  // Group 1: Accuracy (Approved vs Rejected/Disputed vs Pending)
  // For AI, approved/signed = HR accepted AI. rejected/disputed = HR override.
  const accuracyMap = {
    Accurate: 0,
    Overridden: 0,
    Pending: 0,
  };

  // Group 2: Volume over time (groupby day)
  const volumeMap: Record<string, number> = {};

  // Group 3: Confidence over time (groupby day)
  const confidenceMap: Record<string, { total: number; count: number }> = {};

  for (const inc of validIncidents) {
    // 1. Accuracy
    if (["approved", "signed", "document_delivered", "meeting_scheduled"].includes(inc.status)) {
      accuracyMap.Accurate += 1;
    } else if (["rejected", "disputed"].includes(inc.status)) {
      accuracyMap.Overridden += 1;
    } else {
      accuracyMap.Pending += 1;
    }

    const date = new Date(inc.created_at).toISOString().split("T")[0];
    
    // 2. Volume
    volumeMap[date] = (volumeMap[date] || 0) + 1;

    // 3. Confidence
    if (inc.ai_confidence_score != null) {
      if (!confidenceMap[date]) {
        confidenceMap[date] = { total: 0, count: 0 };
      }
      confidenceMap[date].total += Number(inc.ai_confidence_score);
      confidenceMap[date].count += 1;
    }
  }

  const accuracyData = [
    { name: "Accepted", value: accuracyMap.Accurate },
    { name: "Overridden", value: accuracyMap.Overridden },
    { name: "Pending", value: accuracyMap.Pending },
  ].filter((d) => d.value > 0);

  const volumeData = Object.keys(volumeMap).map((date) => ({
    date,
    count: volumeMap[date],
  }));

  const confidenceData = Object.keys(confidenceMap).map((date) => ({
    date,
    score: confidenceMap[date].total / confidenceMap[date].count,
  }));

  return (
    <PageContainer title="AI Performance & Analytics">
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">
          Analytics tracking the autonomous HR agent's performance, evaluation volume, and human-in-the-loop override rates.
        </p>
        <AiPerformanceCharts 
          accuracyData={accuracyData.length > 0 ? accuracyData : [{ name: "No Data", value: 1 }]} 
          confidenceData={confidenceData} 
          volumeData={volumeData} 
        />
      </div>
    </PageContainer>
  );
}
