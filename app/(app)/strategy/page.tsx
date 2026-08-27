import { BarChart3, CheckCircle2, Flag, Lightbulb, Rocket, Target, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const strategy = [
  {
    title: "Target Persona",
    icon: UsersRound,
    points: ["28-40 urban salaried customer", "Existing IndusInd savings or credit card relationship", "Owns health and motor policies across different providers"]
  },
  {
    title: "Product Vision",
    icon: Lightbulb,
    points: ["Move insurance from transaction to protection habit", "Make IndusInd the trusted one-stop protection layer", "Use bank context to personalize without overwhelming"]
  },
  {
    title: "North Star",
    icon: Target,
    points: ["Monthly protected customers", "Renewal completion rate", "Claim resolution satisfaction"]
  },
  {
    title: "GTM",
    icon: Rocket,
    points: ["Launch inside IndusMobile and net banking", "Bundle with salary accounts and premium cards", "Use branch RMs for assisted onboarding"]
  }
];

const roadmap = [
  { phase: "0-3 months", work: "Policy wallet, reminders, partner quotes, assisted onboarding" },
  { phase: "3-6 months", work: "Digital claims, AI Saathi, health and motor service integrations" },
  { phase: "6-12 months", work: "Personalization engine, fraud signals, embedded renewals and rewards" }
];

export default function StrategyPage() {
  return (
    <div>
      <PageHeader
        title="Hackathon Demo"
        description="This mode explains what is simulated, what the prototype demonstrates, and how it maps to the IndusInd General Insurance capstone."
        icon={BarChart3}
      />
      <Card className="glass-panel mb-6">
        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          {["Simulated policies", "Simulated Aurora AI", "Mock claims and life events"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-md bg-muted p-4 font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {strategy.map((item) => (
          <Card key={item.title} className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <item.icon className="h-5 w-5 text-primary" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.points.map((point) => (
                <div key={point} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{point}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              Product Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roadmap.map((item) => (
              <div key={item.phase} className="rounded-md border bg-background/60 p-4">
                <Badge variant="secondary">{item.phase}</Badge>
                <p className="mt-3 font-semibold">{item.work}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="space-y-4 p-6">
            <h3 className="text-xl font-bold">Evaluation Coverage</h3>
            {[
              "Problem understanding and research",
              "Product strategy and innovation",
              "Clickable prototype",
              "Execution metrics, roadmap, GTM",
              "LinkedIn-ready story"
            ].map((item) => (
              <div key={item} className="rounded-md bg-muted p-3 text-sm font-medium">{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
