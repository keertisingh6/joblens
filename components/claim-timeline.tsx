import { CheckCircle2, CircleDashed } from "lucide-react";
import type { Claim } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ClaimTimeline({ claim }: { claim: Claim }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{claim.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{claim.id} · {formatCurrency(claim.amount)}</p>
          </div>
          <Badge variant={claim.status === "Paid" || claim.status === "Approved" ? "success" : "warning"}>
            {claim.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {claim.timeline.map((item) => (
            <div key={item.label} className="flex gap-3">
              {item.completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <CircleDashed className="mt-0.5 h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-md bg-muted p-3 text-sm text-muted-foreground">{claim.nextStep}</p>
      </CardContent>
    </Card>
  );
}
