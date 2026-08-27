import Link from "next/link";
import { Ambulance, Bot, Car, CheckCircle2, FilePlus2, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { ActionCard } from "@/components/action-card";
import { RecommendationBanner } from "@/components/recommendation-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const insights = [
    { title: "Bundle Home + Motor", detail: "Save Rs 220/month" },
    { title: "Health cover is sufficient", detail: "No upgrade needed right now" },
    { title: "Travel insurance recommended", detail: "Goa trip detected" }
  ];
  const activities = ["Claim approved", "Wellness reward earned", "Motor renewal reminder"];

  return (
    <div className="space-y-8">
      <RecommendationBanner />
      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="executive-panel overflow-hidden border-slate-900/20 text-white shadow-md">
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-white/65">Good evening, Aarav</p>
                <div className="mt-4 flex items-end gap-4">
                  <span className="text-6xl font-semibold tracking-normal md:text-7xl">94</span>
                  <div className="pb-4">
                    <p className="text-xl font-semibold">Protection Score</p>
                    <p className="text-sm text-emerald-300">Healthy · +4 possible</p>
                  </div>
                </div>
                <p className="mt-5 text-base leading-7 text-white/72">Today&apos;s priority: review motor renewal, evaluate cyber cover, and protect the detected Goa trip.</p>
                <Button asChild className="mt-6" size="lg" variant="secondary">
                  <Link href="/assistant">
                    <Sparkles className="h-4 w-4" />
                    Review recommendations
                  </Link>
                </Button>
              </div>
              <div className="w-full rounded-2xl border border-white/10 bg-white/8 p-6 md:max-w-sm">
                <p className="text-sm font-medium text-white/60">Operating brief</p>
                <div className="mt-4 space-y-3">
                  {["Motor renewal: 18 days", "Claim approved", "Rs 220 savings available", "Emergency card ready"].map((item) => (
                    <div key={item} className="rounded-md bg-white/10 p-3 text-sm font-medium">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Next Important Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-background/70 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <p className="font-semibold">Motor Renewal</p>
                  </div>
                  <p className="mt-3 text-4xl font-semibold">18 days</p>
                  <p className="mt-1 text-sm text-muted-foreground">Premium Rs 1,260 · likely increase Rs 350</p>
                </div>
                <Button asChild><Link href="/renewals">Review</Link></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_0.8fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.title} className="flex items-start gap-4 rounded-2xl border bg-background/70 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-semibold">{insight.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((activity) => (
              <div key={activity} className="flex items-center gap-3 rounded-2xl bg-muted p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <p className="font-medium">{activity}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <ActionCard title="File Claim" href="/claims" icon={FilePlus2} />
          <ActionCard title="Emergency" href="/emergency" icon={Ambulance} tone="bg-red-500/12 text-red-600" />
          <ActionCard title="Policies" href="/policies" icon={WalletCards} />
          <ActionCard title="Ask Aurora" href="/assistant" icon={Bot} />
        </div>
      </section>
    </div>
  );
}
