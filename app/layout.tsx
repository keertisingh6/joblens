import type { Metadata } from "next";
import "./globals.css";
import "@/styles/print.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "JobLens",
  description: "Browser-first recruitment cybersecurity extension and forensic intelligence center for detecting fake jobs, advance-fee scams, and recruiter impersonation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
