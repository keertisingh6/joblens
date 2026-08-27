import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { profile } from "@/lib/data";
import { initials } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" description="Your identity, household, and communication preferences." icon={UserRound} />
      <Card className="glass-panel">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center rounded-lg border bg-background/60 p-6 text-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <h3 className="mt-4 text-xl font-bold">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.plan}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Email", value: profile.email, icon: Mail },
              { label: "Phone", value: profile.phone, icon: Phone },
              { label: "City", value: profile.city, icon: MapPin },
              { label: "Household", value: "3 protected members", icon: UserRound }
            ].map((item) => (
              <div key={item.label} className="rounded-md border bg-background/60 p-4">
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">{item.label}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
