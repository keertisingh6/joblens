import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex gap-3">
        {Icon ? (
          <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <h2 className="text-2xl font-bold tracking-normal md:text-3xl">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
