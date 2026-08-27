import { ArrowRight, Laptop, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProtectionSimulator() {
  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader>
        <CardTitle>Protection Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-background/70 p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Laptop className="h-4 w-4" /> What if you add Cyber Insurance?</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div><p className="text-xs text-muted-foreground">Score</p><p className="text-3xl font-semibold">94</p></div>
            <ArrowRight className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">New Score</p><p className="text-3xl font-semibold text-emerald-600 dark:text-emerald-300">98</p></div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Monthly Cost</p>
            <p className="text-2xl font-semibold">+Rs 150</p>
          </div>
          <div className="rounded-lg border bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Potential Protection</p>
            <p className="text-2xl font-semibold">Rs 24 lakh</p>
          </div>
        </div>
        <div className="rounded-lg border bg-background/70 p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" /> Moving to Bangalore?</p>
          <p className="mt-2 text-sm text-muted-foreground">Aurora will recalculate health network, rental cover, and motor garage access.</p>
        </div>
        <Button className="w-full">Run simulator</Button>
      </CardContent>
    </Card>
  );
}
