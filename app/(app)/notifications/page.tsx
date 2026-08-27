"use client";

import { Bell } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export default function NotificationsPage() {
  const notifications = useAppStore((state) => state.notifications);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);
  const markAllRead = useAppStore((state) => state.markAllRead);

  return (
    <div>
      <PageHeader title="Notifications" description="Priority alerts for claims, renewals, rewards, and account changes." icon={Bell} action={<Button onClick={markAllRead}>Mark all read</Button>} />
      <div className="grid gap-4">
        {notifications.map((item) => (
          <Card key={item.id} className="glass-panel">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  <Badge variant={item.priority === "High" ? "danger" : item.priority === "Medium" ? "warning" : "secondary"}>{item.priority}</Badge>
                  {!item.read ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.time}</p>
              </div>
              <Button variant="secondary" disabled={item.read} onClick={() => markNotificationRead(item.id)}>
                {item.read ? "Read" : "Mark read"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
