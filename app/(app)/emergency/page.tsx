import { Ambulance, Car, CreditCard, HeartPulse, MapPin, Navigation, Phone, Siren } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmergencyPage() {
  return (
    <div>
      <PageHeader title="Emergency Hub" description="Fast access to care, roadside support, travel help, and policy information when timing matters." icon={Ambulance} />
      <Card className="mb-6 overflow-hidden border-red-500/30 bg-red-600 text-white shadow-md">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <Siren className="h-14 w-14" />
          <h2 className="mt-4 text-6xl font-semibold tracking-normal">SOS</h2>
          <p className="mt-3 max-w-lg text-white/80">Tap to alert emergency contacts, share live location, and open your medical card.</p>
          <Button size="lg" variant="secondary" className="mt-6 text-red-700">Activate Emergency</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { title: "Ambulance", icon: Ambulance, href: "tel:108" },
          { title: "Police", icon: Siren, href: "tel:100" },
          { title: "Roadside", icon: Car, href: "tel:+918005550199" },
          { title: "Doctor", icon: HeartPulse, href: "tel:+918005550101" },
          { title: "Share Location", icon: MapPin, href: "#" },
          { title: "Medical Card", icon: CreditCard, href: "/profile" }
        ].map((item) => (
          <Card key={item.title} className="glass-panel transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <item.icon className="h-7 w-7 text-primary" />
              <p className="mt-4 font-bold">{item.title}</p>
              <Button asChild variant="ghost" className="mt-3 px-0 text-primary">
                <a href={item.href}>Open</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-panel mt-6">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Nearest hospital</p>
            <h3 className="text-2xl font-semibold">Apollo Pune</h3>
            <p className="mt-1 text-sm text-muted-foreground">ETA 8 minutes · Cashless partner</p>
          </div>
          <Button asChild><a href="tel:+918005550101"><Phone className="h-4 w-4" /> Call</a></Button>
          <Button variant="secondary"><Navigation className="h-4 w-4" /> Navigation</Button>
        </CardContent>
      </Card>
    </div>
  );
}
