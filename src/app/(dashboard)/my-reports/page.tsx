import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/empty-state";
import { Construction } from "lucide-react";

export default function MyReportsPage() {
  return (
    <PageContainer title="My Reports">
      <EmptyState 
        icon={<Construction className="h-12 w-12 text-brand-primary" />}
        title="Under Construction" 
        description="This module is coming soon and is under active development."
      />
    </PageContainer>
  );
}
