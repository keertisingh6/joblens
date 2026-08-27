import { Home } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function HomeCoverPage() {
  return (
    <div>
      <PageHeader title="Home Cover" description="A recommended homeowners bundle that can reduce auto premium while adding property protection." icon={Home} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="rounded-lg bg-gradient-to-br from-sky-500 to-emerald-400 p-6 text-white">
              <p className="text-sm uppercase opacity-80">Recommended bundle</p>
              <h2 className="mt-4 text-3xl font-bold">Aurora Home Essential</h2>
              <p className="mt-2 max-w-xl text-white/82">Dwelling, personal property, liability, and temporary living expense coverage tuned for your profile.</p>
              <p className="mt-10 text-4xl font-bold">{formatCurrency(420000)}</p>
              <p className="text-white/78">Suggested dwelling coverage</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="space-y-4 p-6">
            <h3 className="text-xl font-bold">Bundle impact</h3>
            <div className="rounded-md border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Auto savings</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">$12/mo</p>
            </div>
            <div className="rounded-md border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Estimated home premium</p>
              <p className="text-2xl font-bold">$142/mo</p>
            </div>
            <Button className="w-full">Start quote</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
