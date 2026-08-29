"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ExternalLink,
  History,
  RefreshCw,
  Search,
  Settings,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CyberThreatReport, JobInputForm } from "@/lib/security/types";
import { runThreatAnalysis } from "@/lib/security/rule-engine";
import { getUserAccount, saveUserAccount, type UserAccount } from "@/lib/security/auth-store";

export interface SimulatedPage {
  id: string;
  name: string;
  platform: string;
  url: string;
  jobTitle: string;
  companyName: string;
  recruiterEmail: string;
  jobDescription: string;
  isRecruitmentPage: boolean;
}

interface ExtensionSidepanelViewProps {
  activePage: SimulatedPage;
  onOpenFullReport?: (report: CyberThreatReport) => void;
  onSelectTextTrigger?: () => void;
}

export function ExtensionSidepanelView({
  activePage,
  onOpenFullReport,
  onSelectTextTrigger
}: ExtensionSidepanelViewProps) {
  const [activeTab, setActiveTab] = useState<"scan" | "history" | "settings">("scan");
  const [user, setUser] = useState<UserAccount>(getUserAccount());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<CyberThreatReport | null>(null);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>("");
  const [recentScans, setRecentScans] = useState<CyberThreatReport[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [reportedIncident, setReportedIncident] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean>(user.onboardingCompleted);

  // Onboarding form fields
  const [onboardName, setOnboardName] = useState<string>(user.name || "Keerti Singh");
  const [onboardEmail, setOnboardEmail] = useState<string>(user.email || "keerti@example.com");
  const [onboardRole, setOnboardRole] = useState<string>(user.role || "Software Candidate");
  const [onboardSensitivity, setOnboardSensitivity] = useState<"STANDARD" | "AGGRESSIVE" | "RELAXED">(
    user.preferences.threatSensitivity || "STANDARD"
  );

  // Auto-scan whenever activePage changes if protection is enabled
  useEffect(() => {
    if (!user.preferences.protectionEnabled) return;
    if (activePage.isRecruitmentPage) {
      executeScan({
        jobTitle: activePage.jobTitle,
        companyName: activePage.companyName,
        recruiterEmail: activePage.recruiterEmail,
        applicationUrl: activePage.url,
        jobDescription: activePage.jobDescription
      });
    } else {
      setCurrentReport(null);
    }
  }, [
    activePage.id,
    activePage.isRecruitmentPage,
    activePage.jobTitle,
    activePage.companyName,
    activePage.recruiterEmail,
    activePage.url,
    activePage.jobDescription,
    user.preferences.protectionEnabled
  ]);

  const executeScan = (input: JobInputForm) => {
    setIsScanning(true);
    setReportedIncident(null);
    setTimeout(() => {
      const rep = runThreatAnalysis(input);
      setCurrentReport(rep);
      setIsScanning(false);
      setRecentScans((prev) => [rep, ...prev.filter((p) => p.id !== rep.id)].slice(0, 15));
    }, 400);
  };

  const handleToggleProtection = (checked: boolean) => {
    const updated = {
      ...user,
      preferences: { ...user.preferences, protectionEnabled: checked }
    };
    setUser(updated);
    saveUserAccount(updated);
    if (checked && activePage.isRecruitmentPage) {
      executeScan({
        jobTitle: activePage.jobTitle,
        companyName: activePage.companyName,
        recruiterEmail: activePage.recruiterEmail,
        applicationUrl: activePage.url,
        jobDescription: activePage.jobDescription
      });
    }
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserAccount = {
      ...user,
      name: onboardName,
      email: onboardEmail,
      role: onboardRole,
      onboardingCompleted: true,
      preferences: {
        ...user.preferences,
        threatSensitivity: onboardSensitivity,
        protectionEnabled: true
      }
    };
    setUser(updated);
    saveUserAccount(updated);
    setOnboardingDone(true);
    if (activePage.isRecruitmentPage) {
      executeScan({
        jobTitle: activePage.jobTitle,
        companyName: activePage.companyName,
        recruiterEmail: activePage.recruiterEmail,
        applicationUrl: activePage.url,
        jobDescription: activePage.jobDescription
      });
    }
  };

  const handleManualScan = () => {
    if (!manualText.trim()) return;
    executeScan({
      jobTitle: "Pasted Opportunity / Text Selection",
      companyName: "Extracted Target",
      recruiterEmail: "",
      applicationUrl: activePage.url || "",
      jobDescription: manualText
    });
    setIsManualOpen(false);
    setManualText("");
  };

  const handleMarkSafe = () => {
    if (!currentReport) return;
    const modified: CyberThreatReport = {
      ...currentReport,
      overallScore: Math.max(0, currentReport.overallScore - 40),
      overallSeverity: "LOW",
      positives: ["Candidate manually verified company recruiter identity", ...currentReport.positives]
    };
    setCurrentReport(modified);
  };

  const handleReportScam = () => {
    const incId = `INC-${Date.now().toString(36).toUpperCase()}`;
    setReportedIncident(incId);
  };

  const copySummary = () => {
    if (!currentReport) return;
    const text = `JobLens Threat Report: ${currentReport.jobTitle} at ${currentReport.companyName}
Threat Score: ${currentReport.overallScore}/100 (${currentReport.overallSeverity})
Core Red Flag: ${currentReport.signals[0]?.why || "None detected"}
Defensive Action: ${currentReport.signals[0]?.action || "Verified standard process"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If first-time onboarding
  if (!onboardingDone) {
    return (
      <div id="ext-sidepanel-onboarding" className="w-full h-full bg-slate-950 text-slate-100 flex flex-col p-5 font-sans border-l border-slate-800">
        <div className="text-center my-auto space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-slate-100">JobLens Extension</h2>
            <p className="text-xs text-sky-400 font-medium">Recruitment Cybersecurity Layer</p>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Proactive real-time defense against advance-fee scams, impersonation, and fraudulent job postings.
            </p>
          </div>

          <form onSubmit={handleCompleteOnboarding} className="space-y-3 text-left pt-2">
            <div>
              <Label className="text-xs text-slate-300">Your Full Name</Label>
              <Input
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                placeholder="e.g. Keerti Singh"
                required
                className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Account Email (Alert Sync)</Label>
              <Input
                type="email"
                value={onboardEmail}
                onChange={(e) => setOnboardEmail(e.target.value)}
                placeholder="e.g. keerti@example.com"
                required
                className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Target Role / Industry</Label>
              <Input
                value={onboardRole}
                onChange={(e) => setOnboardRole(e.target.value)}
                placeholder="e.g. Software Engineer / Data"
                className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Threat Sensitivity Level</Label>
              <select
                value={onboardSensitivity}
                onChange={(e) => setOnboardSensitivity(e.target.value as "STANDARD" | "AGGRESSIVE" | "RELAXED")}
                className="w-full h-8 text-xs bg-slate-900 border border-slate-700 rounded-md px-2 text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="STANDARD">Standard (Balanced Heuristics)</option>
                <option value="AGGRESSIVE">Aggressive (Zero-Trust Strict)</option>
                <option value="RELAXED">Relaxed (Critical Flags Only)</option>
              </select>
            </div>

            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold h-9 mt-4 shadow-sm">
              Enable Proactive Protection
            </Button>
          </form>
          <p className="text-[11px] text-slate-500">🔒 Evaluates opportunities locally with zero credential tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="ext-sidepanel-main" className="w-full h-full bg-slate-950 text-slate-100 flex flex-col font-sans border-l border-slate-800/80 shadow-2xl select-none">
      {/* 1. EXTENSION HEADER */}
      <header className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 tracking-tight">JobLens</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-1 rounded">v2.0</span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Recruitment Security</span>
          </div>
        </div>

        {/* Protection ON/OFF Toggle */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${user.preferences.protectionEnabled ? "text-emerald-400" : "text-slate-400"}`}>
            Protection: {user.preferences.protectionEnabled ? "ON" : "OFF"}
          </span>
          <Switch
            checked={user.preferences.protectionEnabled}
            onCheckedChange={handleToggleProtection}
            className="data-[state=checked]:bg-sky-600 scale-90"
          />
        </div>
      </header>

      {/* 2. TAB NAV BAR */}
      <div className="flex items-center bg-slate-900/60 p-1 border-b border-slate-800/80 text-[11px] font-medium text-slate-400 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "scan" ? "bg-slate-800 text-sky-400 font-semibold shadow-sm" : "hover:text-slate-200"
          }`}
        >
          <Search className="w-3 h-3" /> Live Scan
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "history" ? "bg-slate-800 text-sky-400 font-semibold shadow-sm" : "hover:text-slate-200"
          }`}
        >
          <History className="w-3 h-3" /> History ({recentScans.length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "settings" ? "bg-slate-800 text-sky-400 font-semibold shadow-sm" : "hover:text-slate-200"
          }`}
        >
          <Settings className="w-3 h-3" /> Settings
        </button>
      </div>

      {/* 3. TAB BODIES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs custom-scrollbar">
        {activeTab === "scan" && (
          <>
            {/* Context Card: What the extension currently detects on page */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/90 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] uppercase font-bold bg-sky-500/10 text-sky-400 border-sky-500/30 px-1.5 py-0">
                  {activePage.platform}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activePage.isRecruitmentPage ? "Auto-Extracted" : "Unclassified Page"}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-100 text-xs truncate">
                  {activePage.isRecruitmentPage ? activePage.jobTitle : "Generic Webpage View"}
                </h4>
                <p className="text-[11px] text-slate-300 truncate">
                  {activePage.isRecruitmentPage ? activePage.companyName : activePage.url}
                </p>
                {activePage.recruiterEmail && (
                  <p className="text-[10px] text-sky-400 font-mono truncate mt-0.5">
                    ✉️ {activePage.recruiterEmail}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    activePage.isRecruitmentPage
                      ? executeScan({
                          jobTitle: activePage.jobTitle,
                          companyName: activePage.companyName,
                          recruiterEmail: activePage.recruiterEmail,
                          applicationUrl: activePage.url,
                          jobDescription: activePage.jobDescription
                        })
                      : null
                  }
                  className="h-6 text-[10px] px-2 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <RefreshCw className={`w-2.5 h-2.5 mr-1 ${isScanning ? "animate-spin" : ""}`} /> Rescan Page
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsManualOpen(!isManualOpen)}
                  className="h-6 text-[10px] px-2 text-slate-300 hover:text-white hover:bg-slate-800 ml-auto"
                >
                  ✏️ Custom Text
                </Button>
              </div>
            </div>

            {/* Collapsible Manual Input */}
            {isManualOpen && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-sky-500/40 space-y-2 animate-in fade-in duration-200">
                <Label className="text-[11px] font-semibold text-sky-300 block">
                  Scan Selected Text / WhatsApp / Recruiter Message:
                </Label>
                <Textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste message, Telegram chat, or selected text here (e.g. 'Selected for job, send Aadhaar & bank details')..."
                  className="h-20 text-[11px] bg-slate-950 border-slate-700 text-slate-200 resize-none font-mono"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => setIsManualOpen(false)} className="h-6 text-[10px] text-slate-400">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleManualScan} className="h-6 text-[10px] bg-sky-600 hover:bg-sky-500 text-white font-medium">
                    Analyze Content
                  </Button>
                </div>
              </div>
            )}

            {/* SCANNING SPINNER */}
            {isScanning && (
              <div className="py-8 text-center space-y-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Evaluating recruitment threat vectors...</p>
                <p className="text-[10px] text-slate-400">Inspecting fees, urgency, credentials & recruiter identity</p>
              </div>
            )}

            {/* STATE A: NO JOB DETECTED ON PAGE */}
            {!isScanning && !activePage.isRecruitmentPage && !currentReport && (
              <div className="p-4 rounded-lg bg-slate-900/80 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto text-lg">
                  🔎
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs">
                    JobLens couldn&apos;t identify a job posting on this page.
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    You can highlight text on the webpage or paste recruiter messages directly into the scanner.
                  </p>
                </div>
                <div className="space-y-1.5 pt-1">
                  <Button
                    size="sm"
                    onClick={onSelectTextTrigger || (() => setIsManualOpen(true))}
                    className="w-full h-8 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium"
                  >
                    ✂️ Select Text to Scan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsManualOpen(true)}
                    className="w-full h-8 text-xs border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    📋 Paste Opportunity / Message
                  </Button>
                </div>
              </div>
            )}

            {/* STATE B: SCAN RESULT PRESENT */}
            {!isScanning && currentReport && (
              <div className="space-y-2.5">
                {/* 1. RISK HEADER BANNER */}
                <div
                  className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                    currentReport.overallSeverity === "CRITICAL"
                      ? "bg-red-950/40 border-red-500/50 text-red-100"
                      : currentReport.overallSeverity === "HIGH"
                      ? "bg-orange-950/40 border-orange-500/50 text-orange-100"
                      : currentReport.overallSeverity === "MEDIUM"
                      ? "bg-amber-950/40 border-amber-500/50 text-amber-100"
                      : "bg-emerald-950/40 border-emerald-500/50 text-emerald-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">
                        {currentReport.overallSeverity === "CRITICAL"
                          ? "🚨"
                          : currentReport.overallSeverity === "HIGH"
                          ? "⚠️"
                          : currentReport.overallSeverity === "MEDIUM"
                          ? "⚡"
                          : "🟢"}
                      </span>
                      <span className="font-extrabold text-xs tracking-tight">
                        {currentReport.overallSeverity === "CRITICAL"
                          ? "RECRUITMENT SCAM DETECTED"
                          : currentReport.overallSeverity === "HIGH"
                          ? "HIGH RECRUITMENT RISK"
                          : currentReport.overallSeverity === "MEDIUM"
                          ? "MODERATE RISK SIGNALS"
                          : "LOW RISK OPPORTUNITY"}
                      </span>
                    </div>

                    <div className="flex items-baseline bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                      <span className="font-extrabold text-sm text-white">{currentReport.overallScore}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5">/100</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        currentReport.overallSeverity === "CRITICAL"
                          ? "bg-red-500"
                          : currentReport.overallSeverity === "HIGH"
                          ? "bg-orange-500"
                          : currentReport.overallSeverity === "MEDIUM"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${currentReport.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* 2. LOW RISK STATE */}
                {currentReport.overallSeverity === "LOW" && (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Trust Indicators Verified
                    </div>
                    <ul className="space-y-1 text-[11px] text-emerald-200/90 pl-3 list-disc">
                      <li>Verified corporate domain or recognized hiring portal</li>
                      <li>Standard recruitment interview process observed</li>
                      <li>No upfront deposits, hardware fees, or crypto solicitations</li>
                    </ul>
                    <p className="text-[11px] font-semibold text-emerald-400 pt-1 border-t border-emerald-500/20">
                      Continue with normal verification.
                    </p>
                  </div>
                )}

                {/* 3. HIGH / CRITICAL / MEDIUM RISK BREAKDOWN */}
                {currentReport.overallSeverity !== "LOW" && (
                  <div className="space-y-2">
                    {/* Category Badges */}
                    <div className="flex flex-wrap gap-1">
                      {currentReport.signals.slice(0, 3).map((sig, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] font-bold bg-red-500/10 text-red-300 border-red-500/30 px-1.5 py-0.5"
                        >
                          {sig.category.replace("_", " ")}
                        </Badge>
                      ))}
                      {currentReport.emailAnalysis.domainType === "PUBLIC" && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border-amber-500/30 px-1.5 py-0.5">
                          Public Webmail
                        </Badge>
                      )}
                    </div>

                    {/* WHY Callout */}
                    <div className="p-2.5 rounded-md bg-red-950/30 border-l-2 border-red-500 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                        WHY THIS MATTERS:
                      </span>
                      <p className="text-slate-200 leading-snug">
                        {currentReport.signals[0]?.why ||
                          "This opportunity asks candidates to pay fees or submit confidential credentials before verification."}
                      </p>
                    </div>

                    {/* ACTION Callout */}
                    <div className="p-2.5 rounded-md bg-sky-950/30 border-l-2 border-sky-500 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                        RECOMMENDED DEFENSIVE ACTION:
                      </span>
                      <p className="text-slate-200 leading-snug">
                        {currentReport.signals[0]?.action ||
                          "Do not pay. Verify the employer through its official careers website."}
                      </p>
                    </div>

                    {/* Detected Evidence Snippets */}
                    {currentReport.signals.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                          <span>🔍 Detected Evidence ({currentReport.signals.length})</span>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          {currentReport.signals.slice(0, 3).map((sig, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80 space-y-0.5">
                              <span className="text-[10px] font-bold text-red-400 block">• {sig.title}</span>
                              <p className="text-[10px] font-mono text-slate-300 bg-black/40 px-1 py-0.5 rounded break-all">
                                &ldquo;{sig.evidence}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reported Confirmation Notice */}
                {reportedIncident && (
                  <div className="p-2 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center justify-between">
                    <span>🛡️ Incident logged: <strong>{reportedIncident}</strong></span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}

                {/* 4. PRIMARY ACTION BUTTONS */}
                <div className="space-y-1.5 pt-1">
                  <Button
                    onClick={() => onOpenFullReport?.(currentReport)}
                    className="w-full h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Full Analysis in Dashboard
                  </Button>

                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReportScam}
                      className="h-7 text-[10px] border-slate-800 text-red-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-500/40"
                    >
                      🚨 Report
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkSafe}
                      className="h-7 text-[10px] border-slate-800 text-emerald-400 hover:bg-emerald-950/30 hover:text-emerald-300 hover:border-emerald-500/40"
                    >
                      🛡️ Safe
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copySummary}
                      className="h-7 text-[10px] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      {copied ? "✓ Copied" : "📋 Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: THREAT HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
              <span className="font-semibold">Recent Opportunities Scanned</span>
              <button
                onClick={() => setRecentScans([])}
                className="text-[10px] text-slate-400 hover:text-slate-200"
              >
                Clear History
              </button>
            </div>

            {recentScans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No scan history recorded in this session.
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentScans.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCurrentReport(item);
                      setActiveTab("scan");
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 truncate max-w-[170px] text-[11px]">
                        {item.jobTitle || "Job Listing"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0 ${
                          item.overallSeverity === "CRITICAL"
                            ? "bg-red-500/10 text-red-400 border-red-500/40"
                            : item.overallSeverity === "HIGH"
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/40"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                        }`}
                      >
                        {item.overallScore}/100 {item.overallSeverity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.companyName}</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXTENSION SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-slate-200">Protection Preferences</h4>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Auto-scan Job Postings</span>
                  <span className="text-[10px] text-slate-400">Evaluates LinkedIn, Naukri & Indeed automatically</span>
                </div>
                <Switch
                  checked={user.preferences.autoScanJobPages}
                  onCheckedChange={(c) => {
                    const u = { ...user, preferences: { ...user.preferences, autoScanJobPages: c } };
                    setUser(u);
                    saveUserAccount(u);
                  }}
                  className="data-[state=checked]:bg-sky-600 scale-90"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Browser Threat Badges</span>
                  <span className="text-[10px] text-slate-400">Display warning count on extension icon</span>
                </div>
                <Switch
                  checked={user.preferences.showRiskBadge}
                  onCheckedChange={(c) => {
                    const u = { ...user, preferences: { ...user.preferences, showRiskBadge: c } };
                    setUser(u);
                    saveUserAccount(u);
                  }}
                  className="data-[state=checked]:bg-sky-600 scale-90"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-300">Heuristic Sensitivity</Label>
                <select
                  value={user.preferences.threatSensitivity}
                  onChange={(e) => {
                    const u = {
                      ...user,
                      preferences: { ...user.preferences, threatSensitivity: e.target.value as "STANDARD" | "AGGRESSIVE" | "RELAXED" }
                    };
                    setUser(u);
                    saveUserAccount(u);
                  }}
                  className="w-full h-8 text-xs bg-slate-950 border border-slate-700 rounded px-2 text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="STANDARD">Standard (Balanced Heuristics)</option>
                  <option value="AGGRESSIVE">Aggressive (Zero-Trust Strict)</option>
                  <option value="RELAXED">Relaxed (Critical Flags Only)</option>
                </select>
              </div>
            </div>

            {/* Authenticated User Status */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <span className="font-bold text-xs text-slate-200 block truncate">{user.name}</span>
                <span className="text-[10px] text-slate-400 truncate block">{user.email}</span>
              </div>
              <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                Connected
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM DOCK FOOTER */}
      <footer className="p-2 border-t border-slate-800/90 bg-slate-900/90 text-center shrink-0">
        <span className="text-[10px] text-slate-400 font-mono">
          🔒 JobLens Heuristic Engine • Privacy-Preserving Scan
        </span>
      </footer>
    </div>
  );
}
