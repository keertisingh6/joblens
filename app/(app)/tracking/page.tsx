import { Activity } from "lucide-react";
import { ClaimTimeline } from "@/components/claim-timeline";
import { PageHeader } from "@/components/page-header";
import { claims } from "@/lib/data";

export default function TrackingPage() {
  return (
    <div>
      <PageHeader title="Claim Tracking" description="A timeline-first view of every open and completed claim." icon={Activity} />
      <div className="grid gap-6 lg:grid-cols-2">
        {claims.map((claim) => <ClaimTimeline key={claim.id} claim={claim} />)}
      </div>
    </div>
  );
}
