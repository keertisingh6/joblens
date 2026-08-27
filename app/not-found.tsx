import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <ShieldAlert className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-5 text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">This insurance workspace page is not available.</p>
        <Button asChild className="mt-6"><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>
    </main>
  );
}
