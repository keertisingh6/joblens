import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecommendationBanner() {
  return (
    <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Aurora Recommendation</p>
            <p className="text-sm text-muted-foreground">Bundle Home + Motor and save Rs 240/month.</p>
          </div>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/assistant">View</Link>
        </Button>
      </div>
    </div>
  );
}
