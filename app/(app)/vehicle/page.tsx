import { Car } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { vehicleRecords } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default function VehiclePage() {
  return (
    <div>
      <PageHeader title="Motor" description="Motor policy, driving score, maintenance, and roadside readiness in one view." icon={Car} />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {vehicleRecords.map((record) => (
          <Card key={record.label} className="glass-panel">
            <CardContent className="p-5">
              <Badge variant={record.status === "Current" ? "success" : "warning"}>{record.status}</Badge>
              <h3 className="mt-5 font-semibold">{record.label}</h3>
              <p className="mt-1 text-2xl font-bold">{record.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{record.due === "Live" ? "Live monitoring" : `Due ${formatDate(record.due)}`}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-panel mt-6">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold">Safe-driver verification</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your score qualifies for a projected Rs 100 monthly premium reduction.</p>
          </div>
          <Button>Apply discount</Button>
        </CardContent>
      </Card>
    </div>
  );
}
