import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { policies } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const policy = policies.find((item) => item.id === id);
  if (!policy) notFound();

  return (
    <div>
      <PageHeader title={policy.name} description={`${policy.provider} · ${policy.category} insurance`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className={`rounded-lg bg-gradient-to-br ${policy.color} p-6 text-white`}>
              <Badge className="bg-white/18 text-white">{policy.status}</Badge>
              <h2 className="mt-8 text-3xl font-bold">{formatCurrency(policy.coverage)}</h2>
              <p className="text-white/78">Total coverage limit</p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div><p className="text-sm opacity-75">Premium</p><p className="font-bold">{formatCurrency(policy.premium)}/mo</p></div>
                <div><p className="text-sm opacity-75">Renewal</p><p className="font-bold">{formatDate(policy.renewalDate)}</p></div>
                <div><p className="text-sm opacity-75">Score</p><p className="font-bold">{policy.score}%</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="space-y-4 p-6">
            <h3 className="font-semibold">Included benefits</h3>
            {policy.benefits.map((benefit) => (
              <div key={benefit} className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
