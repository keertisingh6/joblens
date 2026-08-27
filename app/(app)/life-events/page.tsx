import { Baby, Bike, GraduationCap, HeartHandshake, Home, Plane, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const events = [
  { title: "Bought a house", signal: "Home loan detected", insurance: "Home Shield Assist", icon: Home },
  { title: "Planning trip", signal: "Goa booking detected", insurance: "Travel Ease Global", icon: Plane },
  { title: "Bought a bike", signal: "UPI payment to dealer", insurance: "Two-wheeler cover", icon: Bike },
  { title: "New baby", signal: "Hospital spend pattern", insurance: "Family health top-up", icon: Baby },
  { title: "Marriage", signal: "Joint account opened", insurance: "Term + health bundle", icon: HeartHandshake },
  { title: "Student loan", signal: "Education loan EMI", insurance: "Loan protection cover", icon: GraduationCap }
];

export default function LifeEventsPage() {
  return (
    <div>
      <PageHeader
        title="Life Events"
        description="Aurora AI detects life changes from banking context and recommends protection before risk becomes urgent."
        icon={Sparkles}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <Card key={event.title} className="glass-panel transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <event.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{event.title}</h3>
              <Badge variant="secondary" className="mt-3">{event.signal}</Badge>
              <p className="mt-4 text-sm text-muted-foreground">Recommended insurance</p>
              <p className="mt-1 text-xl font-semibold">{event.insurance}</p>
              <Button className="mt-5 w-full">View recommendation</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
