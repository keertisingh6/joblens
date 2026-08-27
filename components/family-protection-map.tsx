import { AlertTriangle, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const members = [
  { name: "Aarav", score: 94 },
  { name: "Priya", score: 81 },
  { name: "Kabir", score: 68 }
];

export function FamilyProtectionMap() {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Family Protection Map</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((member) => (
          <div key={member.name} className="rounded-lg border bg-background/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 font-bold"><UserRound className="h-4 w-4 text-primary" />{member.name}</p>
              <p className="font-semibold">{member.score}%</p>
            </div>
            <Progress value={member.score} />
          </div>
        ))}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Kabir has no accident cover.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Recommended: add child accident rider.</p>
          <Button className="mt-3" size="sm" variant="secondary">Add rider</Button>
        </div>
      </CardContent>
    </Card>
  );
}
