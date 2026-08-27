import { UserRound, Building2, Timer, TrendingUp } from "lucide-react";
import type { Claim } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ClaimIntelligence({ claim }: { claim: Claim }) {
  return (
    <Card className="glass-panel">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{claim.id}</p>
            <h3 className="mt-1 text-xl font-semibold">{claim.title}</h3>
          </div>
          <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">{claim.status}</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Estimated Approval", value: "4 hours", icon: Timer },
            { label: "AI Confidence", value: "97%", icon: TrendingUp },
            { label: "Adjuster Assigned", value: "Rajesh Sharma", icon: UserRound },
            { label: "Hospital", value: "Apollo Pune", icon: Building2 }
          ].map((item) => (
            <div key={item.label} className="rounded-md bg-muted p-4">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold">Approval progress</span>
            <span className="text-muted-foreground">82%</span>
          </div>
          <Progress value={82} />
        </div>
      </CardContent>
    </Card>
  );
}
