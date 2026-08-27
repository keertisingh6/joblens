import { Car, Heart, Home, Laptop, Plane, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

const scores = [
  { label: "Health", value: 100, icon: Heart },
  { label: "Motor", value: 92, icon: Car },
  { label: "Home", value: 75, icon: Home },
  { label: "Travel", value: 20, icon: Plane },
  { label: "Cyber", value: 0, icon: Laptop }
];

export function ProtectionScore() {
  return (
    <Card className="glass-panel">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Protection Score</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-6xl font-semibold tracking-normal">94</span>
              <span className="pb-2 text-lg font-bold text-emerald-500">/100</span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">Healthy</span>
        </div>
        <div className="mt-6 space-y-4">
          {scores.map((score) => (
            <div key={score.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">{score.label}</span>
                <span className="text-muted-foreground">{score.value}%</span>
              </div>
              <Progress value={score.value} className={score.value === 0 ? "opacity-40" : ""} />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border bg-background/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Aurora AI says
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            You do not have Cyber Insurance. Adding it increases your score to 98.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProtectionDNA() {
  return (
    <Card className="glass-panel overflow-hidden">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground">Protection DNA</p>
        <div className="mt-6 grid grid-cols-5 gap-4">
          {scores.map((score) => (
            <div key={score.label} className="flex flex-col items-center">
              <div className="flex h-44 w-full items-end justify-center rounded-full bg-muted p-1.5">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-primary via-amber-500 to-sky-400"
                  style={{ height: `${Math.max(score.value, 8)}%` }}
                />
              </div>
              <score.icon className="mt-3 h-5 w-5 text-primary" />
              <p className="mt-1 text-xs font-bold">{score.label}</p>
              <p className="text-xs text-muted-foreground">{score.value}%</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-md border bg-muted p-4">
          <p className="text-sm text-muted-foreground">Overall DNA score</p>
          <p className="text-4xl font-semibold">87%</p>
        </div>
      </CardContent>
    </Card>
  );
}
