"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bot, Menu, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { navItems } from "@/lib/data";
import { cn, initials } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAppStore((state) => state.user);
  const unread = useAppStore((state) => state.notifications.filter((item) => !item.read).length);

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r bg-background p-5 lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2 py-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-lg font-bold">Indus Protect</span>
            <span className="text-xs text-muted-foreground">by IndusInd Bank</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary/10 text-primary"
                )}
              >
                {active ? <motion.span layoutId="nav-pill" className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" /> : null}
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b bg-background px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold md:text-2xl">Good Morning, {user.name.split(" ")[0]}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your Protection Score is 94</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/assistant">
                <Bot className="h-4 w-4" />
                Aurora AI
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="hidden md:inline-flex">
              <Link href="/strategy">
                <Zap className="h-4 w-4" />
                Demo Mode
              </Link>
            </Button>
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" /> : null}
              </Link>
            </Button>
            <Link href="/profile" aria-label="Profile">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <main className="container pb-24 pt-8 md:py-10">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/92 px-2 py-2 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-md py-2 text-[11px] font-semibold text-muted-foreground", active && "bg-primary/10 text-primary")}>
              <item.icon className="h-6 w-6" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
