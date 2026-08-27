import { Flame, Gift, Lock, Sparkles, Star, Trophy, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { rewards } from "@/lib/data";

export default function RewardsPage() {
  const points = 5200;
  return (
    <div>
      <PageHeader title="Rewards" description="Earn points for preventive care, safe driving, clean claims, and renewal readiness." icon={Gift} />
      <Card className="mb-6 overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-700 to-slate-950 text-white shadow-md">
        <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-white/60">Available balance</p>
            <p className="text-4xl font-bold">{points.toLocaleString()} pts</p>
            <p className="mt-2 text-sm text-white/60">Protection Level: Guardian III</p>
          </div>
          <Button variant="secondary"><Sparkles className="h-4 w-4" /> 500 XP to Elite Guardian</Button>
        </CardContent>
      </Card>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { title: "Safe Driver", icon: Trophy },
          { title: "Healthy Month", icon: Star },
          { title: "Family Guardian", icon: UsersRound },
          { title: "Renewal Streak", icon: Flame }
        ].map((item) => (
          <Card key={item.title} className="glass-panel">
            <CardContent className="p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <p className="mt-4 font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">Achievement unlocked</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-panel mb-6">
        <CardContent className="p-6">
          <div className="rounded-2xl border border-dashed bg-gradient-to-br from-zinc-900 to-zinc-700 p-8 text-center text-white">
            <Sparkles className="mx-auto h-8 w-8 text-amber-300" />
            <h3 className="mt-4 text-2xl font-semibold">Scratch Card</h3>
            <p className="mt-2 text-white/70">Renew motor policy to reveal a guaranteed reward.</p>
            <Button className="mt-5" variant="secondary">Unlock</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {rewards.map((reward) => (
          <Card key={reward.id} className="glass-panel">
            <CardContent className="p-5">
              <Badge variant={reward.unlocked ? "success" : "outline"}>{reward.category}</Badge>
              <h3 className="mt-5 min-h-12 font-semibold">{reward.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{reward.points.toLocaleString()} points</p>
              <Button className="mt-5 w-full" variant={reward.unlocked ? "default" : "secondary"} disabled={!reward.unlocked}>
                {reward.unlocked ? "Redeem" : <><Lock className="h-4 w-4" /> Locked</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
