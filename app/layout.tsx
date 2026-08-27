import type { Metadata } from "next";
import "./globals.css";
import "@/styles/print.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "JobLens",
  description: "Analyze job opportunities for potential recruitment scam indicators before you apply."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
