import Link from "next/link";
import { AlertTriangle, Bot, Plane, ShieldCheck, Sparkles } from "lucide-react";
import { AssistantPanel } from "@/components/assistant-panel";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AssistantPage() {
  return (
    <div>
      <PageHeader title="Aurora AI" description="Your proactive insurance copilot for renewals, claims, coverage gaps, and life-event protection." icon={Bot} />
      <div className="mb-6 grid gap-4 xl:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-indigo-700 to-sky-700 text-white shadow-md">
          <CardContent className="p-5">
            <Sparkles className="h-6 w-6" />
            <p className="mt-4 text-sm text-white/70">Today&apos;s Recommendation</p>
            <h3 className="mt-1 text-xl font-semibold">Renew motor today</h3>
            <p className="mt-2 text-sm text-white/70">Lock current price before a likely Rs 350 increase.</p>
            <Button asChild className="mt-5" variant="secondary"><Link href="/renewals">Renew</Link></Button>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-5">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <p className="mt-4 text-sm text-muted-foreground">Risk Alert</p>
            <h3 className="mt-1 text-xl font-semibold">Premium may rise</h3>
            <p className="mt-2 text-sm text-muted-foreground">Motor renewal delayed by 7 days can raise price.</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-5">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Coverage Gap</p>
            <h3 className="mt-1 text-xl font-semibold">Cyber is missing</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add Rs 24 lakh protection for Rs 150/month.</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-5">
            <Plane className="h-6 w-6 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Upcoming Renewal</p>
            <h3 className="mt-1 text-xl font-semibold">Travel booked?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get cover in 18 seconds for Goa.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <AssistantPanel />
        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            {["Coverage gaps", "Claim readiness", "Renewal savings", "Emergency routing"].map((item) => (
              <div key={item} className="rounded-md border bg-background/60 p-4">
                <p className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" />{item}</p>
                <p className="mt-1 text-sm text-muted-foreground">Aurora monitors this area and keeps recommendations current.</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
