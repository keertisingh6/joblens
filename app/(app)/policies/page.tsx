import Link from "next/link";
import { Sparkles, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PolicyCard } from "@/components/policy-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { policies } from "@/lib/data";

export default function PoliciesPage() {
  return (
    <div>
      <PageHeader
        title="Protect"
        description="Your Apple Wallet-style policy wallet plus AI-detected life events that suggest the next protection layer."
        icon={WalletCards}
        action={<Button asChild><Link href="/life-events"><Sparkles className="h-4 w-4" /> Life Events</Link></Button>}
      />
      <Card className="glass-panel mb-6">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aurora AI Recommendation</p>
            <h3 className="mt-1 text-2xl font-semibold">Add Cyber Insurance to reach 98 protection score.</h3>
          </div>
          <Button variant="premium">Improve score</Button>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {policies.map((policy) => <PolicyCard key={policy.id} policy={policy} />)}
      </div>
    </div>
  );
}
