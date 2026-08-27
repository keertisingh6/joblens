"use client";

import { Controller, useForm } from "react-hook-form";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settingsSchema, type SettingsInput } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";

const settingRows: { key: keyof SettingsInput; title: string; description: string }[] = [
  { key: "emailAlerts", title: "Email alerts", description: "Policy, claim, and renewal updates." },
  { key: "smsAlerts", title: "SMS alerts", description: "High-priority emergency and payment notifications." },
  { key: "biometricLogin", title: "Biometric login", description: "Use device authentication where supported." },
  { key: "marketing", title: "Savings insights", description: "Relevant offers, rewards, and bundle opportunities." }
];

export default function SettingsPage() {
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { emailAlerts: true, smsAlerts: true, biometricLogin: false, marketing: true }
  });

  return (
    <div>
      <PageHeader title="Settings" description="Control alerts, privacy, authentication, and product recommendations." icon={Settings} />
      <Card className="glass-panel">
        <CardContent className="p-5">
          <form onSubmit={form.handleSubmit(() => undefined)} className="space-y-4">
            {settingRows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4 rounded-md border bg-background/60 p-4">
                <div>
                  <Label>{row.title}</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{row.description}</p>
                </div>
                <Controller control={form.control} name={row.key} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
              </div>
            ))}
            <Button type="submit">Save preferences</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
