"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  History,
  Info,
  Link2,
  Lock,
  LogOut,
  Mail,
  PieChart,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  UserCheck,
  Zap,
  Bot,
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CyberBackground } from "@/components/cyber-background";
import { AuthLoginView } from "@/components/auth-login-view";
import { GeminiChatbot } from "@/components/gemini-chatbot";
import { GeminiVoiceLive } from "@/components/gemini-voice-live";
import { ScanProgressDisplay } from "@/components/scan-progress-display";
import { useAuth } from "@/lib/auth-context";

import type {
  CyberThreatReport,
  JobInputForm,
  ThreatSeverity
} from "@/lib/security/types";
import { runThreatAnalysis } from "@/lib/security/rule-engine";
import {
  clearAllScanReports,
  deleteScanReport,
  formatReportAsPlainText,
  getScanHistory,
  getSecurityStats,
  saveScanReport
} from "@/lib/security/history-store";
import {
  getStoredSession,
  saveSession,
  clearSession,
  purgeLegacyDemoSessions,
  type UserAccount
} from "@/lib/security/auth-store";
import { SCAM_KNOWLEDGE_BASE } from "@/lib/security/knowledge-base";
import { getThreatIntelStatus } from "@/lib/security/threat-intelligence";
import {
  extractEmailDomain,
  extractUrlHostname,
  findRecognizedAts,
  normalizeCompanyName
} from "@/lib/security/normalizer";
import { FREE_EMAIL_PROVIDERS } from "@/lib/security/constants";

type Screen = "home" | "analyze" | "results" | "history" | "radar" | "safety" | "settings" | "chat" | "voice";

const INITIAL_FORM: JobInputForm = {
  jobTitle: "",
  companyName: "",
  recruiterEmail: "",
  applicationUrl: "",
  jobDescription: "",
  emailHeaders: ""
};

export default function JobLensApp() {
  const {
    account,
    loading: isAuthLoading,
    signOut,
    updateAccountPreferences,
    updateAccountProfile,
  } = useAuth();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [threatSensitivity, setThreatSensitivity] = useState<"STANDARD" | "HIGH" | "RELAXED">("STANDARD");

  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [formData, setFormData] = useState<JobInputForm>(INITIAL_FORM);
  const [quickInputText, setQuickInputText] = useState("");
  const [quickCompanyName, setQuickCompanyName] = useState("");
  const [currentReport, setCurrentReport] = useState<CyberThreatReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(1);
  const [showAdvancedHeaders, setShowAdvancedHeaders] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [historyList, setHistoryList] = useState<CyberThreatReport[]>([]);
  const [radarFilter, setRadarFilter] = useState<string>("ALL");
  const [checkedSafetyItems, setCheckedSafetyItems] = useState<Record<string, boolean>>({});

  // Synchronize authenticated session from Firebase Auth / stored session
  useEffect(() => {
    if (account) {
      setCurrentUser(account);
      setIsAuthenticated(true);
      if (account.preferences?.threatSensitivity) {
        setThreatSensitivity(account.preferences.threatSensitivity);
      }
    } else if (!isAuthLoading) {
      purgeLegacyDemoSessions();
      const activeSession = getStoredSession();
      if (activeSession) {
        setCurrentUser(activeSession);
        setIsAuthenticated(true);
        if (activeSession.preferences?.threatSensitivity) {
          setThreatSensitivity(activeSession.preferences.threatSensitivity);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    }
    setHistoryList(getScanHistory());
  }, [account, isAuthLoading]);

  const handleLoginSuccess = (accountItem: UserAccount) => {
    setCurrentUser(accountItem);
    setIsAuthenticated(true);
    if (accountItem.preferences?.threatSensitivity) {
      setThreatSensitivity(accountItem.preferences.threatSensitivity);
    }
    setCurrentScreen("home");
  };

  const handleLogout = async () => {
    await signOut();
    clearSession();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentScreen("home");
  };

  const handleUpdateProfileName = (name: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, name };
    setCurrentUser(updated);
    saveSession(updated);
    updateAccountProfile(name, undefined);
  };

  const handleUpdateProfileRole = (role: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    saveSession(updated);
    updateAccountProfile(undefined, role);
  };

  const handleUpdateSensitivity = (sensitivity: "STANDARD" | "HIGH" | "RELAXED") => {
    setThreatSensitivity(sensitivity);
    if (currentUser) {
      const updated: UserAccount = {
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          threatSensitivity: sensitivity
        }
      };
      setCurrentUser(updated);
      saveSession(updated);
      updateAccountPreferences({ threatSensitivity: sensitivity });
    }
  };

  const historyStats = useMemo(() => {
    return getSecurityStats(historyList);
  }, [historyList]);

  const threatIntel = useMemo(() => {
    return getThreatIntelStatus();
  }, []);

  // Live input heuristics for immediate visual feedback
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

  // Real-time dynamic threat evaluation from actual user input (no preset override)
  const liveActualRisk = useMemo(() => {
    const hasInput =
      (formData.jobDescription || "").trim().length > 0 ||
      (formData.companyName || "").trim().length > 0 ||
      (formData.recruiterEmail || "").trim().length > 0 ||
      (formData.applicationUrl || "").trim().length > 0 ||
      (formData.emailHeaders || "").trim().length > 0;

    if (!hasInput) {
      return null;
    }
    return runThreatAnalysis(formData);
  }, [formData]);

  // Direct scan trigger for form submissions
  const triggerDirectScan = (input: JobInputForm) => {
    setIsScanning(true);
    setScanStep(1);

    // Staggered stages with realistic smooth pacing for Framer Motion transitions (380ms per stage)
    const t1 = setTimeout(() => setScanStep(2), 380);
    const t2 = setTimeout(() => setScanStep(3), 760);
    const t3 = setTimeout(() => setScanStep(4), 1140);
    const t4 = setTimeout(() => setScanStep(5), 1520);

    const tFinal = setTimeout(() => {
      const report = runThreatAnalysis(input);
      setCurrentReport(report);
      saveScanReport(report);
      setHistoryList(getScanHistory());
      setIsScanning(false);
      setScanStep(1);
      setCurrentScreen("results");
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tFinal);
    };
  };

  const handleStartScan = () => {
    if (!formData.jobDescription.trim() && !formData.companyName.trim() && !formData.recruiterEmail.trim()) {
      return;
    }
    triggerDirectScan(formData);
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
        return "bg-red-500/15 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "LOW":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-red-400 stroke-red-500 fill-red-500/10";
    if (score >= 60) return "text-orange-400 stroke-orange-500 fill-orange-500/10";
    if (score >= 30) return "text-amber-400 stroke-amber-500 fill-amber-500/10";
    return "text-emerald-400 stroke-emerald-500 fill-emerald-500/10";
  };

  const getScoreStrokeHex = (score: number) => {
    if (score >= 80) return "#ef4444";
    if (score >= 60) return "#f97316";
    if (score >= 30) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-sky-500/30 selection:text-white font-sans overflow-x-hidden antialiased">
      {/* 5-LAYER ANIMATED CYBERSECURITY BACKGROUND */}
      <CyberBackground />

      {/* TOP CYBERSECURITY COMMAND BAR / NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#030712]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* BRAND LOGO */}
          <div
            id="brand-logo"
            onClick={() => {
              if (isAuthenticated) setCurrentScreen("home");
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform border border-sky-400/30">
              <Shield className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-sky-400/20 animate-pulse pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                  JOBLENS
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 font-semibold border border-sky-500/30">
                  CYBERSECURITY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 font-medium">
                Recruitment Threat Intelligence Engine
              </p>
            </div>
          </div>

          {/* NAVIGATION ITEMS (SHOWN ONLY WHEN AUTHENTICATED) */}
          {isAuthenticated ? (
            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium">
              <button
                id="nav-home-btn"
                onClick={() => setCurrentScreen("home")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "home"
                    ? "bg-slate-800 text-white font-semibold border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Dashboard</span>
              </button>

              <button
                id="nav-scanner-btn"
                onClick={() => setCurrentScreen("analyze")}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "analyze" || currentScreen === "results"
                    ? "bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/30 border border-sky-400/40"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Search className="w-3.5 h-3.5 text-sky-300" />
                <span>Scan Job</span>
              </button>

              <button
                id="nav-history-btn"
                onClick={() => {
                  setHistoryList(getScanHistory());
                  setCurrentScreen("history");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "history"
                    ? "bg-slate-800 text-white font-semibold border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>History</span>
                {historyList.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                    {historyList.length}
                  </span>
                )}
              </button>

              <button
                id="nav-radar-btn"
                onClick={() => setCurrentScreen("radar")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "radar"
                    ? "bg-slate-800 text-white font-semibold border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Scam Radar</span>
              </button>

              <button
                id="nav-safety-btn"
                onClick={() => setCurrentScreen("safety")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "safety"
                    ? "bg-slate-800 text-white font-semibold border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safety Toolkit</span>
              </button>

              <button
                id="nav-chat-btn"
                onClick={() => setCurrentScreen("chat")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "chat"
                    ? "bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/30 border border-sky-400/40"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-sky-300" />
                <span>AI Chat</span>
              </button>

              <button
                id="nav-voice-btn"
                onClick={() => setCurrentScreen("voice")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "voice"
                    ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/30 border border-emerald-400/40"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-emerald-300" />
                <span>Live Voice</span>
              </button>

              <button
                id="nav-settings-btn"
                onClick={() => setCurrentScreen("settings")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentScreen === "settings"
                    ? "bg-slate-800 text-white font-semibold border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </button>
            </nav>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero-Trust Gateway Online</span>
            </div>
          )}

          {/* HEADER RIGHT ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  id="header-primary-scan-btn"
                  size="sm"
                  onClick={() => setCurrentScreen("analyze")}
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-md shadow-sky-500/20 border border-sky-400/30 flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Scan Job</span>
                  <span className="sm:hidden">Scan</span>
                </Button>

                {/* USER PROFILE CHIP & LOGOUT */}
                <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-xs font-bold text-slate-200 leading-tight">
                      {currentUser?.name || "Candidate"}
                    </span>
                    <span className="text-[10px] font-mono text-sky-400">
                      {currentUser?.role || "Candidate"}
                    </span>
                  </div>
                  <button
                    id="user-logout-btn"
                    onClick={handleLogout}
                    title="Sign Out to Login Gateway"
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center gap-1 text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <Badge variant="outline" className="border-sky-500/30 bg-sky-950/40 text-sky-300 text-xs px-2.5 py-1 flex items-center gap-1.5 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Protected Portal</span>
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* FOREGROUND MAIN CONTENT CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ========================================================================= */}
        {/* LOADING STATE: RECOVERING SECURE FIREBASE SESSION */}
        {/* ========================================================================= */}
        {isAuthLoading && !currentUser ? (
          <div className="min-h-[480px] flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 animate-pulse">
                <Shield className="w-7 h-7" />
              </div>
              <div className="absolute -inset-1 rounded-2xl border border-sky-400/20 animate-ping pointer-events-none" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Verifying Firebase Cryptographic Session
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Authenticating zero-trust token across browser storage...
              </p>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <AuthLoginView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* SCREEN 1: CANDIDATE SECURITY OPERATIONS DASHBOARD */}
            {/* ========================================================================= */}
            {currentScreen === "home" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* DASHBOARD HERO COMMAND HEADER */}
                <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-b from-[#0b1530]/90 via-[#070e22]/90 to-[#050a18]/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Zero-Trust Client Engine v4.2 • Active & Defending</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                          Candidate Security Dashboard
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                          Welcome back, <strong className="text-white font-semibold">{currentUser?.name || "Candidate"}</strong> ({currentUser?.email || "candidate"}). Evaluate job postings, inspect recruiter domain trust, and detect advance-fee scam tactics before sharing data.
                        </p>
                      </div>

                      {/* Primary Dashboard Actions (NO TRY DEMO BUTTON) */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <Button
                          id="dashboard-scan-btn"
                          size="lg"
                          onClick={() => setCurrentScreen("analyze")}
                          className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl shadow-lg shadow-sky-500/25 border border-sky-400/30 flex items-center gap-2 transition-all hover:scale-[1.01]"
                        >
                          <Search className="w-4 h-4" />
                          <span>Scan a Job</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>

                        <Button
                          id="dashboard-chat-btn"
                          variant="outline"
                          size="lg"
                          onClick={() => setCurrentScreen("chat")}
                          className="border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 hover:text-white text-xs sm:text-sm h-11 px-5 rounded-xl flex items-center gap-2"
                        >
                          <Bot className="w-4 h-4 text-sky-400" />
                          <span>AI Chat</span>
                        </Button>

                        <Button
                          id="dashboard-voice-btn"
                          variant="outline"
                          size="lg"
                          onClick={() => setCurrentScreen("voice")}
                          className="border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white text-xs sm:text-sm h-11 px-5 rounded-xl flex items-center gap-2"
                        >
                          <Mic className="w-4 h-4 text-emerald-400" />
                          <span>Live Voice</span>
                        </Button>

                        <Button
                          id="dashboard-history-btn"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setHistoryList(getScanHistory());
                            setCurrentScreen("history");
                          }}
                          className="border-slate-700 bg-slate-900/70 hover:bg-slate-800 text-slate-200 h-11 px-5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2"
                        >
                          <History className="w-4 h-4 text-indigo-400" />
                          <span>View History ({historyList.length})</span>
                        </Button>
                      </div>
                    </div>

                    {/* LIVE SECURITY STATS ROW */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-4 rounded-2xl border border-slate-800/90 bg-[#070e22]/90 backdrop-blur-md">
                        <div className="text-[11px] font-mono text-slate-400 uppercase">Opportunities Logged</div>
                        <div className="text-2xl font-black text-white mt-1 font-mono">
                          {historyStats.totalScans}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Scans executed locally</div>
                      </div>

                      <div className="p-4 rounded-2xl border border-red-500/20 bg-red-950/20 backdrop-blur-md">
                        <div className="text-[11px] font-mono text-red-300 uppercase">Threats Intercepted</div>
                        <div className="text-2xl font-black text-red-400 mt-1 font-mono">
                          {historyStats.highOrCriticalCount}
                        </div>
                        <div className="text-[10px] text-red-400/70 mt-0.5">High & Critical risks</div>
                      </div>

                      <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-md">
                        <div className="text-[11px] font-mono text-emerald-300 uppercase">Verified Safe</div>
                        <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                          {historyStats.lowThreats}
                        </div>
                        <div className="text-[10px] text-emerald-400/70 mt-0.5">Clean ATS portals</div>
                      </div>

                      <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-950/20 backdrop-blur-md">
                        <div className="text-[11px] font-mono text-sky-300 uppercase">Heuristic Vectors</div>
                        <div className="text-2xl font-black text-sky-400 mt-1 font-mono">
                          {threatIntel.offlineSignaturesCount}+
                        </div>
                        <div className="text-[10px] text-sky-400/70 mt-0.5">Offline rules monitored</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INLINE RAPID SCAN LAUNCHER */}
                <Card className="border border-sky-500/30 bg-[#081229]/90 shadow-xl">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-sky-400" />
                        <CardTitle className="text-lg font-bold text-white">
                          Quick Opportunity Threat Scan
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono border-sky-500/30 text-sky-400">
                        Rapid Diagnostic
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-300">
                      Paste suspicious offer text, recruiter message, or company name below to execute an immediate 48-rule threat check.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1">
                        <Label className="text-xs text-slate-400 font-mono">Company / Employer Name</Label>
                        <Input
                          value={quickCompanyName}
                          onChange={(e) => setQuickCompanyName(e.target.value)}
                          placeholder="e.g. Apex Global Logistics"
                          className="bg-[#040814] border-slate-800 text-white placeholder:text-slate-500 text-xs mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs text-slate-400 font-mono">Job Description / Recruiter Message</Label>
                        <Textarea
                          value={quickInputText}
                          onChange={(e) => setQuickInputText(e.target.value)}
                          placeholder="Paste recruiter email text, offer letter snippet, or Telegram message here..."
                          rows={2}
                          className="bg-[#040814] border-slate-800 text-white placeholder:text-slate-500 text-xs mt-1 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Analyzes advance fees, spoofed domains, and AnyDesk traps without requiring URLs.</span>
                      </div>

                      <Button
                        id="dashboard-rapid-scan-btn"
                        size="sm"
                        disabled={!quickInputText.trim() && !quickCompanyName.trim()}
                        onClick={() => {
                          const inputForm: JobInputForm = {
                            jobTitle: "Direct Opportunity Check",
                            companyName: quickCompanyName || "Unspecified Employer",
                            recruiterEmail: "",
                            applicationUrl: "",
                            jobDescription: quickInputText || quickCompanyName,
                            emailHeaders: ""
                          };
                          setFormData(inputForm);
                          setCurrentScreen("analyze");
                          triggerDirectScan(inputForm);
                        }}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-9 px-5 rounded-lg shadow-md shadow-sky-600/30"
                      >
                        <Zap className="w-3.5 h-3.5 mr-1" />
                        <span>Run Rapid Analysis</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* "NO LINK REQUIRED" DIFFERENTIATOR BANNER */}
                <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-[#0b1938] via-[#0e172e] to-[#070f24] p-6 sm:p-7 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                            Core Differentiator
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs font-medium text-slate-400">Zero URL Dependency</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-white">
                          Scam detection without requiring a suspicious link.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                          JobLens identifies recruitment-risk signals purely from the content and behavior of a message or job posting, even when no malicious URL is present.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentScreen("analyze")}
                        className="border-sky-500/40 bg-sky-950/50 hover:bg-sky-900/60 text-sky-200 text-xs font-semibold h-9 px-4"
                      >
                        <span>Open Scanner Form</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* SCAM RADAR: COMMON THREAT VECTORS OVERVIEW */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        Scam Radar & Emerging Attack Vectors
                      </h2>
                      <p className="text-xs text-slate-400">
                        Top tactics currently utilized by recruitment fraud syndicates.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentScreen("radar")}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      <span>Explore Scam Radar</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-red-500/25 bg-[#12080a]/90">
                      <CardHeader className="p-5 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-mono">
                            HIGH RISK
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400">Financial Extortion</span>
                        </div>
                        <CardTitle className="text-sm font-bold text-white">
                          Advance-Fee Equipment Deposits
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 space-y-2">
                        <p className="text-xs text-slate-300">
                          Applicant receives a job offer and is instructed to pay an equipment fee or insurance deposit before receiving a laptop or home office gear.
                        </p>
                        <div className="text-[11px] font-mono text-red-300">
                          Indicator: &ldquo;Refundable equipment deposit&rdquo;
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-amber-500/25 bg-[#141006]/90">
                      <CardHeader className="p-5 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                            MEDIUM RISK
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400">Identity / Impersonation</span>
                        </div>
                        <CardTitle className="text-sm font-bold text-white">
                          Public Webmail Recruiter Spoofing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 space-y-2">
                        <p className="text-xs text-slate-300">
                          Recruiter claims to represent a Fortune 500 company (e.g. Google, Stripe) but contacts candidates via disposable Gmail, Yahoo, or Outlook addresses.
                        </p>
                        <div className="text-[11px] font-mono text-amber-300">
                          Indicator: Recruiter domain does not match employer
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-indigo-500/25 bg-[#0a0d1e]/90">
                      <CardHeader className="p-5 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-mono">
                            MALWARE RISK
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400">Remote Access Traps</span>
                        </div>
                        <CardTitle className="text-sm font-bold text-white">
                          Remote Access Software (RAT) Trap
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 space-y-2">
                        <p className="text-xs text-slate-300">
                          Scammer asks candidates to download AnyDesk or TeamViewer under the pretext of conducting an automated coding test or remote onboarding setup.
                        </p>
                        <div className="text-[11px] font-mono text-indigo-300">
                          Indicator: &ldquo;Install AnyDesk for interview&rdquo;
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* CYBERSECURITY METHODOLOGY PILLARS */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-sky-400" />
                    Multi-Layer Threat Forensics Architecture
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                        <AlertOctagon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-white">Advance-Fee Interception</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Identifies refundable laptop deposits, mandatory registration fees, crypto payouts, and fake check laundering schemes.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-white">Domain & Recruiter Trust</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Flags disposable webmail, typosquatting homoglyphs, and recruiter domain-to-employer brand mismatches.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-white">Credential & RAT Defense</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Uncovers AnyDesk/TeamViewer remote installation traps, OTP harvesting, and premature government ID requests.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-white">Header & ATS Verification</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Inspects cryptographic SPF, DKIM, and DMARC origin headers to catch active sender address spoofing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* ========================================================================= */}
        {/* SCREEN 2: SCANNER / INPUT FORM */}
        {/* ========================================================================= */}
        {currentScreen === "analyze" && (
          <div className="max-w-4xl mx-auto space-y-7 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Recruitment Threat Scanner
                  </h1>
                  <Badge variant="outline" className="text-xs font-mono border-sky-500/30 text-sky-400 bg-sky-950/40">
                    Deterministic Engine
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Paste the job posting, offer email, recruiter details, and optional email headers to execute a full threat assessment.
                </p>
              </div>

              {/* Dynamic Actual Risk Indicator */}
              <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                {liveActualRisk ? (
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">Calculated Risk:</span>
                    <div
                      className={`px-2.5 py-0.5 rounded-md font-bold font-mono text-xs flex items-center gap-1.5 border ${
                        liveActualRisk.overallSeverity === "CRITICAL"
                          ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                          : liveActualRisk.overallSeverity === "HIGH"
                          ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                          : liveActualRisk.overallSeverity === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                    >
                      <span>{liveActualRisk.overallScore}/100</span>
                      <span className="text-[10px] uppercase font-semibold">({liveActualRisk.overallSeverity})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                      {liveActualRisk.signals.length} {liveActualRisk.signals.length === 1 ? "signal" : "signals"} detected
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-[11px] font-mono text-slate-300">Live Risk: Ready for Input</span>
                  </div>
                )}
              </div>
            </div>

            {/* SCANNING PROGRESS OVERLAY (5 STAGES WITH FRAMER MOTION TRANSITIONS) */}
            <AnimatePresence mode="wait">
              {isScanning ? (
                <ScanProgressDisplay
                  key="scanning-progress"
                  scanStep={scanStep}
                  companyName={formData.companyName}
                  jobTitle={formData.jobTitle}
                />
              ) : (
                /* SCANNER FORM */
                <motion.div
                  key="scanner-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Job Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="job-title-input" className="text-xs font-semibold uppercase text-slate-400">
                      Target Role / Job Title
                    </Label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <Input
                        id="job-title-input"
                        placeholder="e.g. Remote Cloud Support Associate"
                        className="pl-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="company-name-input" className="text-xs font-semibold uppercase text-slate-400">
                        Declared Company Name <span className="text-red-400">*</span>
                      </Label>
                      {formData.companyName && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Normalized: {normalizeCompanyName(formData.companyName) || "N/A"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <Input
                        id="company-name-input"
                        placeholder="e.g. Amazon / Apex Global Corp"
                        className="pl-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500"
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
                      <Label htmlFor="recruiter-email-input" className="text-xs font-semibold uppercase text-slate-400">
                        Recruiter Email Address
                      </Label>
                      {liveEmailDomain && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            liveEmailIsPublic
                              ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {liveEmailIsPublic ? "Public Webmail" : `@${liveEmailDomain}`}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <Input
                        id="recruiter-email-input"
                        placeholder="e.g. talent-team@amazon.com or hr-amazon@gmail.com"
                        className="pl-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500"
                        value={formData.recruiterEmail}
                        onChange={(e) => setFormData({ ...formData, recruiterEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Application URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="application-url-input" className="text-xs font-semibold uppercase text-slate-400">
                        Application / Careers Link
                      </Label>
                      {liveAtsCheck.isAts && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                          ✓ Verified ATS: {liveAtsCheck.providerName}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Link2 className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <Input
                        id="application-url-input"
                        placeholder="e.g. https://amazon.jobs/... or http://bit.ly/..."
                        className="pl-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500"
                        value={formData.applicationUrl}
                        onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description / Message Content */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="job-description-input" className="text-xs font-semibold uppercase text-slate-400">
                      Offer Letter / Email Text / Job Details <span className="text-red-400">*</span>
                    </Label>
                    <span className="text-[11px] font-mono text-slate-500">
                      {formData.jobDescription.length} characters
                    </span>
                  </div>
                  <Textarea
                    id="job-description-input"
                    rows={7}
                    placeholder="Paste the full job posting, email invitation, WhatsApp/Telegram chat log, or offer letter snippet here..."
                    className="bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 font-sans text-sm leading-relaxed focus:border-sky-500"
                    value={formData.jobDescription}
                    onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  />
                </div>

                {/* ADVANCED FORENSICS COLLAPSIBLE (RFC 822 HEADERS) */}
                <div className="border border-slate-800 rounded-2xl p-4 bg-[#070d1e]/80 space-y-3">
                  <button
                    id="toggle-advanced-headers-btn"
                    type="button"
                    onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-sky-400 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-sky-400" />
                      <span>Advanced Forensics: Raw RFC 822 Email Headers (.EML / Mail Source)</span>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                        SPF / DKIM / DMARC
                      </Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedHeaders ? "rotate-180" : ""}`} />
                  </button>

                  {showAdvancedHeaders && (
                    <div className="space-y-2 pt-2 animate-in fade-in">
                      <p className="text-xs text-slate-400">
                        Paste raw message headers from Gmail (&ldquo;Show Original&rdquo;) or Outlook (&ldquo;View Source&rdquo;) to test for From/Reply-To discrepancies and cryptographic mail authentication verdicts.
                      </p>
                      <Textarea
                        id="email-headers-input"
                        rows={4}
                        placeholder="From: recruiter@amazon.com&#10;Reply-To: badactor@gmail.com&#10;Authentication-Results: spf=fail dkim=fail dmarc=fail..."
                        className="font-mono text-xs bg-[#040814] border-slate-800 text-slate-200"
                        value={formData.emailHeaders}
                        onChange={(e) => setFormData({ ...formData, emailHeaders: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* REAL-TIME ACTUAL RISK DIAGNOSTIC PREVIEW */}
                {liveActualRisk && (
                  <div
                    className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                      liveActualRisk.overallSeverity === "CRITICAL"
                        ? "bg-red-950/30 border-red-500/40 shadow-lg shadow-red-950/20"
                        : liveActualRisk.overallSeverity === "HIGH"
                        ? "bg-orange-950/30 border-orange-500/40 shadow-lg shadow-orange-950/20"
                        : liveActualRisk.overallSeverity === "MEDIUM"
                        ? "bg-amber-950/30 border-amber-500/40"
                        : "bg-emerald-950/30 border-emerald-500/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            liveActualRisk.overallSeverity === "CRITICAL"
                              ? "bg-red-500/20 text-red-400 border border-red-500/40"
                              : liveActualRisk.overallSeverity === "HIGH"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                              : liveActualRisk.overallSeverity === "MEDIUM"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          }`}
                        >
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Live Heuristic Evaluation</div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Computed Risk: <span className="font-mono">{liveActualRisk.overallScore}/100</span></span>
                            <span className="text-slate-600">•</span>
                            <span
                              className={`uppercase text-xs font-semibold ${
                                liveActualRisk.overallSeverity === "CRITICAL"
                                  ? "text-red-400"
                                  : liveActualRisk.overallSeverity === "HIGH"
                                  ? "text-orange-400"
                                  : liveActualRisk.overallSeverity === "MEDIUM"
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {liveActualRisk.overallSeverity} Threat Level
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-mono text-slate-400">
                        {liveActualRisk.signals.length} {liveActualRisk.signals.length === 1 ? "Threat Signal" : "Threat Signals"} Found
                      </div>
                    </div>

                    {liveActualRisk.signals.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <div className="text-[11px] font-mono text-slate-300">Triggered Heuristics in Your Input:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {liveActualRisk.signals.map((sig) => (
                            <span
                              key={sig.id}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                                sig.severity === "CRITICAL"
                                  ? "bg-red-950/80 text-red-200 border-red-500/40"
                                  : sig.severity === "HIGH"
                                  ? "bg-orange-950/80 text-orange-200 border-orange-500/40"
                                  : "bg-amber-950/80 text-amber-200 border-amber-500/40"
                              }`}
                            >
                              <span>{sig.title}</span>
                              <span className="font-mono text-[9px] opacity-75">[{sig.severity}]</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>No overt adversary patterns detected in entered text. Click Analyze to run deep domain & header verification.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTION BUTTONS & PRIVACY FOOTER */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>JobLens analyzes the recruitment information you provide or choose to scan. Zero PII transmitted.</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      id="scanner-reset-btn"
                      variant="outline"
                      onClick={() => setFormData(INITIAL_FORM)}
                      className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs h-11"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Clear Form
                    </Button>

                    <Button
                      id="scanner-execute-btn"
                      onClick={handleStartScan}
                      disabled={!formData.jobDescription.trim() && !formData.companyName.trim() && !formData.recruiterEmail.trim()}
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm px-6 h-11 rounded-xl shadow-lg shadow-sky-500/25 border border-sky-400/30 flex items-center gap-2 flex-1 sm:flex-initial"
                    >
                      <Search className="w-4 h-4" />
                      <span>Analyze Threat Profile</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

        {/* ========================================================================= */}
        {/* SCREEN 3: EXPLAINABLE THREAT RESULTS DASHBOARD (CENTERPIECE) */}
        {/* ========================================================================= */}
        {currentScreen === "results" && currentReport && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* TOP BAR ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    id="back-to-scanner-btn"
                    onClick={() => setCurrentScreen("analyze")}
                    className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1"
                  >
                    ← Back to Scanner
                  </button>
                  <span className="text-slate-700">•</span>
                  <span className="text-xs font-mono text-slate-400">
                    Report ID: {currentReport.id}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
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
                  className="border-slate-700 bg-slate-900/80 text-slate-200 text-xs"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Copy Threat Report
                    </>
                  )}
                </Button>

                <Button
                  id="export-txt-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport("txt")}
                  className="border-slate-700 bg-slate-900/80 text-slate-200 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Export .TXT
                </Button>

                <Button
                  id="export-json-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport("json")}
                  className="border-slate-700 bg-slate-900/80 text-slate-200 text-xs"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* HERO SCORE & SUMMARY PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Centerpiece Radial Threat Gauge Card */}
              <Card className="border border-slate-800 bg-[#070e22]/90 backdrop-blur-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Calculated Threat Index
                </div>

                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* SVG Circle Gauge */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-800/80 stroke-current"
                      strokeWidth="9"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={getScoreStrokeHex(currentReport.overallScore)}
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - currentReport.overallScore / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black tracking-tight text-white font-mono">
                      {currentReport.overallScore}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      out of 100
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 w-full">
                  <Badge className={`text-xs px-3.5 py-1 font-bold ${getSeverityBadgeClass(currentReport.overallSeverity)}`}>
                    {currentReport.overallSeverity} THREAT LEVEL
                  </Badge>
                  <div className="text-[10px] font-mono text-slate-400 pt-1">
                    0–29: LOW • 30–59: MEDIUM • 60–79: HIGH • 80–100: CRITICAL
                  </div>
                </div>
              </Card>

              {/* Stated Details & Executive Summary Card */}
              <Card className="lg:col-span-2 border border-slate-800 bg-[#070e22]/90 backdrop-blur-xl p-6 flex flex-col justify-between space-y-4 shadow-xl">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-sky-400" />
                      Executive Forensic Summary
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(currentReport.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed bg-[#040814] p-4 rounded-xl border border-slate-800/80">
                    {currentReport.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-[#040814] border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Employer</span>
                      <span className="font-semibold text-white truncate block">
                        {currentReport.companyName || "Unspecified"}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#040814] border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Target Role</span>
                      <span className="font-semibold text-white truncate block">
                        {currentReport.jobTitle || "Unspecified"}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#040814] border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Signals Intercepted</span>
                      <span className="font-semibold text-sky-400 block">
                        {currentReport.signals.length} threat markers
                      </span>
                    </div>
                  </div>
                </div>

                {/* RECOMMENDED ACTION CALLOUT */}
                <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>RECOMMENDED ACTION:</span>
                  </div>
                  <div className="text-xs text-red-200/90 leading-relaxed">
                    {currentReport.overallSeverity === "CRITICAL" || currentReport.overallSeverity === "HIGH" ? (
                      <p>
                        <strong>Do not pay upfront fees. Do not share credentials or OTPs.</strong> Verify the employer independently on their official corporate portal before taking further action.
                      </p>
                    ) : currentReport.overallSeverity === "MEDIUM" ? (
                      <p>
                        <strong>Exercise caution.</strong> Demand an authenticated corporate email confirmation and verify active job listings on the employer&apos;s corporate careers page.
                      </p>
                    ) : (
                      <p>
                        <strong>Opportunity appears consistent with authentic hiring patterns.</strong> Continue to exercise standard zero-trust caution when transmitting tax documentation.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* 5-DIMENSION CYBERSECURITY RISK MATRIX */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-sky-400" />
                  Five-Dimension Risk Matrix
                </h2>
                <span className="text-xs text-slate-500 font-mono">Why this score?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Financial Fraud */}
                <div className="p-4 rounded-xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Financial Fraud</span>
                    <span className="text-xs font-mono font-bold text-white">{currentReport.categoryScores.financialFraud}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
                  <p className="text-[10px] text-slate-400">Equipment fees, deposit traps, paid training</p>
                </div>

                {/* 2. Credential Risk */}
                <div className="p-4 rounded-xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Credential / RAT Risk</span>
                    <span className="text-xs font-mono font-bold text-white">{currentReport.categoryScores.credentialRisk}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
                  <p className="text-[10px] text-slate-400">OTP requests, AnyDesk/TeamViewer, PII</p>
                </div>

                {/* 3. Phishing / Impersonation */}
                <div className="p-4 rounded-xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Phishing / Impersonation</span>
                    <span className="text-xs font-mono font-bold text-white">{currentReport.categoryScores.phishingImpersonation}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
                  <p className="text-[10px] text-slate-400">Typosquatting, shorteners, public webmail</p>
                </div>

                {/* 4. Social Engineering */}
                <div className="p-4 rounded-xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Social Engineering</span>
                    <span className="text-xs font-mono font-bold text-white">{currentReport.categoryScores.socialEngineering}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
                  <p className="text-[10px] text-slate-400">Telegram migration, 24h pressure, secrecy</p>
                </div>

                {/* 5. Recruitment Credibility */}
                <div className="p-4 rounded-xl border border-slate-800 bg-[#070d1e]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Recruitment Credibility</span>
                    <span className="text-xs font-mono font-bold text-white">{currentReport.categoryScores.jobCredibility}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
                  <p className="text-[10px] text-slate-400">Salary realism, scope structure, task traps</p>
                </div>
              </div>
            </div>

            {/* "WHY THIS SCORE?" — ACTUAL DETECTED SIGNALS */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Why This Score? Detected Threat Signals ({currentReport.signals.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Each finding specifies the detected adversary technique, concrete evidence quotation, and safe response.
                </p>
              </div>

              {currentReport.signals.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-emerald-500/30 bg-[#09181c]/80 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="font-bold text-base text-emerald-200">
                    No Overt Cyber Threats Detected
                  </h3>
                  <p className="text-xs text-emerald-300/80 max-w-md mx-auto">
                    The submitted opportunity passed all 48+ fraud and impersonation heuristics. Always exercise zero-trust vigilance before sharing private credentials.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentReport.signals.map((signal, idx) => (
                    <Card
                      key={signal.id || idx}
                      className="border border-slate-800 bg-[#070e22]/90 p-5 space-y-3 shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-xs font-bold ${getSeverityBadgeClass(signal.severity)}`}>
                            {signal.severity}
                          </Badge>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {signal.technique}
                          </span>
                          <h3 className="font-bold text-sm text-white">
                            {signal.title}
                          </h3>
                        </div>
                      </div>

                      {/* Monospace Evidence Quotation */}
                      <div className="p-3 rounded-lg bg-[#040814] border border-slate-800 font-mono text-xs text-red-400 flex items-start gap-2">
                        <span className="text-slate-500 font-sans font-semibold shrink-0 uppercase text-[10px]">
                          Evidence:
                        </span>
                        <span className="italic break-all">&ldquo;{signal.evidence}&rdquo;</span>
                      </div>

                      {/* Why Attackers Use This & Recommended Safe Action */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-300 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-sky-400" />
                            Why Attackers Use This:
                          </span>
                          <p className="text-slate-400 leading-relaxed">
                            {signal.why}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="font-semibold text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Recommended Safe Action:
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {signal.action}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* POSITIVE TRUST SIGNALS VS ACTIONABLE NEXT STEPS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Positive Indicators */}
              <Card className="border border-slate-800 bg-[#070e22]/90 p-5 space-y-3 shadow-md">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Positive Trust Signals ({currentReport.positives.length})
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {currentReport.positives.map((pos, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{pos}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Actionable Safety Protocol */}
              <Card className="border border-slate-800 bg-[#070e22]/90 p-5 space-y-3 shadow-md">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  Defensive Action Plan
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {currentReport.actions.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
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
        {/* SCREEN 4: HISTORY & SCAN TELEMETRY */}
        {/* ========================================================================= */}
        {currentScreen === "history" && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Security Hub & Threat History
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Historical telemetry and incident records compiled across all your local job security scans.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  id="hub-new-scan-btn"
                  size="sm"
                  onClick={() => setCurrentScreen("analyze")}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
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
                    className="border-slate-700 bg-slate-900/60 text-xs text-red-400 hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear History
                  </Button>
                )}
              </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-1">
                <span className="text-xs uppercase font-mono text-slate-400">Total Analyses</span>
                <p className="text-3xl font-extrabold text-white">
                  {historyStats.totalScans}
                </p>
                <span className="text-[11px] text-slate-500">Evaluated locally</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-1">
                <span className="text-xs uppercase font-mono text-red-400">High / Critical Threats</span>
                <p className="text-3xl font-extrabold text-red-400">
                  {historyStats.highOrCriticalCount}
                </p>
                <span className="text-[11px] text-slate-500">
                  {historyStats.criticalThreats} Critical • {historyStats.highThreats} High
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-1">
                <span className="text-xs uppercase font-mono text-emerald-400">Low Risk Jobs</span>
                <p className="text-3xl font-extrabold text-emerald-400">
                  {historyStats.lowThreats}
                </p>
                <span className="text-[11px] text-slate-500">Passed core checks</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-[#070d1e]/80 space-y-1">
                <span className="text-xs uppercase font-mono text-sky-400">Threat Signals Logged</span>
                <p className="text-3xl font-extrabold text-sky-400">
                  {historyStats.totalSignalsDetected}
                </p>
                <span className="text-[11px] text-slate-500">Adversary indicators</span>
              </div>
            </div>

            {/* RECENT SCANS TABLE */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" />
                Recent Scan Reports ({historyList.length})
              </h2>

              {historyList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-3 bg-[#070d1e]/50">
                  <Search className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-400">No scanned opportunities yet.</p>
                  <Button
                    size="sm"
                    onClick={() => setCurrentScreen("analyze")}
                    className="bg-sky-600 text-white"
                  >
                    Run Your First Scan
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#070e22]/90">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#040814] border-b border-slate-800 text-slate-400 uppercase font-mono">
                      <tr>
                        <th className="p-4">Target Opportunity</th>
                        <th className="p-4">Recruiter / Domain</th>
                        <th className="p-4">Threat Index</th>
                        <th className="p-4">Severity</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {historyList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-semibold text-white">
                            <div>{item.jobTitle || "Unspecified Role"}</div>
                            <div className="text-[11px] font-normal text-slate-400">{item.companyName}</div>
                          </td>
                          <td className="p-4 font-mono text-slate-300">
                            {item.emailAnalysis.domain || "N/A"}
                          </td>
                          <td className="p-4 font-mono font-bold text-sm">
                            <span className={getScoreColorClass(item.overallScore)}>{item.overallScore}/100</span>
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
                              className="text-xs h-7 px-2.5 border-slate-700 bg-slate-900/80 text-slate-200"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteHistory(item.id)}
                              className="text-xs h-7 px-2 text-red-400 hover:bg-red-950/40"
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
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Recruitment Scam Radar Knowledge Base
                </h1>
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs">
                  2026 Threat Intel
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Deep analysis of contemporary recruitment attack vectors, adversary playbooks, and mitigation protocols.
              </p>
            </div>

            {/* FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium mr-1">Filter Vector:</span>
              {["ALL", "ADVANCE_FEE_FRAUD", "CREDENTIAL_HARVESTING", "IMPERSONATION", "FINANCIAL_FRAUD"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRadarFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    radarFilter === filter
                      ? "bg-sky-600 text-white shadow-sm font-semibold border border-sky-400/40"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
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
                  className="border border-slate-800 bg-[#070e22]/90 p-6 space-y-4 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-colors"
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

                    <h3 className="font-bold text-base text-white">
                      {scam.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scam.summary}
                    </p>

                    {/* How it works */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold text-slate-300 block">
                        How Attackers Execute It:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {scam.howItWorks.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-sky-400 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Real world quote */}
                    <div className="p-3 rounded-lg bg-[#040814] border border-slate-800 text-xs italic font-mono text-slate-300">
                      &ldquo;{scam.realWorldExample}&rdquo;
                    </div>
                  </div>

                  {/* Defense Protocol */}
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Defense Protocol:
                    </span>
                    <p className="text-emerald-400/90">
                      {scam.defenseProtocol[0]}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 6: CANDIDATE SAFETY TOOLKIT (4 PHASES) */}
        {/* ========================================================================= */}
        {currentScreen === "safety" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Candidate Due Diligence Safety Protocol
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs">
                  Zero-Trust Hiring Checklist
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Standard operating procedure to verify employer legitimacy before signing contracts or submitting identity documents.
              </p>
            </div>

            {/* 4 ACTIONABLE PHASES */}
            <div className="space-y-4">
              {[
                {
                  id: "phase-1",
                  phase: "BEFORE APPLYING",
                  action: "VERIFY",
                  title: "1. Independent Domain & Career Page Cross-Reference",
                  desc: "Manually navigate to the company's official corporate website (e.g. amazon.jobs or microsoft.com/careers) and verify the Job ID exists in their active catalog."
                },
                {
                  id: "phase-2",
                  phase: "BEFORE APPLYING",
                  action: "VERIFY",
                  title: "2. Recruiter Corporate Email Verification",
                  desc: "Ensure the recruiter contacts you from an authenticated corporate email domain (@company.com). If approached on WhatsApp/Telegram, demand an email confirmation from corporate mail."
                },
                {
                  id: "phase-3",
                  phase: "BEFORE PAYMENT",
                  action: "STOP",
                  title: "3. Absolute Zero-Payment Mandate",
                  desc: "Never transfer any money for equipment deposits, background verification, software licenses, or interview registration. Real employers absorb all onboarding costs."
                },
                {
                  id: "phase-4",
                  phase: "BEFORE PAYMENT",
                  action: "STOP",
                  title: "4. No Remote Access Tools (AnyDesk / TeamViewer)",
                  desc: "Never install remote control utilities or allow an unknown interviewer to access your desktop. Authentic technical assessments use browser-based code runners."
                },
                {
                  id: "phase-5",
                  phase: "BEFORE SHARING DATA",
                  action: "PROTECT",
                  title: "5. Require Live Video or Multi-Stage Technical Loops",
                  desc: "Refuse chat-only interviews conducted on Telegram or WhatsApp. Legitimate corporate positions require live multi-round interviews with cameras enabled."
                },
                {
                  id: "phase-6",
                  phase: "BEFORE SHARING DATA",
                  action: "PROTECT",
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
                    className={`cursor-pointer border p-5 transition-all flex items-start gap-4 shadow-md ${
                      isChecked
                        ? "border-emerald-500/40 bg-[#091a18]/90"
                        : "border-slate-800 bg-[#070e22]/90 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                        isChecked
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-700 bg-slate-900 text-transparent"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                          {item.phase}: {item.action}
                        </Badge>
                      </div>
                      <h3 className={`font-bold text-sm ${isChecked ? "text-emerald-300" : "text-white"}`}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* AFTER SUSPECTING FRAUD: REPORT */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#070e22]/90 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/15 text-red-300 border-red-500/30 text-xs font-bold">
                  AFTER SUSPECTING FRAUD: REPORT
                </Badge>
                <h2 className="font-bold text-base text-white">
                  Official Cybercrime Incident Portals
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-[#040814] border border-slate-800 space-y-2">
                  <span className="font-bold text-white block">
                    India (National Cyber Crime Portal)
                  </span>
                  <p className="text-slate-400">Report online financial fraud, UPI extortion, or fake job networks directly to central cyber police.</p>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    cybercrime.gov.in <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-[#040814] border border-slate-800 space-y-2">
                  <span className="font-bold text-white block">
                    USA / Global (FBI IC3 & FTC)
                  </span>
                  <p className="text-slate-400">Internet Crime Complaint Center for advance fee check scams, fake recruiters, and identity theft.</p>
                  <a
                    href="https://www.ic3.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    ic3.gov <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 7: SETTINGS & PRIVACY */}
        {/* ========================================================================= */}
        {currentScreen === "settings" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Security Preferences & Privacy Telemetry
                </h1>
                <Badge variant="outline" className="text-xs font-mono border-slate-700 text-slate-300">
                  Zero Cloud Sync
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Configure candidate sensitivity levels, local storage retention, and inspect zero-PII security policies.
              </p>
            </div>

            {/* Profile Preferences */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#070e22]/90 space-y-5 shadow-xl">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-400" />
                Candidate Profile Settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 uppercase font-mono">Candidate Name</Label>
                  <Input
                    value={currentUser?.name || ""}
                    onChange={(e) => handleUpdateProfileName(e.target.value)}
                    placeholder="Candidate Name"
                    className="bg-[#040814] border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 uppercase font-mono">Target Career Track</Label>
                  <Input
                    value={currentUser?.role || ""}
                    onChange={(e) => handleUpdateProfileRole(e.target.value)}
                    placeholder="e.g. Software Engineer Candidate"
                    className="bg-[#040814] border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-slate-400 uppercase font-mono">Threat Sensitivity Engine</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <button
                    onClick={() => handleUpdateSensitivity("STANDARD")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      threatSensitivity === "STANDARD"
                        ? "border-sky-500 bg-sky-950/40 text-white"
                        : "border-slate-800 bg-[#040814] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-sky-300 mb-1">Standard (Balanced)</div>
                    <p className="text-[11px] text-slate-400">Strictly flags overt advance fees, lookalikes, and OTP scams.</p>
                  </button>

                  <button
                    onClick={() => handleUpdateSensitivity("HIGH")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      threatSensitivity === "HIGH"
                        ? "border-sky-500 bg-sky-950/40 text-white"
                        : "border-slate-800 bg-[#040814] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-sky-300 mb-1">High Sensitivity</div>
                    <p className="text-[11px] text-slate-400">Strictly flags any public email recruiter and non-ATS links.</p>
                  </button>

                  <button
                    onClick={() => handleUpdateSensitivity("RELAXED")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      threatSensitivity === "RELAXED"
                        ? "border-sky-500 bg-sky-950/40 text-white"
                        : "border-slate-800 bg-[#040814] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-sky-300 mb-1">Relaxed</div>
                    <p className="text-[11px] text-slate-400">Permits startup informal processes unless extortion is detected.</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy & Zero-Trust Architecture */}
            <div className="p-6 rounded-2xl border border-sky-500/30 bg-[#070e22]/90 space-y-4 shadow-xl">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Zero-Trust Candidate Privacy Guarantee
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                JobLens operates on a strict zero-trust, client-side execution model. All heuristics, Levenshtein distance metrics, and header forensically execute inside your browser sandbox. No job descriptions, resumes, emails, or personal candidate details are ever stored on external tracking servers or sold to data brokers.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
                <span className="text-sky-400 font-semibold">Active Signatures: {threatIntel.offlineSignaturesCount} heuristics</span>
                <span>•</span>
                <span>Engine: {threatIntel.engineVersion}</span>
                <span>•</span>
                <span>Architecture: Local Zero-Trust</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 8: GEMINI AI MULTI-TURN FORENSIC CHATBOT */}
        {/* ========================================================================= */}
        {currentScreen === "chat" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Bot className="w-6 h-6 text-sky-400" />
                  Gemini Forensics Multi-Turn Assistant
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Interactive multi-turn scam investigation, contract review, and legal reasoning with persistent thread history.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentScreen("voice")}
                  className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 text-emerald-400 text-xs flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Switch to Voice Briefing</span>
                </Button>
              </div>
            </div>

            <GeminiChatbot />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 9: GEMINI LIVE VOICE INTERACTION */}
        {/* ========================================================================= */}
        {currentScreen === "voice" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Mic className="w-6 h-6 text-emerald-400" />
                  Gemini Live Voice Security Center
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Real-time spoken briefings and conversational interview fraud checks powered by gemini-3.1-flash-live-preview.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentScreen("chat")}
                  className="bg-slate-900 border-slate-800 hover:border-sky-500/50 text-sky-400 text-xs flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Open Text Chat</span>
                </Button>
              </div>
            </div>

            <GeminiVoiceLive />
          </div>
        )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800 bg-[#030712]/90 py-8 text-center text-xs text-slate-400 space-y-2 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white tracking-tight">JOBLENS CYBERSECURITY</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Recruitment Threat Intelligence Engine</span>
          </div>

          <p className="text-xs text-slate-500">
            Client-side explainable threat forensics. Zero PII transmission.
          </p>
        </div>
      </footer>
    </div>
  );
}
