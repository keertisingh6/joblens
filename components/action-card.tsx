import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActionCardProps {
  title: string;
  href: string;
  icon: LucideIcon;
  tone?: string;
}

export function ActionCard({ title, href, icon: Icon, tone = "bg-primary/10 text-primary" }: ActionCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="glass-panel transition duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-md">
        <CardContent className="flex h-28 flex-col justify-between p-4">
          <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
            <Icon className="h-5 w-5" />
          </span>
          <p className="font-bold">{title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
