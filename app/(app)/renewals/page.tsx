import { RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { policies, renewals } from "@/lib/data";
import { daysUntil, formatCurrency, formatDate } from "@/lib/utils";

export default function RenewalsPage() {
  return (
    <div>
      <PageHeader title="Renewals" description="Compare projected premiums and act before renewal windows close." icon={RefreshCcw} />
      <div className="grid gap-6">
        {renewals.map((renewal) => {
          const policy = policies.find((item) => item.id === renewal.policyId)!;
          return (
            <Card key={renewal.id} className="glass-panel">
              <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <Badge variant={daysUntil(renewal.dueDate) < 30 ? "warning" : "secondary"}>{daysUntil(renewal.dueDate)} days left</Badge>
                  <h3 className="mt-3 text-xl font-bold">{policy.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Renews {formatDate(renewal.dueDate)} · {renewal.recommendation}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="rounded-md border bg-background/70 p-3">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="font-bold">{formatCurrency(renewal.currentPremium)}/mo</p>
                  </div>
                  <div className="rounded-md border bg-background/70 p-3">
                    <p className="text-xs text-muted-foreground">Projected</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(renewal.projectedPremium)}/mo</p>
                  </div>
                  <Button>Review renewal</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
