"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Globe,
  HelpCircle,
  History,
  Info,
  Link2,
  Lock,
  Mail,
  PieChart,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

import type {
  CyberThreatReport,
  JobInputForm,
  ThreatSeverity
} from "@/lib/security/types";
import { runThreatAnalysis } from "@/lib/security/rule-engine";
import {
  clearAllScanReports,
  deleteScanReport,
  DEMO_PRESET_SCANS,
  formatReportAsPlainText,
  getScanHistory,
  getSecurityStats,
  saveScanReport
} from "@/lib/security/history-store";
import { SCAM_KNOWLEDGE_BASE } from "@/lib/security/knowledge-base";
import { getThreatIntelStatus } from "@/lib/security/threat-intelligence";
import {
  extractEmailDomain,
  extractUrlHostname,
  findRecognizedAts,
  normalizeCompanyName
} from "@/lib/security/normalizer";
import { FREE_EMAIL_PROVIDERS } from "@/lib/security/constants";
import { ExtensionSimulator } from "@/components/extension-simulator";
import { ExtensionDownloadCard } from "@/components/extension-download-card";

type Screen = "extension" | "home" | "analyze" | "results" | "dashboard" | "radar" | "analyst" | "safety" | "download";

const INITIAL_FORM: JobInputForm = {
  jobTitle: "",
  companyName: "",
  recruiterEmail: "",
  applicationUrl: "",
  jobDescription: "",
  emailHeaders: ""
};

export default function JobLensApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("extension");
  const [formData, setFormData] = useState<JobInputForm>(INITIAL_FORM);
  const [currentReport, setCurrentReport] = useState<CyberThreatReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [showAdvancedHeaders, setShowAdvancedHeaders] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [historyList, setHistoryList] = useState<CyberThreatReport[]>([]);
  const [radarFilter, setRadarFilter] = useState<string>("ALL");
  const [checkedSafetyItems, setCheckedSafetyItems] = useState<Record<string, boolean>>({});

  // Load scan history on mount
  useEffect(() => {
    setHistoryList(getScanHistory());
  }, []);

  const historyStats = useMemo(() => {
    return getSecurityStats(historyList);
  }, [historyList]);

  const threatIntel = useMemo(() => {
    return getThreatIntelStatus();
  }, []);

  // Live input heuristics
  const liveEmailDomain = useMemo(() => {
    return extractEmailDomain(formData.recruiterEmail);
  }, [formData.recruiterEmail]);

  const liveEmailIsPublic = useMemo(() => {
    return FREE_EMAIL_PROVIDERS.includes(liveEmailDomain);
  }, [liveEmailDomain]);

  const liveUrlParsed = useMemo(() => {
    return extractUrlHostname(formData.applicationUrl);
  }, [formData.applicationUrl]);

  const liveAtsCheck = useMemo(() => {
    return findRecognizedAts(liveUrlParsed.hostname);
  }, [liveUrlParsed.hostname]);

  // Handle Preset Selection
  const handleLoadPreset = (presetIndex: number) => {
    const demo = DEMO_PRESET_SCANS[presetIndex];
    if (!demo) return;
    setFormData({
      jobTitle: demo.jobTitle || "",
      companyName: demo.companyName,
      recruiterEmail: demo.recruiterEmail === "N/A" ? "" : demo.recruiterEmail,
      applicationUrl: demo.applicationUrl === "N/A" ? "" : demo.applicationUrl,
      jobDescription: demo.jobDescription,
      emailHeaders: ""
    });
    setCurrentScreen("analyze");
  };

  // Run Real Threat Scan
  const handleStartScan = () => {
    if (!formData.jobDescription.trim() && !formData.companyName.trim() && !formData.recruiterEmail.trim()) {
      return;
    }

    setIsScanning(true);
    setScanStep(1);

    setTimeout(() => setScanStep(2), 350);
    setTimeout(() => setScanStep(3), 700);
    setTimeout(() => setScanStep(4), 1050);

    setTimeout(() => {
      const report = runThreatAnalysis(formData);
      setCurrentReport(report);
      saveScanReport(report);
      setHistoryList(getScanHistory());
      setIsScanning(false);
      setScanStep(0);
      setCurrentScreen("results");
    }, 1400);
  };

  const handleCopyReport = () => {
    if (!currentReport) return;
    const text = formatReportAsPlainText(currentReport);
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleDownloadReport = (format: "txt" | "json") => {
    if (!currentReport) return;
    let content = "";
    let mimeType = "text/plain";
    let fileName = `joblens-threat-report-${currentReport.id}`;

    if (format === "json") {
      content = JSON.stringify(currentReport, null, 2);
      mimeType = "application/json";
      fileName += ".json";
    } else {
      content = formatReportAsPlainText(currentReport);
      fileName += ".txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteHistory = (id: string) => {
    deleteScanReport(id);
    setHistoryList(getScanHistory());
  };

  const handleClearHistory = () => {
    clearAllScanReports();
    setHistoryList([]);
  };

  const getSeverityBadgeClass = (severity: ThreatSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "LOW":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-500 stroke-red-500";
    if (score >= 60) return "text-orange-500 stroke-orange-500";
    if (score >= 30) return "text-amber-500 stroke-amber-500";
    return "text-emerald-500 stroke-emerald-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* TOP CYBERSECURITY HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            id="brand-logo"
            onClick={() => setCurrentScreen("home")}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 dark:from-white dark:via-indigo-200 dark:to-blue-200 bg-clip-text text-transparent">
                  JOBLENS
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-300/40">
                  v2.4 CyberSec
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 font-medium">
                Recruitment Threat Intelligence Engine
              </p>
            </div>
          </div>

          {/* NAVIGATION BAR */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <button
              id="nav-extension-btn"
              onClick={() => setCurrentScreen("extension")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === "extension"
                  ? "bg-sky-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Live Extension</span>
            </button>

            <button
              id="nav-scanner-btn"
              onClick={() => setCurrentScreen("analyze")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === "analyze" || currentScreen === "results"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Deep Scanner</span>
            </button>

            <button
              id="nav-radar-btn"
              onClick={() => setCurrentScreen("radar")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === "radar"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Scam Radar</span>
            </button>

            <button
              id="nav-hub-btn"
              onClick={() => {
                setHistoryList(getScanHistory());
                setCurrentScreen("dashboard");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {historyList.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {historyList.length}
                </span>
              )}
            </button>

            <button
              id="nav-safety-btn"
              onClick={() => setCurrentScreen("safety")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === "safety"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Safety Toolkit</span>
            </button>

            <button
              id="nav-download-btn"
              onClick={() => setCurrentScreen("download")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === "download"
                  ? "bg-sky-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install (.zip)</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              id="header-scan-now-btn"
              size="sm"
              onClick={() => setCurrentScreen("analyze")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Deep Scan
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN BODY CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {/* ========================================================================= */}
        {/* SCREEN 0: PRIMARY CHROME EXTENSION LIVE SIMULATOR */}
        {/* ========================================================================= */}
        {currentScreen === "extension" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Interactive Browser & Side Panel Simulator */}
            <ExtensionSimulator
              onOpenFullReport={(report) => {
                setCurrentReport(report);
                setCurrentScreen("results");
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN: DOWNLOAD EXTENSION & SETUP GUIDE */}
        {/* ========================================================================= */}
        {currentScreen === "download" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Chrome Extension Installation
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Load the Manifest V3 package directly in Google Chrome, Brave, Edge, or Chromium browsers.
              </p>
            </div>
            <ExtensionDownloadCard />
          </div>
        )}
        {/* ========================================================================= */}
        {/* SCREEN 1: HOME / LANDING OVERVIEW */}
        {/* ========================================================================= */}
        {currentScreen === "home" && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-8 sm:p-12 shadow-sm">
              <div className="absolute -right-16 -top-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Omni_CyberTech_10 • Explainable Recruitment Threat Forensics</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                  See beyond the job posting. <br />
                  <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Expose recruitment cyber threats before you apply.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  JobLens is an explainable cybersecurity platform that dissects job offers, recruiter domains, communication channels, and email headers to detect advance-fee fraud, credential harvesting, credential spoofing, and social engineering.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button
                    id="hero-start-scan-btn"
                    size="lg"
                    onClick={() => setCurrentScreen("analyze")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 h-12 shadow-md shadow-indigo-500/20 flex items-center gap-2"
                  >
                    <span>Launch Threat Scanner</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <Button
                    id="hero-view-radar-btn"
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentScreen("radar")}
                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 h-12 px-5"
                  >
                    <Zap className="w-4 h-4 mr-2 text-amber-500" />
                    <span>Explore Scam Radar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* ONE-CLICK TEST PRESETS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    One-Click Threat Simulation Scenarios
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Load verified deterministic cybersecurity test cases to inspect the engine&apos;s evaluation in real time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Preset 1: Critical Scam */}
                <Card
                  id="preset-scam-card"
                  onClick={() => handleLoadPreset(0)}
                  className="cursor-pointer hover:border-red-400 dark:hover:border-red-600/70 transition-all hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">
                        CRITICAL (92/100)
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">Scenario #1</span>
                    </div>
                    <CardTitle className="text-base font-bold group-hover:text-red-600 transition-colors">
                      Advance-Fee & Telegram Urgency Scam
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      Fake MacBook equipment deposit demand, public @gmail recruiter, 24h artificial pressure, and bit.ly link.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex items-center justify-between text-xs font-medium text-red-600 dark:text-red-400">
                    <span>Inspect Critical Threat</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>

                {/* Preset 2: Moderate Warning */}
                <Card
                  id="preset-medium-card"
                  onClick={() => handleLoadPreset(2)}
                  className="cursor-pointer hover:border-amber-400 dark:hover:border-amber-600/70 transition-all hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        MEDIUM (42/100)
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">Scenario #2</span>
                    </div>
                    <CardTitle className="text-base font-bold group-hover:text-amber-600 transition-colors">
                      Unverified Early-Stage Startup
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      Public email address and Google Forms intake link without enterprise ATS infrastructure.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex items-center justify-between text-xs font-medium text-amber-600 dark:text-amber-400">
                    <span>Inspect Medium Warning</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>

                {/* Preset 3: Legitimate Enterprise */}
                <Card
                  id="preset-legit-card"
                  onClick={() => handleLoadPreset(1)}
                  className="cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600/70 transition-all hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        LOW RISK (12/100)
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">Scenario #3</span>
                    </div>
                    <CardTitle className="text-base font-bold group-hover:text-emerald-600 transition-colors">
                      Verified Enterprise Tech Role
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      Corporate @amazon.com recruiter domain, official amazon.jobs portal, structured technical interview loops.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span>Inspect Legitimate Profile</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CYBERSECURITY METHODOLOGY PILLARS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">Financial Fraud Interception</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detects advance-fee traps, refundable equipment fees, crypto deposits, and fake check laundering schemes.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">Domain & Recruiter Trust</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Flags disposable webmail, typosquatting homoglyphs, and recruiter domain-to-employer brand mismatches.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">Credential & RAT Detection</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uncovers AnyDesk/TeamViewer remote installation traps, OTP harvesting, and premature government ID requests.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">Email Header Forensics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspects cryptographic SPF, DKIM, and DMARC origin headers to catch active sender address spoofing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: THREAT SCANNER / INPUT FORM */}
        {/* ========================================================================= */}
        {currentScreen === "analyze" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    Cyber Threat Scanner
                  </h1>
                  <Badge variant="outline" className="text-xs font-mono">
                    Deterministic Engine
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Paste the job posting, offer email, recruiter details, and optional email headers to execute a full threat assessment.
                </p>
              </div>

              {/* Quick load presets pill bar */}
              <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl border border-slate-300/60 dark:border-slate-800 text-xs">
                <span className="px-2 text-slate-500 font-medium hidden sm:inline">Presets:</span>
                <button
                  id="scanner-preset-scam"
                  onClick={() => handleLoadPreset(0)}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20 font-medium transition-colors"
                >
                  Scam (92)
                </button>
                <button
                  id="scanner-preset-med"
                  onClick={() => handleLoadPreset(2)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-medium transition-colors"
                >
                  Medium (42)
                </button>
                <button
                  id="scanner-preset-legit"
                  onClick={() => handleLoadPreset(1)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-medium transition-colors"
                >
                  Legit (12)
                </button>
              </div>
            </div>

            {/* Scanning Progress Overlay */}
            {isScanning ? (
              <Card className="border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 p-8 sm:p-12 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900 animate-ping opacity-50" />
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin flex items-center justify-center">
                    <ShieldAlert className="w-7 h-7 text-indigo-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Executing Cybersecurity Diagnostic...
                  </h3>
                  <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                    {scanStep === 1 && "Phase 1/4: Parsing domain infrastructure and Levenshtein lookalikes..."}
                    {scanStep === 2 && "Phase 2/4: Cross-referencing against 48+ fraud signatures & ATS platforms..."}
                    {scanStep === 3 && "Phase 3/4: Evaluating social engineering vectors and credential risks..."}
                    {scanStep === 4 && "Phase 4/4: Computing multidimensional threat index & safety actions..."}
                  </p>
                </div>

                <div className="max-w-md mx-auto bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${(scanStep / 4) * 100}%` }}
                  />
                </div>
              </Card>
            ) : (
              /* SCANNER FORM */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Job Title (Optional) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="job-title-input" className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                      Target Role / Job Title
                    </Label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        id="job-title-input"
                        placeholder="e.g. Remote Cloud Support Associate"
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="company-name-input" className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                        Declared Company Name <span className="text-red-500">*</span>
                      </Label>
                      {formData.companyName && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Normalized: {normalizeCompanyName(formData.companyName) || "N/A"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        id="company-name-input"
                        placeholder="e.g. Amazon / Apex Global Corp"
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Recruiter Email */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recruiter-email-input" className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                        Recruiter Email Address
                      </Label>
                      {liveEmailDomain && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            liveEmailIsPublic
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                              : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {liveEmailIsPublic ? "Public Webmail" : `@${liveEmailDomain}`}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        id="recruiter-email-input"
                        placeholder="e.g. talent-team@amazon.com or hr-amazon@gmail.com"
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={formData.recruiterEmail}
                        onChange={(e) => setFormData({ ...formData, recruiterEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Application URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="application-url-input" className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                        Application / Careers Link
                      </Label>
                      {liveAtsCheck.isAts && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                          ✓ Verified ATS: {liveAtsCheck.providerName}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Link2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        id="application-url-input"
                        placeholder="e.g. https://amazon.jobs/... or http://bit.ly/..."
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={formData.applicationUrl}
                        onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description / Message Content */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="job-description-input" className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                      Offer Letter / Email Text / Job Posting Details <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      {formData.jobDescription.length} characters
                    </span>
                  </div>
                  <Textarea
                    id="job-description-input"
                    rows={7}
                    placeholder="Paste the full job posting, email invitation, WhatsApp/Telegram chat log, or offer letter snippet here..."
                    className="bg-white dark:bg-slate-900 font-sans text-sm leading-relaxed"
                    value={formData.jobDescription}
                    onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  />
                </div>

                {/* ADVANCED FORENSICS COLLAPSIBLE */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                  <button
                    id="toggle-advanced-headers-btn"
                    type="button"
                    onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-500" />
                      <span>Advanced Forensics: Raw RFC 822 Email Headers (.EML / Mail Source)</span>
                      <Badge variant="outline" className="text-[10px]">
                        SPF / DKIM / DMARC
                      </Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedHeaders ? "rotate-180" : ""}`} />
                  </button>

                  {showAdvancedHeaders && (
                    <div className="space-y-2 pt-2 animate-in fade-in">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Paste the raw message headers from your email client (e.g. Gmail &quot;Show Original&quot; or Outlook &quot;View Source&quot;) to test for From/Reply-To discrepancies and cryptographic mail authentication verdicts.
                      </p>
                      <Textarea
                        id="email-headers-input"
                        rows={4}
                        placeholder="From: recruiter@amazon.com&#10;Reply-To: badactor@gmail.com&#10;Authentication-Results: spf=fail dkim=fail dmarc=fail..."
                        className="font-mono text-xs bg-white dark:bg-slate-950"
                        value={formData.emailHeaders}
                        onChange={(e) => setFormData({ ...formData, emailHeaders: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Client-side local analysis. Zero PII transmitted or stored externally.</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      id="scanner-reset-btn"
                      variant="outline"
                      onClick={() => setFormData(INITIAL_FORM)}
                      className="border-slate-300 dark:border-slate-700 text-xs h-11"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Clear Form
                    </Button>

                    <Button
                      id="scanner-execute-btn"
                      onClick={handleStartScan}
                      disabled={!formData.jobDescription.trim() && !formData.companyName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 h-11 shadow-md flex items-center gap-2 flex-1 sm:flex-initial"
                    >
                      <Search className="w-4 h-4" />
                      <span>Analyze Threat Profile</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: EXPLAINABLE THREAT RESULTS DASHBOARD */}
        {/* ========================================================================= */}
        {currentScreen === "results" && currentReport && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* TOP BAR ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    id="back-to-scanner-btn"
                    onClick={() => setCurrentScreen("analyze")}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    ← Back to Scanner
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-mono text-slate-400">
                    Report ID: {currentReport.id}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Threat Forensic Assessment
                </h1>
              </div>

              {/* ACTION TOOLBAR */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  id="copy-threat-summary-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyReport}
                  className="border-slate-300 dark:border-slate-700 text-xs"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy Threat Report
                    </>
                  )}
                </Button>

                <Button
                  id="export-txt-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport("txt")}
                  className="border-slate-300 dark:border-slate-700 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export .TXT
                </Button>

                <Button
                  id="export-json-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport("json")}
                  className="border-slate-300 dark:border-slate-700 text-xs"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* HERO SCORE & SUMMARY PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radial Gauge Card */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {/* SVG Circle Gauge */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-100 dark:text-slate-800 stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={`stroke-current transition-all duration-1000 ${getScoreColor(currentReport.overallScore)}`}
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - currentReport.overallScore / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {currentReport.overallScore}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                      Threat Index
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Badge className={`text-xs px-3 py-1 font-bold ${getSeverityBadgeClass(currentReport.overallSeverity)}`}>
                    {currentReport.overallSeverity} THREAT LEVEL
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    0–29: LOW • 30–59: MEDIUM • 60–79: HIGH • 80–100: CRITICAL
                  </p>
                </div>
              </Card>

              {/* Stated Details & Summary Card */}
              <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-indigo-500" />
                      Threat Executive Summary
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(currentReport.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    {currentReport.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Employer</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {currentReport.companyName || "Unspecified"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Target Role</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {currentReport.jobTitle || "Unspecified"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Signals Intercepted</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 block">
                        {currentReport.signals.length} threat markers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Educational Takeaway Callout */}
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                      Learn From This Scan: {currentReport.educationalTakeaway.title}
                    </span>
                    <span className="text-indigo-700 dark:text-indigo-300">
                      {currentReport.educationalTakeaway.explanation}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* 5-AXIS RISK MATRIX */}
            <div className="space-y-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Multidimensional Cybersecurity Risk Matrix
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Financial Fraud */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Advance-Fee Fraud</span>
                    <span className="text-xs font-mono font-bold">{currentReport.categoryScores.financialFraud}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        currentReport.categoryScores.financialFraud >= 60
                          ? "bg-red-500"
                          : currentReport.categoryScores.financialFraud >= 30
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${currentReport.categoryScores.financialFraud}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Equipment fees, deposit traps, paid training</p>
                </div>

                {/* 2. Credential Risk */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Credential / RAT Risk</span>
                    <span className="text-xs font-mono font-bold">{currentReport.categoryScores.credentialRisk}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        currentReport.categoryScores.credentialRisk >= 60
                          ? "bg-red-500"
                          : currentReport.categoryScores.credentialRisk >= 30
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${currentReport.categoryScores.credentialRisk}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">OTP requests, AnyDesk/TeamViewer, PII</p>
                </div>

                {/* 3. Phishing / Domain */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Phishing & Spoofing</span>
                    <span className="text-xs font-mono font-bold">{currentReport.categoryScores.phishingImpersonation}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        currentReport.categoryScores.phishingImpersonation >= 60
                          ? "bg-red-500"
                          : currentReport.categoryScores.phishingImpersonation >= 30
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${currentReport.categoryScores.phishingImpersonation}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Typosquatting, shorteners, public webmail</p>
                </div>

                {/* 4. Social Engineering */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Social Engineering</span>
                    <span className="text-xs font-mono font-bold">{currentReport.categoryScores.socialEngineering}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        currentReport.categoryScores.socialEngineering >= 60
                          ? "bg-red-500"
                          : currentReport.categoryScores.socialEngineering >= 30
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${currentReport.categoryScores.socialEngineering}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Telegram migration, 24h pressure, secrecy</p>
                </div>

                {/* 5. Job Credibility */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Job Credibility</span>
                    <span className="text-xs font-mono font-bold">{currentReport.categoryScores.jobCredibility}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        currentReport.categoryScores.jobCredibility >= 60
                          ? "bg-red-500"
                          : currentReport.categoryScores.jobCredibility >= 30
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${currentReport.categoryScores.jobCredibility}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Salary realism, scope structure, task traps</p>
                </div>
              </div>
            </div>

            {/* FORENSIC TECHNICAL BREAKDOWN: EMAIL TRUST, URL SECURITY, HEADERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Recruiter Trust */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-bold text-sm">Recruiter Trust Layer</h3>
                  </div>
                  <Badge className={`text-[10px] ${getSeverityBadgeClass(currentReport.emailAnalysis.risk)}`}>
                    {currentReport.emailAnalysis.risk}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Domain:</span>
                    <span className="font-mono font-semibold">{currentReport.emailAnalysis.domain || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Domain Type:</span>
                    <span className="font-semibold">{currentReport.emailAnalysis.domainType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Company Match:</span>
                    <span className="font-semibold">{currentReport.emailAnalysis.companyMatch}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    {currentReport.emailAnalysis.details[0] || "No domain anomalies detected."}
                  </p>
                </div>
              </Card>

              {/* Card 2: URL Security */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-sm">URL & Hosting Security</h3>
                  </div>
                  <Badge className={`text-[10px] ${getSeverityBadgeClass(currentReport.urlAnalysis.risk)}`}>
                    {currentReport.urlAnalysis.risk}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Host Domain:</span>
                    <span className="font-mono font-semibold truncate max-w-[140px]">
                      {currentReport.urlAnalysis.domain || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Protocol:</span>
                    <span className={`font-mono font-semibold ${currentReport.urlAnalysis.protocol === "HTTP" ? "text-red-500" : ""}`}>
                      {currentReport.urlAnalysis.protocol}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">ATS / Portal Status:</span>
                    <span className="font-semibold truncate max-w-[140px]">
                      {currentReport.urlAnalysis.isRecognizedAts
                        ? `✓ ${currentReport.urlAnalysis.atsProviderName}`
                        : currentReport.urlAnalysis.brandMatch}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    {currentReport.urlAnalysis.explanation}
                  </p>
                </div>
              </Card>

              {/* Card 3: Header Forensics / Trust Signals */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-sm">Forensics & Company Trust</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {currentReport.companyTrust.trustLevel} TRUST
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  {currentReport.headerAnalysis ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">SPF / DKIM / DMARC:</span>
                        <span className="font-mono font-semibold">
                          {currentReport.headerAnalysis.spf} / {currentReport.headerAnalysis.dkim} / {currentReport.headerAnalysis.dmarc}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">From/Reply-To Match:</span>
                        <span className={`font-semibold ${currentReport.headerAnalysis.fromReplyToMismatch ? "text-red-500" : "text-emerald-500"}`}>
                          {currentReport.headerAnalysis.fromReplyToMismatch ? "MISMATCH (Spoofing)" : "ALIGNED"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-1 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                      RFC 822 Email Headers not provided.
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Trust Diagnostics</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentReport.companyTrust.trustNotes[0] || "Based on submitted information."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* DETECTED CYBERSECURITY THREAT SIGNALS (EXPLAINABLE FINDINGS) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Detected Threat Signals & Explainable Evidence ({currentReport.signals.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Each signal extracts the concrete adversary tactic, why it is dangerous, the exact evidence from your input, and mitigation steps.
                  </p>
                </div>
              </div>

              {currentReport.signals.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200">
                    No Overt Cyber Threats Detected
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                    The submitted opportunity passed all 48+ fraud and impersonation heuristics. Always exercise zero-trust vigilance before sharing private credentials.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentReport.signals.map((signal, idx) => (
                    <Card
                      key={signal.id || idx}
                      className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs font-bold ${getSeverityBadgeClass(signal.severity)}`}>
                            {signal.severity}
                          </Badge>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {signal.technique}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {signal.title}
                          </h3>
                        </div>
                      </div>

                      {/* Evidence Box */}
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                        <span className="text-slate-400 font-sans font-semibold shrink-0 uppercase text-[10px]">
                          Evidence:
                        </span>
                        <span className="italic break-all">&quot;{signal.evidence}&quot;</span>
                      </div>

                      {/* Why & Recommended Action */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Why Attackers Use This:
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {signal.why}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Recommended Safe Action:
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {signal.action}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* POSITIVE CREDIBILITY MARKERS & NEXT ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Positive Indicators */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Positive Credibility Signals ({currentReport.positives.length})
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {currentReport.positives.map((pos, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{pos}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Actionable Safety Protocol */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Actionable Next Steps
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {currentReport.actions.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: USER SECURITY HUB & SCAN HISTORY */}
        {/* ========================================================================= */}
        {currentScreen === "dashboard" && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Security Hub & Threat Telemetry
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Historical telemetry and incident records compiled across all your local job security scans.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  id="hub-new-scan-btn"
                  size="sm"
                  onClick={() => setCurrentScreen("analyze")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  Scan New Job
                </Button>

                {historyList.length > 0 && (
                  <Button
                    id="hub-clear-history-btn"
                    variant="outline"
                    size="sm"
                    onClick={handleClearHistory}
                    className="border-slate-300 dark:border-slate-700 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear History
                  </Button>
                )}
              </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-xs uppercase font-mono text-slate-400">Total Analyses</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {historyStats.totalScans}
                </p>
                <span className="text-[11px] text-slate-500">Evaluated locally</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-xs uppercase font-mono text-red-500">High / Critical Threats</span>
                <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                  {historyStats.highOrCriticalCount}
                </p>
                <span className="text-[11px] text-slate-500">
                  {historyStats.criticalThreats} Critical • {historyStats.highThreats} High
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-xs uppercase font-mono text-emerald-500">Low Risk Jobs</span>
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {historyStats.lowThreats}
                </p>
                <span className="text-[11px] text-slate-500">Passed core checks</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-xs uppercase font-mono text-indigo-500">Threat Signals Logged</span>
                <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {historyStats.totalSignalsDetected}
                </p>
                <span className="text-[11px] text-slate-500">Adversary indicators</span>
              </div>
            </div>

            {/* RECENT SCANS TABLE */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Recent Scan Reports ({historyList.length})
              </h2>

              {historyList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
                  <Search className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-500">No scanned opportunities yet.</p>
                  <Button
                    size="sm"
                    onClick={() => setCurrentScreen("analyze")}
                    className="bg-indigo-600 text-white"
                  >
                    Run Your First Scan
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono">
                      <tr>
                        <th className="p-4">Target Opportunity</th>
                        <th className="p-4">Recruiter / Domain</th>
                        <th className="p-4">Threat Index</th>
                        <th className="p-4">Severity</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                            <div>{item.jobTitle || "Unspecified Role"}</div>
                            <div className="text-[11px] font-normal text-slate-400">{item.companyName}</div>
                          </td>
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                            {item.emailAnalysis.domain || "N/A"}
                          </td>
                          <td className="p-4 font-mono font-bold text-sm">
                            <span className={getScoreColor(item.overallScore)}>{item.overallScore}/100</span>
                          </td>
                          <td className="p-4">
                            <Badge className={`text-[10px] font-bold ${getSeverityBadgeClass(item.overallSeverity)}`}>
                              {item.overallSeverity}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentReport(item);
                                setCurrentScreen("results");
                              }}
                              className="text-xs h-7 px-2.5"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteHistory(item.id)}
                              className="text-xs h-7 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: SCAM RADAR KNOWLEDGE BASE */}
        {/* ========================================================================= */}
        {currentScreen === "radar" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Recruitment Scam Radar Knowledge Base
                </h1>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                  2026 Threat Intel
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Deep analysis of contemporary recruitment attack vectors, adversary playbooks, and mitigation protocols.
              </p>
            </div>

            {/* FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium mr-1">Filter Technique:</span>
              {["ALL", "ADVANCE_FEE_FRAUD", "CREDENTIAL_HARVESTING", "IMPERSONATION", "FINANCIAL_FRAUD"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRadarFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    radarFilter === filter
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {filter.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {/* KNOWLEDGE BASE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SCAM_KNOWLEDGE_BASE.filter(
                (item) => radarFilter === "ALL" || item.technique === radarFilter
              ).map((scam) => (
                <Card
                  key={scam.id}
                  className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-[10px] font-bold ${getSeverityBadgeClass(scam.severity)}`}>
                        {scam.severity}
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-400">
                        {scam.technique}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {scam.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {scam.summary}
                    </p>

                    {/* How it works */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        How Attackers Execute It:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {scam.howItWorks.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Real world quote */}
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs italic font-mono text-slate-600 dark:text-slate-300">
                      {scam.realWorldExample}
                    </div>
                  </div>

                  {/* Defense Protocol */}
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Defense Protocol:
                    </span>
                    <p className="text-emerald-700 dark:text-emerald-400">
                      {scam.defenseProtocol[0]}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 6: SECURITY ANALYST & RULE ENGINE INSPECTOR */}
        {/* ========================================================================= */}
        {currentScreen === "analyst" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Security Analyst & Detection Engine Telemetry
                </h1>
                <Badge variant="outline" className="text-xs font-mono">
                  Viva / Examiner Mode
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Inspect active heuristic rule weights, MITRE-style attack technique classifications, and OSINT feed configurations.
              </p>
            </div>

            {/* ARCHITECTURE DIAGRAM / SPECS */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span className="font-mono text-sm font-bold text-indigo-300">
                    Engine Pipeline: Normalization → Signal Extraction → Weighted Risk Score
                  </span>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs">
                  Zero False-Claim Mode
                </Badge>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Threat Index = min(100, &sum; (w_i &times; Match_i) + &Delta;_Domain + &Delta;_Headers)
                <br />
                Critical indicators (advance fee demands, OTP solicitations, RAT installations) automatically elevate the threat floor to &ge; 82 (CRITICAL).
              </p>
            </div>

            {/* MODULAR THREAT INTEL / OSINT FEEDS */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                Threat Intelligence & OSINT Integration Layer
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {threatIntel.activeFeeds.map((feed) => (
                  <Card key={feed.name} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{feed.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          feed.apiConfigured
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        {feed.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feed.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            {/* VIVA QUESTIONS & DEFENSE QUESTIONS */}
            <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
              <h2 className="font-bold text-base text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Cybersecurity Examiner / Viva Defense Points
              </h2>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Q1: How do you prevent false positives on early-stage startups using Gmail?
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    We treat public email domains as a <em>weaker trust marker</em> (+20 pts) rather than an automatic critical scam (+80 pts), only flagging critical risk when combined with advance fees, OTP theft, or remote tool downloads.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Q2: How does the engine detect lookalike / typosquatting domains?
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    We implement Levenshtein distance calculations and leetspeak substitution matrix (e.g. 0→o, 1→l, rn→m) to flag homoglyph domains mimicking enterprise brands (e.g. <code>amaz0n.jobs</code>).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Q3: How is candidate privacy protected?
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    The entire evaluation runs 100% in-browser via deterministic client-side rule extraction. No resumes, passwords, or candidate PII are sent to third-party tracking servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 7: CANDIDATE SAFETY PROTOCOL & CHECKLIST */}
        {/* ========================================================================= */}
        {currentScreen === "safety" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Candidate Due Diligence Safety Protocol
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                  Zero-Trust Hiring Checklist
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Standard operating procedure to verify employer legitimacy before signing contracts or submitting identity documents.
              </p>
            </div>

            {/* CHECKLIST ITEMS */}
            <div className="space-y-3">
              {[
                {
                  id: "check-1",
                  title: "1. Independent Domain & Career Page Cross-Reference",
                  desc: "Manually navigate to the company's official corporate website (e.g. amazon.jobs or microsoft.com/careers) and verify the Job ID exists in their active catalog."
                },
                {
                  id: "check-2",
                  title: "2. Recruiter Corporate Email Verification",
                  desc: "Ensure the recruiter contacts you from an authenticated corporate email domain (@company.com). If approached on WhatsApp/Telegram, demand an email confirmation from corporate mail."
                },
                {
                  id: "check-3",
                  title: "3. Absolute Zero-Payment Mandate",
                  desc: "Never transfer any money for equipment deposits, background verification, software licenses, or interview registration. Real employers absorb all onboarding costs."
                },
                {
                  id: "check-4",
                  title: "4. No Remote Access Tools (AnyDesk / TeamViewer)",
                  desc: "Never install remote control utilities or allow an unknown interviewer to access your desktop. Authentic technical assessments use browser-based code runners."
                },
                {
                  id: "check-5",
                  title: "5. Require Live Video or Multi-Stage Technical Loops",
                  desc: "Refuse chat-only interviews conducted on Telegram or WhatsApp. Legitimate corporate positions require live multi-round interviews with cameras enabled."
                },
                {
                  id: "check-6",
                  title: "6. Protect Tax IDs & Banking Information",
                  desc: "Only provide banking details (for payroll direct deposit) and government IDs AFTER a formal written offer letter has been verified and countersigned."
                }
              ].map((item) => {
                const isChecked = Boolean(checkedSafetyItems[item.id]);
                return (
                  <Card
                    key={item.id}
                    onClick={() =>
                      setCheckedSafetyItems({
                        ...checkedSafetyItems,
                        [item.id]: !isChecked
                      })
                    }
                    className={`cursor-pointer border p-4 sm:p-5 transition-all flex items-start gap-4 ${
                      isChecked
                        ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                        isChecked
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1">
                      <h3 className={`font-bold text-sm ${isChecked ? "text-emerald-900 dark:text-emerald-200" : "text-slate-900 dark:text-white"}`}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* REPORTING TO AUTHORITIES CALLOUT */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                Where to Report Recruitment Scams
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">
                    India (National Cyber Crime Portal)
                  </span>
                  <p className="text-slate-500 mb-2">Report online financial fraud, UPI extortion, or fake job networks.</p>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    cybercrime.gov.in <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">
                    USA / Global (FBI IC3 & FTC)
                  </span>
                  <p className="text-slate-500 mb-2">Internet Crime Complaint Center for advance fee check scams and impersonation.</p>
                  <a
                    href="https://www.ic3.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    ic3.gov <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-slate-700 dark:text-slate-300">JOBLENS CYBERSECURITY SUITE</span>
          <span>•</span>
          <span>Omni_CyberTech_10 Track</span>
        </div>
        <p>
          Designed for explainable recruitment threat detection, domain authenticity analysis, and candidate safety.
        </p>
      </footer>
    </div>
  );
}
