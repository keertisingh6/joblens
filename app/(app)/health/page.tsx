import { Footprints, Heart, HeartPulse, Moon, Waves } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { healthMetrics } from "@/lib/data";

export default function HealthPage() {
  const rings = [
    { label: "Heart", value: 88, icon: Heart, color: "border-red-500 text-red-500" },
    { label: "Sleep", value: 74, icon: Moon, color: "border-indigo-500 text-indigo-500" },
    { label: "Steps", value: 91, icon: Footprints, color: "border-emerald-500 text-emerald-500" },
    { label: "Water", value: 62, icon: Waves, color: "border-sky-500 text-sky-500" },
    { label: "Recovery", value: 79, icon: HeartPulse, color: "border-amber-500 text-amber-500" }
  ];

  return (
    <div>
      <PageHeader title="Health" description="Preventive care, benefits, and wellness metrics connected to your health policy." icon={HeartPulse} />
      <div className="grid gap-5 md:grid-cols-5">
        {rings.map((ring) => (
          <Card key={ring.label} className="glass-panel">
            <CardContent className="p-5">
              <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[10px] ${ring.color}`}>
                <ring.icon className="h-8 w-8" />
              </div>
              <p className="mt-5 text-center text-sm font-semibold">{ring.label}</p>
              <p className="text-center text-2xl font-semibold">{ring.value}%</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {healthMetrics.map((metric) => (
          <Card key={metric.label} className="glass-panel">
            <CardContent className="p-5">
              <Badge variant={metric.status === "Good" ? "success" : "warning"}>{metric.status}</Badge>
              <h3 className="mt-5 text-sm text-muted-foreground">{metric.label}</h3>
              <p className="mt-1 text-3xl font-bold">{metric.value}</p>
              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">{metric.trend}</p>
              <Progress className="mt-5" value={metric.status === "Good" ? 86 : 58} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-panel mt-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold">Next best health actions</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {["Book annual bloodwork", "Upload dental cleaning receipt", "Review HSA contribution"].map((item) => (
              <div key={item} className="rounded-md border bg-background/60 p-4 text-sm font-medium">{item}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
