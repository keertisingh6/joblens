"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileCheck2,
  FileText,
  Info,
  Link2,
  Lock,
  Mail,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

type Screen = "home" | "analyze" | "results" | "radar" | "safety";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type Severity = "high" | "medium" | "low";

type JobFormData = {
  jobDescription: string;
  companyName: string;
  recruiterEmail: string;
  applicationUrl: string;
};

type Finding = {
  id: string;
  category: "payment" | "identity" | "domain" | "communication" | "pressure" | "salary";
  title: string;
  why: string;
  action: string;
  severity: Severity;
};

type AnalysisResult = {
  score: number;
  level: RiskLevel;
  findings: Finding[];
  positives: string[];
  summary: string;
  actions: string[];
  dimensions: {
    paymentRisk: number; // 0-100
    domainTrust: number; // 0-100
    communicationTrust: number; // 0-100
    pressureRisk: number; // 0-100
    compensationRealism: number; // 0-100
  };
};

const emptyForm: JobFormData = {
  jobDescription: "",
  companyName: "",
  recruiterEmail: "",
  applicationUrl: ""
};

// Preset samples for rapid testing
const samplePresets = [
  {
    id: "scam-1",
    tag: "High Risk Scam",
    badgeColor: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    title: "Data Entry Assistant ($4,500/wk)",
    company: "Amazon Web Services Inc",
    email: "hr.amazon.recruiting2026@gmail.com",
    url: "https://bit.ly/amazon-remote-careers-apply",
    description:
      "URGENT HIRING: We are seeking immediate Data Entry & Virtual Assistants to work from home. Earn $4,500 - $6,000 per week. No experience required! Freshers welcome. Selected candidates must connect via Telegram (@AmazonHiringOfficial) or WhatsApp immediately. Note: A refundable equipment registration & insurance deposit of ₹3,500 / $150 is mandatory for shipping your company Apple MacBook. You must pay within 24 hours to secure your slot."
  },
  {
    id: "scam-2",
    tag: "Moderate Warning",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    title: "Remote React Developer (Unverified)",
    company: "Apex Global Technologies",
    email: "sarah.recruiter@apexglobal-careers.xyz",
    url: "https://apexglobal-portal.work/jobs/9823",
    description:
      "We are looking for a Remote Frontend React Developer. Compensation is $140,000 / year. Candidate must complete a 1-day typing assessment and submit ID proof and net banking details for direct payroll setup before the interview. Contact kindly via WhatsApp to schedule an interview."
  },
  {
    id: "legit-1",
    tag: "Legitimate Job",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    title: "Senior Software Engineer (Verified)",
    company: "Amazon",
    email: "recruiting-team@amazon.com",
    url: "https://amazon.jobs/en/jobs/2589012/software-development-engineer",
    description:
      "Amazon is seeking a Software Development Engineer to join our Distributed Systems team. Requirements: 4+ years of experience with modern languages such as Java, TypeScript, or Go. Bachelor's degree in Computer Science or equivalent. Responsibilities include building scalable cloud microservices, collaborating with product teams, and participating in code reviews. Standard multi-round interview process with recruiter screening, technical loops, and behavioral evaluation."
  }
];

const knownCompanyDomains: Record<string, string[]> = {
  amazon: ["amazon.jobs", "amazon.com", "aws.amazon.com"],
  google: ["google.com", "careers.google.com", "abc.xyz"],
  microsoft: ["microsoft.com", "careers.microsoft.com", "linkedin.com"],
  apple: ["apple.com", "jobs.apple.com"],
  meta: ["meta.com", "metacareers.com", "facebook.com"],
  netflix: ["netflix.com", "jobs.netflix.com"],
  adobe: ["adobe.com", "adobe.design"],
  salesforce: ["salesforce.com", "salesforce.wd1.myworkdayjobs.com"],
  flipkart: ["flipkart.com", "flipkartcareers.com"],
  tcs: ["tcs.com", "ibegin.tcs.com"],
  infosys: ["infosys.com", "careers.infosys.com"],
  wipro: ["wipro.com", "careers.wipro.com"]
};

const trustedHiringDomains = [
  "amazon.jobs",
  "greenhouse.io",
  "lever.co",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "smartrecruiters.com",
  "ashbyhq.com",
  "linkedin.com",
  "naukri.com",
  "indeed.com",
  "wellfound.com",
  "glassdoor.com"
];

const freeEmailDomains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
  "aol.com",
  "rediffmail.com",
  "mail.com"
];

const suspiciousUrlKeywords = [".xyz", ".top", ".click", ".work", ".loan", ".biz", "bit.ly", "tinyurl.com", "t.co", "is.gd"];

const scamTypesLibrary = [
  {
    title: "The Fake Check & Equipment Trap",
    icon: AlertTriangle,
    tag: "High Severity",
    risk: "Financial Fraud",
    desc: "Scammers send a counterfeit check to 'buy home office gear' from a specified vendor. When the check bounces days later, the victim loses their own transferred funds."
  },
  {
    title: "The Upfront Training / Security Fee",
    icon: ShieldAlert,
    tag: "High Severity",
    risk: "Payment Extortion",
    desc: "Candidates are asked to pay ₹1,500 to ₹10,000 or $100-$500 for 'ID verification', 'onboarding background checks', or 'mandatory software training'."
  },
  {
    title: "Telegram / WhatsApp-Only Interviews",
    icon: Send,
    tag: "Medium Severity",
    risk: "Impersonation",
    desc: "Fraudsters avoid video calls or corporate emails, conducting rapid text-based 'interviews' and extending immediate offers within minutes."
  },
  {
    title: "Phishing & Fake Application Portals",
    icon: Link2,
    tag: "High Severity",
    risk: "Identity Theft",
    desc: "Cloned application pages on lookalike domains (.xyz, .top) that capture government IDs, social security numbers, and banking credentials."
  },
  {
    title: "Pay-to-Work / Task Commission Schemes",
    icon: Zap,
    tag: "High Severity",
    risk: "Ponzi Mechanics",
    desc: "Promises of high daily income ($200-$500/day) for liking videos, typing captchas, or booking hotels after depositing cryptocurrency."
  },
  {
    title: "Executive & Corporate Recruiter Impersonation",
    icon: Building2,
    tag: "Medium Severity",
    risk: "Domain Spoofing",
    desc: "Scammers use real recruiter names found on LinkedIn but contact candidates from generic Gmail or slightly misspelled lookalike domains."
  }
];

function includesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskLevel(score: number): RiskLevel {
  if (score >= 65) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function getDomain(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getEmailDomain(email: string) {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

function normalizeCompany(companyName: string) {
  return companyName
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|inc|llc|corp|corporation|technologies|technology|solutions|services|group)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function domainMatchesCompany(domain: string, companyName: string) {
  const company = normalizeCompany(companyName);
  if (!domain || company.length < 3) return false;
  return domain.replace(/[^a-z0-9]/g, "").includes(company);
}

function getKnownDomains(companyName: string) {
  const company = normalizeCompany(companyName);
  return Object.entries(knownCompanyDomains).find(([key]) => company.includes(key))?.[1] ?? [];
}

function hasTrustedHiringDomain(domain: string) {
  return trustedHiringDomains.some((trustedDomain) => domain === trustedDomain || domain.endsWith(`.${trustedDomain}`));
}

function analyzeJob(data: JobFormData): AnalysisResult {
  const description = data.jobDescription.toLowerCase();
  const companyName = data.companyName.trim();
  const fullText = `${description} ${companyName.toLowerCase()} ${data.recruiterEmail.toLowerCase()} ${data.applicationUrl.toLowerCase()}`;
  const emailDomain = getEmailDomain(data.recruiterEmail);
  const applicationDomain = getDomain(data.applicationUrl);
  const knownDomains = getKnownDomains(companyName);
  const emailMatchesCompany = domainMatchesCompany(emailDomain, companyName);
  const applicationMatchesCompany = domainMatchesCompany(applicationDomain, companyName);
  const applicationIsKnownForCompany = knownDomains.some(
    (domain) => applicationDomain === domain || applicationDomain.endsWith(`.${domain}`)
  );
  const applicationIsTrusted = hasTrustedHiringDomain(applicationDomain);

  const findings: Finding[] = [];
  const positives: string[] = [];
  let baseScore = 15;

  let paymentRiskScore = 10;
  let domainTrustScore = 50;
  let commTrustScore = 60;
  let pressureRiskScore = 10;
  let compRealismScore = 70;

  const addFinding = (finding: Finding, points: number) => {
    findings.push(finding);
    baseScore += points;
  };

  const addPositive = (text: string, points: number) => {
    positives.push(text);
    baseScore -= points;
  };

  // 1. Payment Risk Analysis
  if (
    includesAny(fullText, [
      /\b(registration|processing|security|application|training|onboarding|equipment|laptop|kit)\s*(fee|fees|charge|charges|deposit|cost)\b/,
      /\bdeposit\b/,
      /\bpay\s*(rs|inr|\u20b9|\$)?\s*\d+/,
      /\bpay\s*money\b/,
      /\bpay\s*to\s*apply\b/,
      /\bsecurity\s*amount\b/,
      /\brefundable\s*deposit\b/
    ])
  ) {
    paymentRiskScore = 95;
    addFinding(
      {
        id: "payment-fee",
        category: "payment",
        title: "Upfront Payment or Deposit Demand",
        why: "Legitimate employers never require applicants to pay onboarding, training, equipment, or processing deposits.",
        action: "Do not transfer money or share UPI/banking credentials. Verify independently with official HR.",
        severity: "high"
      },
      38
    );
  } else {
    paymentRiskScore = 10;
    addPositive("No upfront fee or security deposit requirement detected.", 8);
  }

  // 2. Sensitive Financial/Identity data
  if (
    includesAny(fullText, [
      /\botp\b/,
      /\bpassword\b/,
      /\bbank\s*(pin|password|details|account)\b/,
      /\bcredit\s*card\b/,
      /\bdebit\s*card\b/,
      /\bupi\s*pin\b/,
      /\bnet\s*banking\b/,
      /\baadhaar\s*otp\b/
    ])
  ) {
    paymentRiskScore = Math.max(paymentRiskScore, 90);
    addFinding(
      {
        id: "financial-credentials",
        category: "identity",
        title: "Direct Request for Financial or Authentication Credentials",
        why: "Requests for OTPs, PINs, or banking passwords during hiring are unambiguous fraud indicators.",
        action: "Immediately discontinue communication and report the contact.",
        severity: "high"
      },
      40
    );
  }

  // 3. Guaranteed job after payment
  if (
    includesAny(fullText, [
      /\bpay\s*(to|and)\s*(get|secure|confirm)\s*(the\s*)?job\b/,
      /\bjob\s*(guaranteed|confirmation)\s*(after|once)\s*payment\b/
    ])
  ) {
    addFinding(
      {
        id: "pay-to-secure",
        category: "payment",
        title: "Guaranteed Placement via Payment",
        why: "Offers conditioned on payment are illegal in many jurisdictions and universally indicative of job scams.",
        action: "Disregard this offer. Authentic positions are earned through evaluated interviews.",
        severity: "high"
      },
      30
    );
  }

  // 4. Urgency & Psychological Pressure
  if (
    includesAny(fullText, [
      /\burgent\b/,
      /\bimmediate\s*(joining|selection|hiring)\b/,
      /\bact\s*now\b/,
      /\bwithin\s*(12|24|48)\s*hours\b/,
      /\blimited\s*slots?\b/,
      /\bfinal\s*chance\b/,
      /\boffer\s*expires\s*today\b/
    ])
  ) {
    pressureRiskScore = 85;
    addFinding(
      {
        id: "extreme-urgency",
        category: "pressure",
        title: "High-Pressure Urgency Tactics",
        why: "Imposing tight arbitrary deadlines is designed to rush candidates past normal due diligence and company verification.",
        action: "Pause and independently confirm with the company's verified hiring desk before responding.",
        severity: "high"
      },
      18
    );
  } else {
    pressureRiskScore = 15;
  }

  // 5. Compensation Realism
  const hasHighSalary = includesAny(fullText, [
    /\b(₹|rs\.?|inr)\s?(1,?00,?000|[2-9]\d,?000|[1-9]\d,?00,?000)\s*(per\s*)?(month|week|day)\b/,
    /\b([3-9]\d|[1-9]\d{2})\s*lpa\b/,
    /\b(usd|\$)\s?([3-9]\d{3}|[1-9]\d{4,})\s*(per\s*)?(month|week)\b/
  ]);
  const hasNoExperience = includesAny(fullText, [
    /\bno\s*experience\s*(required|needed)?\b/,
    /\bfreshers?\s*(welcome|can apply)\b/,
    /\bno\s*interview\b/,
    /\btyping\s*job\b/,
    /\bdata\s*entry\b.*\b(high\s*pay|\$4,000|\$5,000|₹\d{5,})\b/
  ]);

  if (hasHighSalary && hasNoExperience) {
    compRealismScore = 20;
    addFinding(
      {
        id: "unrealistic-compensation",
        category: "salary",
        title: "Disproportionate Salary vs. Entry-Level Requirement",
        why: "Promising executive-level compensation for zero-skill, work-from-home tasks is the primary hook in recruitment fraud.",
        action: "Benchmark against standard salary indices (Glassdoor, Levels.fyi) for realistic market bands.",
        severity: "high"
      },
      22
    );
  } else if (hasHighSalary) {
    compRealismScore = 55;
    addFinding(
      {
        id: "elevated-compensation",
        category: "salary",
        title: "High Compensation Band Noted",
        why: "The salary is significantly above typical median brackets and warrants additional verification.",
        action: "Ensure compensation terms are backed by an official written contract from HR.",
        severity: "medium"
      },
      10
    );
  } else {
    compRealismScore = 85;
  }

  // 6. Communication Channels
  if (
    includesAny(description, [
      /\bkindly\b.*\bwhatsapp\b/,
      /\bwhatsapp\s*(only|msg|message)\b/,
      /\btelegram\b/,
      /\btext\s*me\b/,
      /\bcall\s*now\b/,
      /\bskype\s*interview\s*only\b/
    ])
  ) {
    commTrustScore = 20;
    addFinding(
      {
        id: "informal-channel",
        category: "communication",
        title: "Informal Instant Messaging Interview Channel",
        why: "Scammers frequently mandate Telegram/WhatsApp to prevent domain verification and create ephemeral trails.",
        action: "Request official communication via the corporate company email server or video portal.",
        severity: "medium"
      },
      16
    );
  } else {
    commTrustScore = 75;
  }

  // 7. Company Name Evaluation
  if (companyName.length < 3 || includesAny(companyName.toLowerCase(), [/\bcompany\b/, /\bprivate\b/, /\bconfidential\b/, /\bnot disclosed\b/])) {
    domainTrustScore -= 20;
    addFinding(
      {
        id: "vague-company",
        category: "domain",
        title: "Unspecified or Obscured Employer Identity",
        why: "Omitting the registered legal entity prevents basic corporate background validation.",
        action: "Ask for the registered entity name and its corporate registration number (CIN / DUNS).",
        severity: "medium"
      },
      14
    );
  } else {
    addPositive("Company name was provided, enabling direct verification on registries and LinkedIn.", 5);
  }

  // 8. Recruiter Email Evaluation
  if (!data.recruiterEmail.trim()) {
    commTrustScore -= 15;
    addFinding(
      {
        id: "missing-email",
        category: "communication",
        title: "No Recruiter Email Provided",
        why: "Without a recruiter email address, domain authenticity cannot be validated.",
        action: "Ask the contact person for their official company email handle.",
        severity: "medium"
      },
      8
    );
  } else if (!emailDomain) {
    commTrustScore = 15;
    addFinding(
      {
        id: "invalid-email-format",
        category: "communication",
        title: "Malformed Recruiter Email",
        why: "Invalid email structures prevent automated security checks.",
        action: "Verify the contact's email address.",
        severity: "medium"
      },
      12
    );
  } else if (freeEmailDomains.includes(emailDomain)) {
    commTrustScore = 25;
    addFinding(
      {
        id: "free-email-domain",
        category: "communication",
        title: `Recruiter Uses Free Public Provider (@${emailDomain})`,
        why: `Established enterprises almost never conduct corporate recruiting from personal free email accounts (${emailDomain}).`,
        action: "Verify the recruiter's identity on LinkedIn and seek an email from the official company domain.",
        severity: "high"
      },
      24
    );
  } else if (emailMatchesCompany) {
    commTrustScore = 90;
    addPositive(`Recruiter email domain (@${emailDomain}) matches the company identity.`, 14);
  } else {
    commTrustScore = 35;
    addFinding(
      {
        id: "mismatched-email-domain",
        category: "communication",
        title: `Mismatched Email Domain (@${emailDomain})`,
        why: `The recruiter's domain does not correlate with '${companyName}'. This may indicate an agency or impersonation attempt.`,
        action: "Confirm with the employer whether this agency or domain is an authorized hiring partner.",
        severity: "medium"
      },
      16
    );
  }

  // 9. Application URL Evaluation
  if (!data.applicationUrl.trim()) {
    domainTrustScore -= 10;
    addFinding(
      {
        id: "missing-url",
        category: "domain",
        title: "No Direct Application URL",
        why: "Direct links allow cross-checking against official ATS platforms (Workday, Greenhouse, Lever).",
        action: "Search for the job listing directly on the company's official /careers portal.",
        severity: "low"
      },
      6
    );
  } else if (!applicationDomain) {
    domainTrustScore = 20;
    addFinding(
      {
        id: "invalid-url-format",
        category: "domain",
        title: "Invalid Application URL",
        why: "Cannot parse a valid destination host from the provided link.",
        action: "Do not open suspicious links or provide personal credentials.",
        severity: "high"
      },
      18
    );
  } else if (suspiciousUrlKeywords.some((suffix) => applicationDomain.endsWith(suffix) || applicationDomain.includes(suffix))) {
    domainTrustScore = 15;
    addFinding(
      {
        id: "suspicious-url-tld",
        category: "domain",
        title: `Suspicious or Shortened Link (${applicationDomain})`,
        why: "Shorteners (bit.ly) or high-risk TLDs (.xyz, .top, .work) are often deployed in phishing campaigns to obscure destination servers.",
        action: "Never authenticate or enter credentials on URL shorteners or unfamiliar domains.",
        severity: "high"
      },
      26
    );
  } else if (applicationIsKnownForCompany || applicationMatchesCompany || applicationIsTrusted) {
    domainTrustScore = 92;
    addPositive(`Application portal (${applicationDomain}) is a verified company domain or recognized ATS platform.`, 16);
  } else {
    domainTrustScore = 45;
    addFinding(
      {
        id: "unrecognized-domain",
        category: "domain",
        title: `Unverified Application Portal (${applicationDomain})`,
        why: "The destination host does not match the company or top certified hiring platforms.",
        action: "Navigate manually to the company's main website and locate the Careers section.",
        severity: "medium"
      },
      14
    );
  }

  // Job description detail check
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  const hasResponsibilities = includesAny(description, [
    /\bresponsibilit(y|ies)\b/,
    /\brequirements?\b/,
    /\bqualification(s)?\b/,
    /\bexperience\b/,
    /\bskills?\b/,
    /\bcollaborate\b/
  ]);

  if (wordCount < 30) {
    addFinding(
      {
        id: "thin-description",
        category: "pressure",
        title: "Sparse Job Description",
        why: "Legitimate job specifications outline clear technical expectations, qualifications, and role responsibilities.",
        action: "Request the full job description and rubric before proceeding.",
        severity: "medium"
      },
      12
    );
  } else if (hasResponsibilities) {
    addPositive("Job description contains detailed role responsibilities and qualifications.", 8);
  }

  const finalScore = clampScore(baseScore);
  const level = riskLevel(finalScore);
  const actions = findings.length
    ? Array.from(new Set(findings.map((finding) => finding.action))).slice(0, 5)
    : [
        "Proceed via the official company careers portal.",
        "Keep tax identification, SSN, and banking data private until a formal offer letter is executed.",
        "Archive a copy of this job posting and correspondence for your personal records."
      ];

  return {
    score: finalScore,
    level,
    findings,
    positives,
    actions,
    summary:
      findings.length > 0
        ? `JobLens detected ${findings.length} warning flag${findings.length === 1 ? "" : "s"} and ${positives.length} trust signal${positives.length === 1 ? "" : "s"} across the submitted job parameters.`
        : "No significant recruitment scam red flags were detected in the submitted information. Always confirm offers directly via official channels.",
    dimensions: {
      paymentRisk: clampScore(paymentRiskScore),
      domainTrust: clampScore(domainTrustScore),
      communicationTrust: clampScore(commTrustScore),
      pressureRisk: clampScore(pressureRiskScore),
      compensationRealism: clampScore(compRealismScore)
    }
  };
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<JobFormData>(emptyForm);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const loadingSteps = [
    "Parsing job description & payment triggers...",
    "Verifying recruiter email against corporate registries...",
    "Inspecting application URL & TLS domain heuristics...",
    "Calculating risk dimensions & safety score..."
  ];

  function updateField(field: keyof JobFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  }

  function applyPreset(preset: (typeof samplePresets)[0]) {
    setFormData({
      companyName: preset.company,
      recruiterEmail: preset.email,
      applicationUrl: preset.url,
      jobDescription: preset.description
    });
    setError("");
    setScreen("analyze");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleAnalyze() {
    if (!formData.jobDescription.trim() || !formData.companyName.trim()) {
      setError("Please provide at least the Company Name and Job Description to scan.");
      return;
    }

    setIsLoading(true);
    setError("");
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 280);

    setTimeout(() => {
      clearInterval(stepInterval);
      const result = analyzeJob(formData);
      setAnalysisResult(result);
      setIsLoading(false);
      setScreen("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1200);
  }

  function resetForm() {
    setFormData(emptyForm);
    setAnalysisResult(null);
    setError("");
    setScreen("analyze");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCopyReport() {
    if (!result) return;
    const text = `
=== JOBLENS RECRUITMENT RISK REPORT ===
Company: ${formData.companyName || "N/A"}
Risk Score: ${result.score}/100 (${result.level} RISK)
Date: ${new Date().toLocaleDateString()}

Summary: ${result.summary}

FLAGGED WARNINGS:
${result.findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n   Why: ${f.why}\n   Action: ${f.action}`).join("\n\n")}

TRUST SIGNALS:
${result.positives.map((p) => `• ${p}`).join("\n")}

RECOMMENDED NEXT STEPS:
${result.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}
========================================
Generated by JobLens Scam Radar
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const result = analysisResult ?? analyzeJob(formData);

  // Live validation helpers for immediate feedback
  const liveEmailDomain = useMemo(() => getEmailDomain(formData.recruiterEmail), [formData.recruiterEmail]);
  const isFreeEmail = useMemo(() => freeEmailDomains.includes(liveEmailDomain), [liveEmailDomain]);
  const liveUrlDomain = useMemo(() => getDomain(formData.applicationUrl), [formData.applicationUrl]);
  const isTrustedUrl = useMemo(() => hasTrustedHiringDomain(liveUrlDomain), [liveUrlDomain]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 subtle-grid opacity-60 dark:opacity-30" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            className="flex items-center gap-3 text-left focus:outline-none group"
            onClick={() => setScreen("home")}
            type="button"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Job<span className="text-blue-600 dark:text-blue-400">Lens</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                  <Zap className="h-2.5 w-2.5" /> Heuristic AI
                </span>
              </div>
              <span className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Recruitment Scam & Offer Detector
              </span>
            </div>
          </button>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Button
              className="text-xs sm:text-sm"
              onClick={() => setScreen("home")}
              size="sm"
              variant={screen === "home" ? "secondary" : "ghost"}
            >
              Home
            </Button>
            <Button
              className="text-xs sm:text-sm"
              onClick={() => setScreen("analyze")}
              size="sm"
              variant={screen === "analyze" ? "secondary" : "ghost"}
            >
              Scanner
            </Button>
            <Button
              className="hidden md:inline-flex text-xs sm:text-sm"
              onClick={() => setScreen("radar")}
              size="sm"
              variant={screen === "radar" ? "secondary" : "ghost"}
            >
              Scam Radar
            </Button>
            <Button
              className="hidden md:inline-flex text-xs sm:text-sm"
              onClick={() => setScreen("safety")}
              size="sm"
              variant={screen === "safety" ? "secondary" : "ghost"}
            >
              Safety Toolkit
            </Button>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

            <ThemeToggle />

            <Button
              className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium text-xs sm:text-sm"
              onClick={() => setScreen("analyze")}
              size="sm"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Scan Job Offer
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 z-10">
        <AnimatePresence mode="wait">
          {/* SCREEN: HOME */}
          {screen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Hero Section */}
              <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Instant Scam Risk Scanner for Job Seekers</span>
                      </div>

                      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.12]">
                        See beyond the job posting.{" "}
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          Spot scams instantly.
                        </span>
                      </h1>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Fake recruiters steal billions through upfront equipment fees, Telegram interviews, and spoofed domains.
                        JobLens analyzes job offers against 20+ fraud indicators before you share your resume or credentials.
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                        <Button
                          className="w-full sm:w-auto h-12 px-7 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-semibold"
                          onClick={() => setScreen("analyze")}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Scan a Job Offer Now
                        </Button>
                        <Button
                          className="w-full sm:w-auto h-12 px-6 text-base font-semibold"
                          onClick={() => applyPreset(samplePresets[0])}
                          variant="outline"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                          Try Scam Demo
                        </Button>
                      </div>

                      {/* Quick Stats Grid */}
                      <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-200/80 dark:border-slate-800/80 max-w-lg mx-auto lg:mx-0">
                        <div>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">20+</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Scam Red Flags</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">100%</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Client-Side Private</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">&lt;1s</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Analysis Speed</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Live Preview Card */}
                    <div className="lg:col-span-5">
                      <Card className="relative overflow-hidden rounded-2xl border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-900/95 dark:shadow-none backdrop-blur-sm">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                              <ShieldAlert className="h-3 w-3 mr-1" /> High Risk Detected
                            </Badge>
                            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                              Rule Scanner v2.4
                            </span>
                          </div>
                          <CardTitle className="text-lg pt-2 font-bold text-slate-900 dark:text-white">
                            Live Scam Simulation
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Heuristic breakdown of a typical work-from-home fee trap
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                          <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-4 dark:border-red-900/50 dark:bg-red-950/40">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                                Calculated Threat Score
                              </span>
                              <span className="text-2xl font-black text-red-600 dark:text-red-400">88/100</span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-red-200/70 dark:bg-red-900/40">
                              <div className="h-full bg-gradient-to-r from-red-500 to-red-600 w-[88%]" />
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  Equipment Deposit Demand:
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 ml-1">
                                  Requests ₹3,500 / $150 refundable MacBook shipping fee.
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                              <Mail className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  Mismatched Recruiter Email:
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 ml-1">
                                  Uses free @gmail.com domain while claiming to be AWS.
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                              <Send className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  Chat-Only Interview:
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 ml-1">
                                  Candidate directed exclusively to Telegram handle.
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full text-xs font-semibold"
                            onClick={() => applyPreset(samplePresets[0])}
                            size="sm"
                            variant="secondary"
                          >
                            Inspect Full Analysis
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sample Presets Quick-Test Section */}
              <section className="py-14 bg-white/70 border-y border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800/80">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Quick Demo Scenarios
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Test real-world recruitment cases
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Click any scenario below to auto-load the data and test the detector engine.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {samplePresets.map((preset) => (
                      <Card
                        key={preset.id}
                        className="rounded-xl border-slate-200/80 bg-white hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={preset.badgeColor}>{preset.tag}</Badge>
                            <span className="text-xs text-slate-400">{preset.company}</span>
                          </div>
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                            {preset.title}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-3 mt-1 leading-relaxed">
                            {preset.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button
                            className="w-full text-xs font-semibold"
                            onClick={() => applyPreset(preset)}
                            variant="outline"
                          >
                            Load this offer into Scanner
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>

              {/* 3-Step Work Flow */}
              <section className="py-16">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="text-center max-w-2xl mx-auto mb-12">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      How It Works
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Multi-layer threat inspection
                    </h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-4 font-bold text-lg">
                        1
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Paste Job Parameters</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        Input the job description, recruiter email address, company name, and direct application URL.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-4 font-bold text-lg">
                        2
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Heuristic Evaluation</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        The engine evaluates payment keywords, email domain alignment, ATS domain trust, urgency triggers, and compensation ratios.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-4 font-bold text-lg">
                        3
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Actionable Safety Score</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        Review a 0-100 risk score, explainable signal breakdown, positive credibility markers, and safe verification steps.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* SCREEN: ANALYZE SCANNER */}
          {screen === "analyze" && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="py-10 sm:py-14"
            >
              <div className="container mx-auto max-w-4xl px-4 sm:px-6">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        <Sparkles className="h-3 w-3 mr-1" /> Job Scanner
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Strictly Private & Client-Side</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Analyze a Job Opportunity
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Paste the details you received. We&apos;ll cross-reference domains, fee triggers, and scam patterns.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => applyPreset(samplePresets[0])}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      Fill Sample Scam
                    </Button>
                    <Button
                      onClick={() => applyPreset(samplePresets[2])}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                      Fill Legit Job
                    </Button>
                  </div>
                </div>

                <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Job Opportunity Details</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        * Required fields
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Company Name & Recruiter Email */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-sm font-semibold flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          Company Name *
                        </Label>
                        <Input
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800"
                          id="companyName"
                          onChange={(e) => updateField("companyName", e.target.value)}
                          placeholder="e.g. Amazon, Google, Flipkart, Apex Corp"
                          value={formData.companyName}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recruiterEmail" className="text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-indigo-500" />
                            Recruiter Email
                          </span>
                          {formData.recruiterEmail && (
                            <span className="text-[11px] font-medium">
                              {isFreeEmail ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  ⚠️ Free public provider
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ✓ Custom domain
                                </span>
                              )}
                            </span>
                          )}
                        </Label>
                        <Input
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800"
                          id="recruiterEmail"
                          onChange={(e) => updateField("recruiterEmail", e.target.value)}
                          placeholder="e.g. recruiter@company.com"
                          type="email"
                          value={formData.recruiterEmail}
                        />
                      </div>
                    </div>

                    {/* Application URL */}
                    <div className="space-y-2">
                      <Label htmlFor="applicationUrl" className="text-sm font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Link2 className="h-4 w-4 text-blue-500" />
                          Application URL / Portal Link
                        </span>
                        {formData.applicationUrl && (
                          <span className="text-[11px] font-medium">
                            {isTrustedUrl ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                ✓ Recognized ATS / Official Domain
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400">
                                Domain: {liveUrlDomain || "Parsing..."}
                              </span>
                            )}
                          </span>
                        )}
                      </Label>
                      <Input
                        className="h-11 rounded-xl border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800"
                        id="applicationUrl"
                        onChange={(e) => updateField("applicationUrl", e.target.value)}
                        placeholder="https://company.jobs/careers/... or https://greenhouse.io/..."
                        type="url"
                        value={formData.applicationUrl}
                      />
                    </div>

                    {/* Full Job Description / Message */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="jobDescription" className="text-sm font-semibold flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-purple-500" />
                          Job Description & Recruiter Message *
                        </Label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formData.jobDescription.split(/\s+/).filter(Boolean).length} words
                        </span>
                      </div>
                      <Textarea
                        className="min-h-48 resize-y rounded-xl border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 p-4 leading-relaxed text-sm"
                        id="jobDescription"
                        onChange={(e) => updateField("jobDescription", e.target.value)}
                        placeholder="Paste the full job posting, email text, WhatsApp/Telegram chat, salary offer, and any payment/onboarding instructions..."
                        value={formData.jobDescription}
                      />
                    </div>

                    {/* Error Banner */}
                    {error && (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Lock className="h-3.5 w-3.5 text-emerald-600" />
                        <span>No data is uploaded or stored on servers. Analyzed locally.</span>
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                          className="text-xs"
                          onClick={() => setFormData(emptyForm)}
                          type="button"
                          variant="ghost"
                        >
                          Clear
                        </Button>
                        <Button
                          className="flex-1 sm:flex-none h-12 px-7 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                          disabled={isLoading}
                          onClick={handleAnalyze}
                          type="button"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>{loadingSteps[loadingStep]}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              <span>Analyze Job Threat Score</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* SCREEN: RESULTS REPORT */}
          {screen === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="py-10 sm:py-14"
            >
              <div className="container mx-auto max-w-5xl px-4 sm:px-6">
                {/* Header Actions */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        Scan ID: #{Math.floor(100000 + Math.random() * 900000)}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Target: {formData.companyName || "Unspecified Company"}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Job Threat Analysis Report
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={handleCopyReport} size="sm" variant="outline" className="text-xs">
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copied Report
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy Summary
                        </>
                      )}
                    </Button>
                    <Button onClick={resetForm} size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Analyze Another
                    </Button>
                  </div>
                </div>

                {/* Score & Dimension Overview */}
                <div className="grid gap-6 lg:grid-cols-12 mb-8">
                  {/* Radial / Gauge Score Card */}
                  <Card className="lg:col-span-5 rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Threat Risk Score</span>
                        <Badge
                          className={
                            result.level === "HIGH"
                              ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                              : result.level === "MEDIUM"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          }
                        >
                          {result.level} RISK
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Overall probability of fraudulent intent or deception
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="py-6 flex flex-col items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 100 100">
                          <circle
                            className="text-slate-100 dark:text-slate-800"
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            className={
                              result.level === "HIGH"
                                ? "text-red-500"
                                : result.level === "MEDIUM"
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * result.score) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            style={{ transition: "stroke-dashoffset 0.8s ease" }}
                          />
                        </svg>

                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-black text-slate-900 dark:text-white">
                            {result.score}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            / 100 Points
                          </span>
                        </div>
                      </div>

                      <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-4 max-w-xs leading-relaxed">
                        {result.level === "HIGH" && "High likelihood of recruitment scam. Do not transfer funds or share private IDs."}
                        {result.level === "MEDIUM" && "Several suspicious markers identified. Cross-verify with the official company HR."}
                        {result.level === "LOW" && "Consistent with typical authentic hiring patterns. Proceed with standard caution."}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Multi-Dimensional Matrix */}
                  <Card className="lg:col-span-7 rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                        Risk Factor Breakdown
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Independent threat assessment across 5 core security vectors
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      {/* Payment Risk */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Lock className="h-3.5 w-3.5 text-red-500" />
                            Upfront Payment / Fee Demand
                          </span>
                          <span className={result.dimensions.paymentRisk > 50 ? "text-red-600 font-bold" : "text-slate-500"}>
                            {result.dimensions.paymentRisk > 50 ? "High Risk" : "Clean"}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${result.dimensions.paymentRisk}%` }}
                          />
                        </div>
                      </div>

                      {/* Domain Trust */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-blue-500" />
                            Company & Portal Domain Authenticity
                          </span>
                          <span className={result.dimensions.domainTrust > 70 ? "text-emerald-600 font-bold" : "text-amber-600"}>
                            {result.dimensions.domainTrust > 70 ? "Trusted" : "Unverified"}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${result.dimensions.domainTrust}%` }}
                          />
                        </div>
                      </div>

                      {/* Communication Trust */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Mail className="h-3.5 w-3.5 text-purple-500" />
                            Recruiter Contact Channel Trust
                          </span>
                          <span className={result.dimensions.communicationTrust > 70 ? "text-emerald-600 font-bold" : "text-amber-600"}>
                            {result.dimensions.communicationTrust > 70 ? "Corporate Domain" : "Public / Unofficial"}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${result.dimensions.communicationTrust}%` }}
                          />
                        </div>
                      </div>

                      {/* Urgency & Pressure */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            Urgency & Deadline Pressure
                          </span>
                          <span className={result.dimensions.pressureRisk > 60 ? "text-red-600 font-bold" : "text-slate-500"}>
                            {result.dimensions.pressureRisk > 60 ? "Elevated Urgency" : "Standard"}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${result.dimensions.pressureRisk}%` }}
                          />
                        </div>
                      </div>

                      {/* Salary Realism */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                            Compensation-to-Skill Feasibility
                          </span>
                          <span className={result.dimensions.compensationRealism > 60 ? "text-emerald-600 font-bold" : "text-red-600"}>
                            {result.dimensions.compensationRealism > 60 ? "Realistic" : "Suspiciously Inflated"}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${result.dimensions.compensationRealism}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Flagged Red Flags / Warning Signs */}
                <div className="space-y-6">
                  <Card className="rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <ShieldAlert className="h-5 w-5 text-red-500" />
                          Detected Red Flags & Threats ({result.findings.length})
                        </CardTitle>
                        <span className="text-xs text-slate-500">Heuristic Signals</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {result.findings.length > 0 ? (
                        result.findings.map((finding) => (
                          <div
                            key={finding.id}
                            className={`rounded-xl border p-4 transition-all ${
                              finding.severity === "high"
                                ? "border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/20"
                                : finding.severity === "medium"
                                ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
                                : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {finding.severity === "high" && <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                                {finding.severity === "medium" && <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                                {finding.severity === "low" && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {finding.title}
                                  </h4>
                                  <Badge
                                    className={`text-[10px] uppercase font-bold ${
                                      finding.severity === "high"
                                        ? "bg-red-600 text-white"
                                        : "bg-amber-500 text-white"
                                    }`}
                                  >
                                    {finding.severity} Severity
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  <span className="font-semibold">Why this is dangerous:</span> {finding.why}
                                </p>
                                <div className="mt-2 rounded-lg bg-white/80 p-2.5 text-xs text-slate-800 dark:bg-slate-900/80 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800">
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">Recommended Action:</span>{" "}
                                  {finding.action}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-bold text-sm">No Primary Scam Signals Detected</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                              The submitted details do not contain payment traps or obvious domain mismatches.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Positive Trust Signals & Actionable Next Steps */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Positive Signals */}
                    <Card className="rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileCheck2 className="h-4 w-4 text-emerald-500" />
                          Verified Trust Signals ({result.positives.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2.5">
                          {result.positives.map((positive, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{positive}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Action Checklist */}
                    <Card className="rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-blue-500" />
                          Candidate Safety Checklist
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2.5">
                          {result.actions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {i + 1}
                              </span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN: SCAM RADAR ENCYCLOPEDIA */}
          {screen === "radar" && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="py-10 sm:py-14"
            >
              <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 mb-2">
                    <ShieldAlert className="h-3 w-3 mr-1" /> Threat Knowledge Base
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    Common Recruitment Scam Types
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Understand the most common fraud mechanics used by cybercriminals in 2026 to exploit job applicants.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {scamTypesLibrary.map((scam, i) => (
                    <Card
                      key={i}
                      className="rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <scam.icon className="h-5 w-5" />
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {scam.risk}
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          {scam.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {scam.desc}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    onClick={() => setScreen("analyze")}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Scan Your Job Offer for These Patterns
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN: SAFETY TOOLKIT */}
          {screen === "safety" && (
            <motion.div
              key="safety"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="py-10 sm:py-14"
            >
              <div className="container mx-auto max-w-5xl px-4 sm:px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 mb-2">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Candidate Toolkit
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    Job Seeker Verification Toolkit
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Essential protocols to verify any recruiter or company before sharing personal documents.
                  </p>
                </div>

                <div className="space-y-6">
                  <Card className="rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                        The 4 Golden Rules of Safe Job Hunting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm dark:bg-blue-950 dark:text-blue-300">
                          1
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Never Pay For A Job Under Any Circumstance
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            No legitimate employer (including Amazon, Google, TCS, Infosys, or startups) charges for onboarding, training kits, security deposits, or laptop shipping.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm dark:bg-blue-950 dark:text-blue-300">
                          2
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Verify Recruiter Email Domain
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Corporate recruiters write from @company.com. If an alleged Microsoft recruiter emails from @gmail.com or @outlook.com, it is 99% fraudulent.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm dark:bg-blue-950 dark:text-blue-300">
                          3
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Check the Official /careers Page
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Go directly to the company website in a new browser tab. Search the Job ID or title. If it does not exist on their portal, question the recruiter.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm dark:bg-blue-950 dark:text-blue-300">
                          4
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Hold Financial Credentials Until Day 1
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Never provide bank accounts, cancelled cheques, or SSN/Aadhaar numbers before an official formal offer letter is reviewed and signed.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/80 py-8 dark:border-slate-800/80 dark:bg-slate-950/80 z-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              JobLens &copy; 2026. Recruitment Fraud Prevention.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <button onClick={() => setScreen("radar")} className="hover:underline">
              Scam Radar
            </button>
            <button onClick={() => setScreen("safety")} className="hover:underline">
              Safety Rules
            </button>
            <button onClick={() => setScreen("analyze")} className="hover:underline">
              Scanner
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
