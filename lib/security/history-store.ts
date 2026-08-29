"use client";

import type { CyberThreatReport } from "./types";

const STORAGE_KEY = "joblens_security_scans_v2";

export const DEMO_PRESET_SCANS: CyberThreatReport[] = [
  {
    id: "demo-high-scam",
    timestamp: "2026-08-28T09:15:00Z",
    jobTitle: "Remote Cloud Operations Associate",
    companyName: "Global Tech Systems",
    recruiterEmail: "hr-globaltech-careers@gmail.com",
    applicationUrl: "http://bit.ly/globaltech-quick-onboard",
    jobDescription: "Congratulations! You have been selected immediately for the Remote Cloud Operations Associate role ($6,500/month). No interview needed. Offer expires within 24 hours. Connect on Telegram (@GlobalTechHR) to process your mandatory laptop equipment fee of ₹4,500 (refundable). Send UPI payment to confirm.",
    overallScore: 92,
    overallSeverity: "CRITICAL",
    categoryScores: {
      socialEngineering: 90,
      financialFraud: 95,
      credentialRisk: 40,
      phishingImpersonation: 88,
      jobCredibility: 85
    },
    signals: [
      {
        id: "fin-equipment-deposit",
        category: "financial_fraud",
        technique: "ADVANCE_FEE_FRAUD",
        severity: "CRITICAL",
        title: "Equipment / Laptop Shipping Deposit Demand",
        why: "Legitimate corporate employers ship enterprise hardware at company expense. Requiring candidates to pay upfront deposits is a hallmark of advance-fee fraud.",
        evidence: "...mandatory laptop equipment fee of ₹4,500 (refundable)...",
        action: "Do not transfer any money. Never pay upfront fees for equipment.",
        potentialImpact: "Direct monetary loss with no hardware or employment delivered."
      },
      {
        id: "soc-high-pressure",
        category: "social_engineering",
        technique: "SOCIAL_ENGINEERING",
        severity: "HIGH",
        title: "Extreme Artificial Urgency & High-Pressure Deadlines",
        why: "Artificial urgency induces cognitive overload, pressuring candidates into bypassing security verification.",
        evidence: "...Offer expires within 24 hours...",
        action: "Pause and independently contact the employer's official HR department.",
        potentialImpact: "Rushed compliance with fraudulent payment instructions."
      },
      {
        id: "soc-ephemeral-chat",
        category: "social_engineering",
        technique: "SOCIAL_ENGINEERING",
        severity: "HIGH",
        title: "Enforced Migration to Ephemeral Messaging Channels",
        why: "Threat actors force communications to unmonitored messaging platforms to evade audit trails.",
        evidence: "...Connect on Telegram (@GlobalTechHR)...",
        action: "Insist on verified corporate email threads.",
        potentialImpact: "Untraceable interactions with zero corporate accountability."
      },
      {
        id: "email-public-provider",
        category: "phishing_impersonation",
        technique: "IMPERSONATION",
        severity: "MEDIUM",
        title: "Recruiter Using Public Provider (@gmail.com)",
        why: "Established enterprise recruiters typically communicate via corporate email infrastructure rather than personal free accounts.",
        evidence: "hr-globaltech-careers@gmail.com",
        action: "Verify the recruiter's official identity on official company channels.",
        potentialImpact: "Potential unauthenticated impersonator operating outside corporate oversight."
      },
      {
        id: "url-shortener-warning",
        category: "phishing_impersonation",
        technique: "MALICIOUS_LINK",
        severity: "HIGH",
        title: "Obfuscated URL Shortener Link",
        why: "Destination URL uses obfuscation to hide the destination hosting server.",
        evidence: "http://bit.ly/globaltech-quick-onboard",
        action: "Do not follow shortened links.",
        potentialImpact: "Redirection to unauthorized phishing portals."
      }
    ],
    positives: [],
    actions: [
      "Do not transfer any money for equipment deposits.",
      "Refuse communication on private Telegram handles.",
      "Report the posting to cyber crime authorities or the hosting platform."
    ],
    emailAnalysis: {
      email: "hr-globaltech-careers@gmail.com",
      domain: "gmail.com",
      domainType: "PUBLIC",
      companyMatch: "POSSIBLE_MISMATCH",
      risk: "MEDIUM",
      details: ["Recruiter is communicating from a free public provider (@gmail.com) rather than corporate domain."],
      isLookalike: false
    },
    urlAnalysis: {
      rawUrl: "http://bit.ly/globaltech-quick-onboard",
      domain: "bit.ly",
      protocol: "HTTP",
      isShortener: true,
      isIpAddress: false,
      isPunycode: false,
      isSuspiciousTld: false,
      isRecognizedAts: false,
      brandMatch: "UNRECOGNIZED",
      risk: "HIGH",
      indicators: ["URL shortener detected.", "Unencrypted HTTP protocol."],
      explanation: "Destination link obscures destination and lacks TLS encryption."
    },
    companyTrust: {
      companyName: "Global Tech Systems",
      companyProvided: true,
      corporateDomain: false,
      recognizedPlatform: false,
      detailedJobSpecs: false,
      contactAvailable: true,
      trustLevel: "LOW",
      trustNotes: ["Free webmail and shortener links utilized."],
      externalVerificationStatus: "LOCAL_HEURISTICS_ONLY"
    },
    educationalTakeaway: {
      concept: "Advance-Fee Fraud Defense",
      title: "Legitimate Employers Never Charge Applicants",
      explanation: "No legitimate corporation requires candidates to pay onboarding, equipment, or processing deposits.",
      practicalAdvice: "If a recruiter demands money for 'laptop shipping' or 'registration', terminate contact immediately."
    },
    summary: "JobLens security engine extracted 5 threat signals across 4 attack vector categories, calculating a Threat Score of 92/100 (CRITICAL RISK)."
  },
  {
    id: "demo-legit-enterprise",
    timestamp: "2026-08-28T08:30:00Z",
    jobTitle: "Senior Frontend Engineer (React / TypeScript)",
    companyName: "Amazon",
    recruiterEmail: "talent-acquisition@amazon.com",
    applicationUrl: "https://amazon.jobs/en/jobs/2849102",
    jobDescription: "Amazon is looking for a Senior Frontend Engineer to build scalable web applications. Requirements: 5+ years of experience with React, TypeScript, and distributed systems. Competitive salary, standard corporate benefits, stock options. Structured 4-round technical interview process including systems design and coding. Never pay any fee for applying.",
    overallScore: 12,
    overallSeverity: "LOW",
    categoryScores: {
      socialEngineering: 10,
      financialFraud: 5,
      credentialRisk: 5,
      phishingImpersonation: 5,
      jobCredibility: 10
    },
    signals: [],
    positives: [
      "Application link is hosted on a recognized enterprise recruitment platform (Amazon Corporate Jobs).",
      "Recruiter domain (@amazon.com) is an authenticated corporate handle matching 'Amazon'.",
      "No upfront registration, equipment deposit, or advance fee demands detected.",
      "No unauthorized OTP, banking password, or remote access installation requests identified.",
      "Job posting provides comprehensive scope, requirements, and structured responsibilities."
    ],
    actions: [
      "Proceed via the verified corporate careers portal.",
      "Keep tax identification, SSN, and banking data private until a formal offer letter is executed.",
      "Archive a copy of this job posting and correspondence for your personal records."
    ],
    emailAnalysis: {
      email: "talent-acquisition@amazon.com",
      domain: "amazon.com",
      domainType: "CORPORATE",
      companyMatch: "MATCH",
      risk: "LOW",
      details: ["Sender domain (@amazon.com) strongly correlates with stated organization 'Amazon'."],
      isLookalike: false
    },
    urlAnalysis: {
      rawUrl: "https://amazon.jobs/en/jobs/2849102",
      domain: "amazon.jobs",
      protocol: "HTTPS",
      isShortener: false,
      isIpAddress: false,
      isPunycode: false,
      isSuspiciousTld: false,
      isRecognizedAts: true,
      atsProviderName: "Amazon Corporate Jobs",
      brandMatch: "VERIFIED_ATS",
      risk: "LOW",
      indicators: ["Recognized legitimate ATS / recruitment portal infrastructure (Amazon Corporate Jobs)."],
      explanation: "Destination domain passed core URL security and protocol checks."
    },
    companyTrust: {
      companyName: "Amazon",
      companyProvided: true,
      corporateDomain: true,
      recognizedPlatform: true,
      detailedJobSpecs: true,
      contactAvailable: true,
      trustLevel: "HIGH",
      trustNotes: ["Corporate email domain and recognized ATS portal align with stated employer."],
      externalVerificationStatus: "LOCAL_HEURISTICS_ONLY"
    },
    educationalTakeaway: {
      concept: "Zero-Trust Hiring Verification",
      title: "Verify Before Disclosing",
      explanation: "Authentic organizations welcome independent verification. Always cross-check job listings on official company /careers portals.",
      practicalAdvice: "Never transfer money or execute remote-access software as part of an interview process."
    },
    summary: "No overt cyber threat or recruitment scam indicators detected. Opportunity exhibits 5 positive credibility markers. Always practice zero-trust verification."
  },
  {
    id: "demo-medium-startup",
    timestamp: "2026-08-27T18:40:00Z",
    jobTitle: "Junior Full Stack Developer",
    companyName: "Nova Labs Inc.",
    recruiterEmail: "alex.recruiting.novalabs@gmail.com",
    applicationUrl: "https://forms.gle/novalabs-developer-apply",
    jobDescription: "Nova Labs is looking for a junior developer. $2,000/month. Fill out our Google form to submit your resume. We will review portfolios over the weekend.",
    overallScore: 42,
    overallSeverity: "MEDIUM",
    categoryScores: {
      socialEngineering: 25,
      financialFraud: 10,
      credentialRisk: 15,
      phishingImpersonation: 45,
      jobCredibility: 35
    },
    signals: [
      {
        id: "email-public-provider",
        category: "phishing_impersonation",
        technique: "IMPERSONATION",
        severity: "MEDIUM",
        title: "Recruiter Using Public Provider (@gmail.com)",
        why: "Established recruiters usually communicate from corporate email domains.",
        evidence: "alex.recruiting.novalabs@gmail.com",
        action: "Request verification from an official corporate domain.",
        potentialImpact: "Potential unauthenticated recruiter."
      }
    ],
    positives: [
      "No upfront registration, equipment deposit, or advance fee demands detected.",
      "No unauthorized OTP or remote access installation requests identified."
    ],
    actions: [
      "Verify the founder/recruiter on LinkedIn before sharing sensitive identity documents.",
      "Never submit banking or OTP credentials on generic Google Forms."
    ],
    emailAnalysis: {
      email: "alex.recruiting.novalabs@gmail.com",
      domain: "gmail.com",
      domainType: "PUBLIC",
      companyMatch: "POSSIBLE_MISMATCH",
      risk: "MEDIUM",
      details: ["Recruiter is communicating from a free public provider (@gmail.com)."],
      isLookalike: false
    },
    urlAnalysis: {
      rawUrl: "https://forms.gle/novalabs-developer-apply",
      domain: "forms.gle",
      protocol: "HTTPS",
      isShortener: true,
      isIpAddress: false,
      isPunycode: false,
      isSuspiciousTld: false,
      isRecognizedAts: false,
      brandMatch: "UNRECOGNIZED",
      risk: "MEDIUM",
      indicators: ["Shortened Google Forms link."],
      explanation: "Generic public form used for candidate collection."
    },
    companyTrust: {
      companyName: "Nova Labs Inc.",
      companyProvided: true,
      corporateDomain: false,
      recognizedPlatform: false,
      detailedJobSpecs: false,
      contactAvailable: true,
      trustLevel: "MODERATE",
      trustNotes: ["Early stage startup profile with public email."],
      externalVerificationStatus: "LOCAL_HEURISTICS_ONLY"
    },
    educationalTakeaway: {
      concept: "Email Infrastructure Awareness",
      title: "Free Email Providers in Recruitment",
      explanation: "A recruiter using a public email provider (@gmail.com) is not definitive proof of fraud, but it is a weaker trust indicator that requires independent verification.",
      practicalAdvice: "Ask the recruiter for an email from the company's official domain name to verify their corporate standing."
    },
    summary: "Moderate warning flags detected. Public webmail and generic form link warrant independent recruiter verification."
  }
];

export function getScanHistory(): CyberThreatReport[] {
  if (typeof window === "undefined") return DEMO_PRESET_SCANS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial presets
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PRESET_SCANS));
      return DEMO_PRESET_SCANS;
    }
    const parsed = JSON.parse(raw) as CyberThreatReport[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_PRESET_SCANS;
  } catch {
    return DEMO_PRESET_SCANS;
  }
}

export function saveScanReport(report: CyberThreatReport): void {
  if (typeof window === "undefined") return;
  try {
    const current = getScanHistory();
    // Filter out if duplicate ID exists, prepend newest
    const updated = [report, ...current.filter((r) => r.id !== report.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save report to local storage:", err);
  }
}

export function deleteScanReport(reportId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getScanHistory();
    const updated = current.filter((r) => r.id !== reportId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete report:", err);
  }
}

export function clearAllScanReports(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (err) {
    console.error("Failed to clear reports:", err);
  }
}

export function getSecurityStats(scans: CyberThreatReport[]) {
  const total = scans.length;
  const critical = scans.filter((s) => s.overallSeverity === "CRITICAL").length;
  const high = scans.filter((s) => s.overallSeverity === "HIGH").length;
  const medium = scans.filter((s) => s.overallSeverity === "MEDIUM").length;
  const low = scans.filter((s) => s.overallSeverity === "LOW").length;

  const totalThreats = critical + high;

  // Category breakdown
  let totalSignals = 0;
  const categoryCounts = {
    socialEngineering: 0,
    financialFraud: 0,
    credentialRisk: 0,
    phishingImpersonation: 0,
    jobCredibility: 0
  };

  for (const scan of scans) {
    for (const signal of scan.signals) {
      totalSignals++;
      if (signal.category === "social_engineering") categoryCounts.socialEngineering++;
      if (signal.category === "financial_fraud") categoryCounts.financialFraud++;
      if (signal.category === "credential_risk") categoryCounts.credentialRisk++;
      if (signal.category === "phishing_impersonation") categoryCounts.phishingImpersonation++;
      if (signal.category === "job_credibility") categoryCounts.jobCredibility++;
    }
  }

  return {
    totalScans: total,
    criticalThreats: critical,
    highThreats: high,
    mediumThreats: medium,
    lowThreats: low,
    highOrCriticalCount: totalThreats,
    totalSignalsDetected: totalSignals,
    categoryCounts
  };
}

export function formatReportAsPlainText(report: CyberThreatReport): string {
  const divider = "==================================================";
  const subDivider = "--------------------------------------------------";

  let out = `JOBLENS CYBERSECURITY THREAT REPORT\n${divider}\n`;
  out += `Report ID:       ${report.id}\n`;
  out += `Timestamp:       ${report.timestamp}\n`;
  out += `Target Role:     ${report.jobTitle || "N/A"}\n`;
  out += `Stated Employer: ${report.companyName}\n`;
  out += `Recruiter Email: ${report.recruiterEmail}\n`;
  out += `Application URL: ${report.applicationUrl}\n`;
  out += `${divider}\n`;
  out += `OVERALL THREAT EVALUATION:\n`;
  out += `Threat Score:    ${report.overallScore}/100\n`;
  out += `Severity Level:  ${report.overallSeverity} RISK\n`;
  out += `${subDivider}\n`;
  out += `CATEGORY RISK MATRIX:\n`;
  out += `• Financial Fraud Risk:        ${report.categoryScores.financialFraud}/100\n`;
  out += `• Credential & Data Risk:      ${report.categoryScores.credentialRisk}/100\n`;
  out += `• Phishing & Impersonation:    ${report.categoryScores.phishingImpersonation}/100\n`;
  out += `• Social Engineering Urgency:  ${report.categoryScores.socialEngineering}/100\n`;
  out += `• Job Posting Credibility:     ${report.categoryScores.jobCredibility}/100\n`;
  out += `${divider}\n`;

  if (report.signals.length > 0) {
    out += `DETECTED CYBER THREAT SIGNALS (${report.signals.length}):\n\n`;
    report.signals.forEach((sig, idx) => {
      out += `[${idx + 1}] ${sig.title.toUpperCase()} [${sig.severity}]\n`;
      out += `    Technique: ${sig.technique}\n`;
      out += `    Why Dangerous: ${sig.why}\n`;
      out += `    Evidence: "${sig.evidence}"\n`;
      out += `    Recommended Action: ${sig.action}\n\n`;
    });
  } else {
    out += `No overt cyber threat signals detected.\n\n`;
  }

  if (report.positives.length > 0) {
    out += `POSITIVE CREDIBILITY SIGNALS:\n`;
    report.positives.forEach((pos) => {
      out += `✓ ${pos}\n`;
    });
    out += `\n`;
  }

  out += `RECOMMENDED SAFETY ACTIONS:\n`;
  report.actions.forEach((act, idx) => {
    out += `${idx + 1}. ${act}\n`;
  });
  out += `\n`;

  out += `EDUCATIONAL TAKEAWAY:\n`;
  out += `${report.educationalTakeaway.title}\n`;
  out += `${report.educationalTakeaway.explanation}\n`;
  out += `Advice: ${report.educationalTakeaway.practicalAdvice}\n`;
  out += `${divider}\n`;
  out += `Generated by JobLens Cybersecurity Threat Engine (Omni_CyberTech_10)\n`;

  return out;
}
