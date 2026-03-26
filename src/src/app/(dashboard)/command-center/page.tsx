import { PageHeader } from "@/components/shared/page-header";

export const metadata = {
  title: "Command Center",
};

export default function CommandCenterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        description="Operational overview — what needs attention right now"
      />
      <div className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-8 text-center">
        Command Center dashboard will be built in Phase 12
      </div>
    </div>
  );
}
