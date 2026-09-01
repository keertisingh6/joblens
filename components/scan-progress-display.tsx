"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode,
  ShieldAlert,
  Radio,
  Activity,
  Sparkles,
  CheckCircle2,
  Cpu,
  Terminal,
  Zap
} from "lucide-react";

export interface ScanStageInfo {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  metrics: { name: string; status: string }[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  glowColor: string;
}

export const FORENSIC_SCAN_STAGES: ScanStageInfo[] = [
  {
    id: 1,
    tag: "METADATA INGESTION",
    title: "Identifying Recruitment Content",
    subtitle: "Parsing opportunity metadata, declared employer identities & contact channels",
    desc: "Extracting job specifications, declared employer entities, salary declarations, and remote communication channels.",
    metrics: [
      { name: "Role & Compensation Tokenizer", status: "VERIFIED" },
      { name: "Declared Entity Extraction", status: "RESOLVED" },
      { name: "Text Structure Normalization", status: "COMPLETE" },
    ],
    icon: FileCode,
    accentColor: "text-sky-400 border-sky-500/40 bg-sky-500/10",
    glowColor: "rgba(56, 189, 248, 0.4)",
  },
  {
    id: 2,
    tag: "ADVERSARY SIGNATURE SCAN",
    title: "Extracting Security Signals",
    subtitle: "Evaluating 48+ adversary tactics, advance fees, OTP harvesting & RAT traps",
    desc: "Cross-referencing input against known cyber syndicate playbook rules: refundable equipment deposits, crypto payouts, check cashing, and AnyDesk remote installations.",
    metrics: [
      { name: "Advance-Fee & Check Cashing Check", status: "EVALUATING" },
      { name: "RAT / AnyDesk Installation Traps", status: "INSPECTED" },
      { name: "48-Rule Pattern Signatures", status: "MATCHED" },
    ],
    icon: ShieldAlert,
    accentColor: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
    glowColor: "rgba(129, 140, 248, 0.4)",
  },
  {
    id: 3,
    tag: "INFRASTRUCTURE AUDIT",
    title: "Checking Trust Indicators",
    subtitle: "Verifying recruiter domain alignment, ATS portal infrastructure & RFC 822 mail headers",
    desc: "Inspecting recruiter domain-to-employer authenticity, verified ATS portals (Greenhouse, Lever, Workday), and cryptographic SPF/DKIM origin headers.",
    metrics: [
      { name: "Employer vs Recruiter Domain Match", status: "INSPECTED" },
      { name: "Recognized ATS Portal Validation", status: "CHECKED" },
      { name: "SPF/DKIM Cryptographic Headers", status: "PARSED" },
    ],
    icon: Radio,
    accentColor: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    glowColor: "rgba(34, 211, 238, 0.4)",
  },
  {
    id: 4,
    tag: "THREAT COMPUTATION",
    title: "Calculating Threat Score",
    subtitle: "Computing weighted multi-dimensional risk matrix & critical penalty floors",
    desc: "Executing weighted threat calculation across Financial, Domain Trust, Credential Harvesting, and Communication Channel risk vectors.",
    metrics: [
      { name: "Multi-Vector Penalty Weights", status: "APPLIED" },
      { name: "Critical Ceiling & Floor Rules", status: "CALCULATED" },
      { name: "Severity Classification Level", status: "RESOLVING" },
    ],
    icon: Activity,
    accentColor: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    glowColor: "rgba(251, 191, 36, 0.4)",
  },
  {
    id: 5,
    tag: "DEFENSE SYNTHESIS",
    title: "Generating Forensic Explanation",
    subtitle: "Synthesizing evidence quotations, defense protocols & candidate safety playbook",
    desc: "Compiling verbatim evidence citations, protective candidate recommendations, and customized defense action plans.",
    metrics: [
      { name: "Verbatim Evidence Quotations", status: "ASSEMBLED" },
      { name: "Candidate Safety Action Plan", status: "FORMED" },
      { name: "Final Defense Diagnostic Report", status: "READY" },
    ],
    icon: Sparkles,
    accentColor: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    glowColor: "rgba(52, 211, 153, 0.4)",
  },
];

interface ScanProgressDisplayProps {
  scanStep: number;
  companyName?: string;
  jobTitle?: string;
}

export function ScanProgressDisplay({
  scanStep,
  companyName,
  jobTitle,
}: ScanProgressDisplayProps) {
  const currentStageIndex = Math.max(0, Math.min(scanStep - 1, FORENSIC_SCAN_STAGES.length - 1));
  const currentStage = FORENSIC_SCAN_STAGES[currentStageIndex];
  const IconComponent = currentStage.icon;
  const progressPercent = Math.min(100, Math.round((scanStep / FORENSIC_SCAN_STAGES.length) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -16 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-[#070e24]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl"
    >
      {/* Background Animated Ambient Lights */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-28 -right-28 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.15, 1, 1.15],
          opacity: [0.1, 0.18, 0.1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
      />

      {/* Cyber Grid Lines overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0f1f4208_1px,transparent_1px),linear-gradient(to_bottom,#0f1f4208_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 space-y-8">
        {/* Top Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
                  Forensic Threat Diagnostic Engine
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[11px] text-slate-400">v4.2 Active Analysis</span>
              </div>
              {(companyName || jobTitle) && (
                <div className="text-xs text-slate-300 font-medium truncate max-w-md mt-0.5">
                  Target: <span className="text-white font-semibold">{companyName || "Declared Employer"}</span>
                  {jobTitle && <span className="text-slate-400"> — {jobTitle}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-950/60 px-3.5 py-1.5 font-mono text-xs font-bold text-sky-300 shadow-inner">
              <Zap className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
              <span>STAGE {scanStep} OF 5</span>
            </div>
            <div className="font-mono text-sm font-black text-white">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Central Holographic Sonar / Radar Display */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center">
            {/* Outer Pulsing Glow */}
            <motion.div
              animate={{
                scale: [0.95, 1.1, 0.95],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-sky-500/10 blur-xl"
            />

            {/* Rotating Outer Dashed Radar Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-sky-500/30"
            />

            {/* Counter-Rotating Middle Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              className="absolute inset-3 rounded-full border border-sky-400/20"
            />

            {/* Sonar Radar Sweep Beam */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute inset-0 rounded-full origin-center"
              style={{
                background: "conic-gradient(from 0deg, rgba(56, 189, 248, 0.35) 0deg, rgba(56, 189, 248, 0) 65deg, transparent 360deg)",
              }}
            />

            {/* Inner Core Ring */}
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border border-sky-400/40 bg-gradient-to-b from-[#0e1d3e] to-[#081026] shadow-xl shadow-sky-900/30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage.id}
                  initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.6, opacity: 0, rotate: 20 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex items-center justify-center text-sky-400"
                >
                  <IconComponent className="h-9 w-9 sm:h-11 sm:w-11" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 5-Stage Stepper Progression Nodes */}
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {FORENSIC_SCAN_STAGES.map((stage) => {
              const isCompleted = stage.id < scanStep;
              const isActive = stage.id === scanStep;

              return (
                <div key={stage.id} className="relative flex flex-col items-center text-center">
                  <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center">
                    {/* Active Pulsing Ring */}
                    {isActive && (
                      <motion.div
                        layoutId="activeRing"
                        animate={{
                          scale: [1, 1.25, 1],
                          opacity: [0.7, 0.2, 0.7],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-xl bg-sky-400/30 border border-sky-400"
                      />
                    )}

                    <motion.div
                      animate={{
                        scale: isActive ? 1.05 : 1,
                      }}
                      className={`relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/40"
                          : isActive
                          ? "bg-sky-500 text-white border border-sky-300 shadow-lg shadow-sky-500/40"
                          : "bg-slate-900/80 text-slate-500 border border-slate-800"
                      }`}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                        </motion.div>
                      ) : (
                        <span>0{stage.id}</span>
                      )}
                    </motion.div>
                  </div>

                  <div className="mt-2 hidden md:block">
                    <span
                      className={`text-[10px] font-mono font-semibold uppercase tracking-wider block truncate max-w-[120px] ${
                        isActive
                          ? "text-sky-300 font-bold"
                          : isCompleted
                          ? "text-emerald-400/90"
                          : "text-slate-500"
                      }`}
                    >
                      {stage.tag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Smooth Continuous Gradient Progress Bar */}
          <div className="relative pt-1">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 85, damping: 16 }}
                className="relative h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400"
              >
                {/* Glowing Spark Particle at progress edge */}
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white blur-[2px] shadow-lg shadow-sky-300"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Dynamic Stage Narrative Card with AnimatePresence */}
        <div className="min-h-[150px] sm:min-h-[135px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage.id}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="space-y-4 rounded-2xl border border-slate-800/90 bg-[#04091a]/80 p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-sky-500/40 bg-sky-950/80 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300">
                    STAGE 0{currentStage.id} • {currentStage.tag}
                  </span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {currentStage.subtitle}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400">
                  <Cpu className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Heuristic Pass...</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{currentStage.title}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {currentStage.desc}
                </p>
              </div>

              {/* Dynamic Live Telemetry Chips */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex flex-wrap items-center gap-2">
                  {currentStage.metrics.map((metric, idx) => (
                    <motion.div
                      key={metric.name}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.2 }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-[11px] font-mono text-slate-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      <span>{metric.name}:</span>
                      <span className="font-bold text-sky-300 font-mono text-[10px]">
                        [{metric.status}]
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live Terminal Telemetry Footnote */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-[#030612]/90 px-4 py-2.5 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-400 font-bold">[ENGINE]</span>
            <span className="truncate">
              Zero-Trust heuristic evaluation in memory • Sandbox Isolation Active
            </span>
          </div>
          <span className="text-slate-500 shrink-0 hidden sm:inline">
            Execution ID: sec_{Math.abs(currentStage.id * 8923).toString(16)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
