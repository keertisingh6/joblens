"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ChevronDown, FileText, Hospital, ShieldCheck, UsersRound } from "lucide-react";
import type { Policy } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PolicyCard({ policy }: { policy: Policy }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.article layout className="rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <button type="button" onClick={() => setOpen((value) => !value)} className="w-full text-left">
        <div className={`mb-6 h-1.5 w-24 rounded-full bg-gradient-to-r ${policy.color}`} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{policy.provider}</p>
            <h3 className="mt-3 text-2xl font-semibold">{policy.name}</h3>
          </div>
          <Badge variant="secondary">{policy.status}</Badge>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Coverage</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(policy.coverage)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Renew</p>
            <p className="mt-1 text-sm font-semibold">{formatDate(policy.renewalDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Protection</p>
            <p className="mt-1 text-xl font-semibold">{policy.score}%</p>
          </div>
        </div>
        <p className="mt-5 text-sm font-medium text-primary">Details -&gt;</p>
      </button>
      <div className="mt-6 border-t pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersRound className="h-4 w-4" />
            {policy.members.join(", ")}
          </span>
          <div className="flex items-center gap-1">
            <Button asChild size="sm" variant="ghost">
              <Link href={`/policies/${policy.id}`}>
                <ArrowUpRight className="h-4 w-4" />
                View
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen((value) => !value)}>
              <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2">
              {[
                { title: "Coverage", value: formatCurrency(policy.coverage), icon: ShieldCheck },
                { title: "Benefits", value: policy.benefits.join(", "), icon: FileText },
                { title: "Family", value: policy.members.join(", "), icon: UsersRound },
                { title: "Hospital list", value: "Apollo, Fortis, Kokilaben, Manipal", icon: Hospital }
              ].map((item) => (
                <div key={item.title} className="rounded-md bg-muted p-3">
                  <item.icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">{item.title}</p>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
