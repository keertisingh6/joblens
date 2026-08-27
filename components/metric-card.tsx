import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card className="glass-panel">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">{trend}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}
