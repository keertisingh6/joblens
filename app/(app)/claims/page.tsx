"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { ClaimTimeline } from "@/components/claim-timeline";
import { ClaimIntelligence } from "@/components/claim-intelligence";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { claims, policies } from "@/lib/data";
import { claimSchema, type ClaimInput } from "@/lib/validations";

export default function ClaimsPage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ClaimInput>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      policyId: policies[0].id,
      incidentDate: "2026-07-14",
      amount: 450,
      description: "Provider billed an urgent care visit and I would like reimbursement under my active health policy."
    }
  });

  function onSubmit() {
    setSubmitted(true);
  }

  return (
    <div>
      <PageHeader title="Claims" description="Submit, monitor, and resolve claims with cleaner document readiness." icon={ShieldCheck} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FilePlus2 className="h-5 w-5 text-primary" /> New claim</CardTitle>
            <CardDescription>Validated intake keeps the packet ready for review.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Policy</Label>
                <Select value={form.watch("policyId")} onValueChange={(value) => form.setValue("policyId", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {policies.map((policy) => <SelectItem key={policy.id} value={policy.id}>{policy.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Incident date</Label>
                  <Input id="incidentDate" type="date" {...form.register("incidentDate")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" {...form.register("amount")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register("description")} />
                {form.formState.errors.description ? <p className="text-xs text-destructive">{form.formState.errors.description.message}</p> : null}
              </div>
              <Button className="w-full" type="submit">Submit claim packet</Button>
              {submitted ? <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">Claim draft validated and ready for document upload.</p> : null}
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          {claims.map((claim) => <ClaimIntelligence key={claim.id} claim={claim} />)}
          <ClaimTimeline claim={claims[0]} />
        </div>
      </div>
    </div>
  );
}
