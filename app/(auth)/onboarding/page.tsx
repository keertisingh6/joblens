"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations";

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "Aarav Mehta",
      age: 34,
      household: 3,
      ownsVehicle: true,
      riskPreference: "balanced"
    }
  });

  function onSubmit(values: OnboardingInput) {
    completeOnboarding(values.fullName);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="max-w-xl text-4xl font-bold tracking-normal md:text-6xl">Insurance that feels native to digital banking.</h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Build a cleaner protection profile across health, motor, home, travel, and emergency planning in minutes.
          </p>
        </section>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Personalize Indus Protect</CardTitle>
            <CardDescription>Your answers tune recommendations, renewal alerts, and cross-sell insights.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...form.register("fullName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" {...form.register("age")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="household">Household size</Label>
                <Input id="household" type="number" {...form.register("household")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Coverage style</Label>
                <Controller
                  control={form.control}
                  name="riskPreference"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced protection</SelectItem>
                        <SelectItem value="maximum">Maximum coverage</SelectItem>
                        <SelectItem value="value">Value optimized</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-4 md:col-span-2">
                <div>
                  <Label>Motor owner</Label>
                  <p className="text-sm text-muted-foreground">Enable motor policy recommendations.</p>
                </div>
                <Controller
                  control={form.control}
                  name="ownsVehicle"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
              <Button className="md:col-span-2" size="lg" type="submit">
                Finish setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
