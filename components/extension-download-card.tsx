"use client";

import { useState } from "react";
import {
  Download,
  Copy,
  Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateExtensionZip } from "@/lib/extension-builder";

export function ExtensionDownloadCard() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "JobLens-Chrome-Extension-v2.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate ZIP:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyPath = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-sky-950/70 via-indigo-950/60 to-slate-900 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px] uppercase tracking-wider font-bold">
              Chrome Manifest V3
            </Badge>
            <span className="text-xs text-slate-400">Side Panel Architecture</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Install JobLens Chrome Extension
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Get instant, browser-native protection as you browse LinkedIn, Naukri, Indeed, careers portals, and recruiter messages. Opens automatically in Chrome&apos;s native Side Panel.
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-11 px-5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/30 flex items-center gap-2"
          >
            <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
            {isDownloading ? "Generating Package..." : "Download Chrome Extension (.zip)"}
          </Button>
        </div>
      </div>

      {/* 3-Step Setup Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs mb-2">
              1
            </div>
            <CardTitle className="text-sm font-bold text-slate-100">Extract ZIP Archive</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Download and extract <code className="text-sky-300 text-[11px]">JobLens-Chrome-Extension-v2.zip</code> to a folder on your computer.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span className="truncate">JobLens-Chrome-Extension/</span>
              <span className="text-[10px] text-emerald-400">Ready</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs mb-2">
              2
            </div>
            <CardTitle className="text-sm font-bold text-slate-100">Open Chrome Extensions</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Go to <code className="text-sky-300 text-[11px]">chrome://extensions</code> and turn on <strong>Developer mode</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span>chrome://extensions</span>
              <button
                onClick={() => copyPath("chrome://extensions", "step2")}
                className="text-xs text-slate-400 hover:text-sky-400"
              >
                {copiedStep === "step2" ? "✓" : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs mb-2">
              3
            </div>
            <CardTitle className="text-sm font-bold text-slate-100">Load Unpacked</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Click <strong>&quot;Load unpacked&quot;</strong> and select the extracted folder. Press <code className="text-sky-300 text-[11px]">Ctrl+Shift+J</code> to open.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span>Shortkey: Ctrl+Shift+J</span>
              <Badge variant="outline" className="text-[9px] text-sky-400 border-sky-500/30">Side Panel</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manifest & Architecture Details */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            Chrome Manifest V3 Architecture & Least-Privilege Declaration
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Engineered with strict zero-trust security principles. Does not access private cookies or background browsing history.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-bold text-sky-400 block text-[11px]">sidePanel</span>
              <span className="text-slate-400 text-[10px]">Native docked assistant beside web pages</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-bold text-sky-400 block text-[11px]">storage</span>
              <span className="text-slate-400 text-[10px]">Local encrypted token & scan history</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-bold text-sky-400 block text-[11px]">activeTab</span>
              <span className="text-slate-400 text-[10px]">Reads DOM only when user inspects job</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-bold text-sky-400 block text-[11px]">contextMenus</span>
              <span className="text-slate-400 text-[10px]">Right-click &quot;Scan Selection with JobLens&quot;</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
