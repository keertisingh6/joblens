"use client";

import { useState } from "react";
import {
  Download,
  Lock,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtensionSidepanelView, type SimulatedPage } from "./extension-sidepanel-view";
import type { CyberThreatReport } from "@/lib/security/types";
import { generateExtensionZip } from "@/lib/extension-builder";

export const SIMULATED_WEBPAGES: SimulatedPage[] = [
  {
    id: "linkedin-advance-fee",
    name: "LinkedIn: Remote Software Engineer (Advance-Fee Laptop Scam)",
    platform: "LinkedIn Jobs",
    url: "https://www.linkedin.com/jobs/view/4198231902",
    jobTitle: "Senior React / Next.js Engineer (Remote)",
    companyName: "Vertex Global Cloud Ltd (Impersonated)",
    recruiterEmail: "recruiter.apex.hr@gmail.com",
    isRecruitmentPage: true,
    jobDescription: `Job Summary:
We are hiring an experienced Full-Stack Engineer to join our decentralized development unit.

Responsibilities:
• Architect robust Next.js frontend applications and distributed microservices.
• Lead agile sprint planning and code audits.

Qualifications:
• 3+ years experience with React, TypeScript, and modern state architecture.

Onboarding Equipment Protocol:
⚠️ All selected candidates must deposit a refundable equipment and hardware insurance fee of $150 prior to dispatching your enterprise Apple MacBook Pro M3 Max. This fee will be 100% reimbursed on your first monthly paycheck. Submit candidate PAN/Aadhaar and bank account verification details to proceed.`
  },
  {
    id: "naukri-task-scam",
    name: "Naukri: Part-Time Data Assistant (Telegram Task & Crypto Scam)",
    platform: "Naukri.com",
    url: "https://www.naukri.com/job-listings-data-entry-freelance-remote-982103",
    jobTitle: "Part-Time Digital Assistant / Online Task Evaluator",
    companyName: "Global Media Work Solutions",
    recruiterEmail: "quickhire.talent@rediffmail.com",
    isRecruitmentPage: true,
    jobDescription: `Immediate Vacancy: Earn ₹3,500 - ₹8,000 daily from home!
Direct selection without interview! Limited vacancies.

Job Responsibilities:
• Like YouTube videos, write 5-star Google Maps reviews, and complete digital merchant tasks.
• Instant daily payouts directly to your UPI/Crypto wallet.

How to Apply:
Do NOT apply here on Naukri. Direct WhatsApp or Telegram hiring manager at @HrGlobalTalentTask on Telegram to receive your daily task token and account activation registration fee voucher.`
  },
  {
    id: "indeed-verified-job",
    name: "Indeed: Verified Cloud Infrastructure Engineer (Legitimate)",
    platform: "Indeed.com",
    url: "https://www.indeed.com/viewjob?jk=7a91bf208c5e",
    jobTitle: "Staff Cloud Infrastructure Engineer",
    companyName: "Stripe Technologies India Pvt Ltd",
    recruiterEmail: "talent-acquisition@stripe.com",
    isRecruitmentPage: true,
    jobDescription: `Stripe is looking for a Staff Cloud Infrastructure Engineer to design scalable Kubernetes infrastructure and telemetry systems across multiple global regions.

What you'll do:
• Build resilient infrastructure automation using Terraform, AWS, and GCP.
• Ensure 99.999% availability for payment processing pipelines.

Requirements:
• 6+ years experience with distributed systems, Linux systems internals, and Go/Python.
• Deep understanding of cloud networking, DNS, and zero-trust authentication.

Hiring Process:
• Initial recruiter phone screen
• Technical architecture interview & coding deep-dive
• Values and systems collaboration interview
• Official offer letter sent directly through Stripe Careers (jobs.lever.co/stripe). We never request equipment fees, application charges, or bank credentials.`
  },
  {
    id: "telegram-recruiter-chat",
    name: "Telegram/WhatsApp: Recruiter DM (Aadhaar & Bank Harvesting)",
    platform: "Recruiter Chat / DM",
    url: "https://web.telegram.org/a/#@Recruiter_HR_Talent",
    jobTitle: "Direct Recruiter Chat Offer",
    companyName: "Alleged Amazon Recruitment Team",
    recruiterEmail: "hr-talent-desk@fastmail.com",
    isRecruitmentPage: true,
    jobDescription: `Congratulations! Your resume was shortlisted from our talent pool for the position of Virtual Assistant / Ops Support ($45/hr).

To finalize your provisional offer letter, please reply with:
1. Full Legal Name & Date of Birth
2. Copy of Aadhaar Card / National ID front & back
3. Bank Account Number & IFSC code for direct payroll setup
4. 6-digit confirmation code sent to your mobile phone (OTP)`
  },
  {
    id: "gmail-interview-invite",
    name: "Gmail: Offer Letter & Hardware Dispatch Demand",
    platform: "Gmail Webmail",
    url: "https://mail.google.com/mail/u/0/#inbox/FMfcgzQZTMpD",
    jobTitle: "Offer of Employment & Pre-Joining Logistics",
    companyName: "Cognizant Technology Services (Lookalike Domain: cognizant-careers-hr.com)",
    recruiterEmail: "onboarding@cognizant-careers-hr.com",
    isRecruitmentPage: true,
    jobDescription: `Subject: OFFICIAL APPOINTMENT LETTER - COGNIZANT HR

Dear Candidate,

We are pleased to offer you the position of Senior Analyst at Cognizant. Attached is your appointment letter.

Before we can courier your corporate IT workstation and secure VPN token, you are required to remit a refundable security bond of ₹9,500 via GooglePay/PhonePe to our logistics partner.

Failure to deposit within 24 hours will result in automatic offer cancellation.`
  },
  {
    id: "generic-unrelated-page",
    name: "Generic Webpage: TechCrunch Article (No Job Posting)",
    platform: "Tech News Portal",
    url: "https://techcrunch.com/2026/08/25/ai-security-breakthroughs/",
    jobTitle: "Unclassified Content",
    companyName: "TechCrunch",
    recruiterEmail: "",
    isRecruitmentPage: false,
    jobDescription: `The rapid evolution of browser-side security agents has transformed cybersecurity in 2026. Security researchers highlight the shift from reactive URL blocklists to active contextual heuristics and behavioral pattern analysis.`
  }
];

interface ExtensionSimulatorProps {
  onOpenFullReport?: (report: CyberThreatReport) => void;
}

export function ExtensionSimulator({ onOpenFullReport }: ExtensionSimulatorProps) {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const activePage = SIMULATED_WEBPAGES[selectedPageIndex];

  const handleDownloadExtensionZip = async () => {
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
      console.error("Failed to generate extension zip:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. SCENARIO PILLS & CONTROLS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-semibold text-slate-400 px-1 hidden sm:inline">Scenario:</span>
          {SIMULATED_WEBPAGES.map((page, idx) => (
            <button
              key={page.id}
              onClick={() => setSelectedPageIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedPageIndex === idx
                  ? "bg-sky-600 text-white shadow-sm font-semibold"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>
                {page.id.includes("verified") ? "🟢" : page.isRecruitmentPage ? "🚨" : "📰"}
              </span>
              <span>{page.platform}</span>
            </button>
          ))}
        </div>

        {/* Quick Toolbar Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            size="sm"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            variant="ghost"
            className="h-7 text-xs px-2.5 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {isSidePanelOpen ? <PanelRightClose className="w-3.5 h-3.5 mr-1" /> : <PanelRightOpen className="w-3.5 h-3.5 mr-1" />}
            <span>Side Panel</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadExtensionZip}
            disabled={isDownloading}
            className="h-7 text-xs px-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? "Packaging..." : "Get Extension (.zip)"}</span>
          </Button>
        </div>
      </div>

      {/* 2. SIMULATED BROWSER WINDOW WITH DOCKED SIDE PANEL */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">
        {/* Browser Top Titlebar */}
        <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-3 select-none">
          {/* Window dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Browser URL Bar */}
          <div className="flex-1 max-w-xl mx-auto flex items-center bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-300 gap-2">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate font-mono text-[11px] flex-1 text-slate-300">{activePage.url}</span>
            <RefreshCw className="w-3 h-3 text-slate-500 hover:text-slate-200 cursor-pointer" />
          </div>

          {/* Extension Action Button in Browser Bar */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              title="JobLens Side Panel"
              className="px-2 py-1 rounded bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-400 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px]">JobLens</span>
              <span className={`w-1.5 h-1.5 rounded-full ${activePage.isRecruitmentPage ? (activePage.id.includes("verified") ? "bg-emerald-400" : "bg-red-500") : "bg-slate-500"}`} />
            </button>
          </div>
        </div>

        {/* Browser Viewport Area (Main Content + Docked Side Panel) */}
        <div className="flex flex-col lg:flex-row min-h-[540px] bg-slate-950 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* LEFT: SIMULATED WEBPAGE CONTENT */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto max-h-[640px] space-y-4">
            {/* Main Job / Page View */}
            {activePage.isRecruitmentPage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {activePage.platform}
                    </span>
                    <span className="text-xs text-slate-400">{activePage.companyName}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">{activePage.jobTitle}</h1>
                  <p className="text-xs text-sky-400 font-medium">{activePage.companyName} • Remote</p>
                  {activePage.recruiterEmail && (
                    <p className="text-xs text-slate-400 font-mono pt-0.5">
                      Contact: <span className="text-slate-300">{activePage.recruiterEmail}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Button size="sm" className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium">
                    Apply on Website
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-slate-800 text-slate-300">
                    Save
                  </Button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Job Description:</h4>
                  <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap selection:bg-sky-500/30 selection:text-white">
                    {activePage.jobDescription}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {activePage.platform}
                  </span>
                  <h1 className="text-lg font-bold text-slate-100 pt-1">AI Security Breakthroughs in Modern Browsers</h1>
                  <p className="text-xs text-slate-400">Published August 2026</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>{activePage.jobDescription}</p>
                  <p>
                    Recruitment fraud remains a significant threat vector, with adversaries deploying synthetic identities, advance fee equipment scams, and data harvesting bots across professional job boards.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: DOCKED CHROME EXTENSION SIDE PANEL */}
          {isSidePanelOpen && (
            <div className="w-full lg:w-[380px] shrink-0 min-h-[540px] bg-slate-950">
              <ExtensionSidepanelView
                activePage={activePage}
                onOpenFullReport={onOpenFullReport}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
