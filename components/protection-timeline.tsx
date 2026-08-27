import { Car, Gift, Plane, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const events = [
  { year: "2025", title: "Bought Car", icon: Car },
  { year: "2025", title: "Motor Insurance", icon: ShieldCheck },
  { year: "2026", title: "Claim Approved", icon: Wrench },
  { year: "2026", title: "Reward Earned", icon: Gift },
  { year: "2026", title: "Travel Booked", icon: Plane },
  { year: "Now", title: "Score Increased", icon: Sparkles }
];

export function ProtectionTimeline() {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Protection Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-6">
          {events.map((event, index) => (
            <div key={event.title} className="relative rounded-2xl border bg-background/70 p-5">
              {index < events.length - 1 ? <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-border md:block" /> : null}
              <event.icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-xs text-muted-foreground">{event.year}</p>
              <p className="mt-1 text-sm font-bold">{event.title}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
