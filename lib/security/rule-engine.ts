import { analyzeEmailHeaders, analyzeRecruiterEmail } from "./email-analyzer";
import { extractEvidenceSnippet } from "./normalizer";
import type {
  AttackTechnique,
  CompanyTrustReport,
  CyberThreatReport,
  DetectedSignal,
  EducationalTakeaway,
  JobInputForm,
  SignalCategory,
  ThreatSeverity
} from "./types";
import { analyzeApplicationUrl } from "./url-analyzer";

interface RuleDefinition {
  id: string;
  category: SignalCategory;
  technique: AttackTechnique;
  severity: ThreatSeverity;
  title: string;
  pattern: RegExp;
  weight: number;
  why: string;
  action: string;
  potentialImpact: string;
}

const DETECTION_RULES: RuleDefinition[] = [
  // --- A. FINANCIAL FRAUD ---
  {
    id: "fin-equipment-deposit",
    category: "financial_fraud",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "CRITICAL",
    title: "Equipment / Laptop Shipping Deposit Demand",
    pattern: /\b(laptop|macbook|equipment|hardware|kit|device)\s*(deposit|fee|charge|cost|insurance|refundable\s*deposit|courier\s*charge)\b/i,
    weight: 38,
    why: "Legitimate corporate employers ship enterprise hardware at company expense. Requiring candidates to pay upfront deposits is a hallmark of advance-fee fraud.",
    action: "Do not transfer any money. Never pay upfront fees for equipment or software licenses.",
    potentialImpact: "Direct monetary loss with no equipment or employment provided."
  },
  {
    id: "fin-registration-fee",
    category: "financial_fraud",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "CRITICAL",
    title: "Mandatory Registration / Application Fee",
    pattern: /\b(registration|processing|application|onboarding|interview|document\s*verification)\s*(fee|fees|charge|charges|deposit|cost|amount)\b/i,
    weight: 36,
    why: "Charging candidates to apply or interview is prohibited by international labor regulations and universal hiring ethical standards.",
    action: "Refuse payment. Report the listing to the hosting platform.",
    potentialImpact: "Direct financial extortion and recurring fee solicitations."
  },
  {
    id: "fin-training-cost",
    category: "financial_fraud",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "HIGH",
    title: "Mandatory Paid Training or Certification Requirement",
    pattern: /\b(pay\s*(for|to)\s*(training|certificate|course|exam)|mandatory\s*(training|certification)\s*(fee|cost))\b/i,
    weight: 26,
    why: "Fraudulent recruiters often funnel candidates to third-party paid 'training programs' with false promises of guaranteed hiring.",
    action: "Verify if the training vendor is legitimate and if the employer covers corporate enablement.",
    potentialImpact: "Financial loss on unaccredited courses with zero placement guarantee."
  },
  {
    id: "fin-crypto-wallet",
    category: "financial_fraud",
    technique: "FINANCIAL_FRAUD",
    severity: "CRITICAL",
    title: "Cryptocurrency or Untraceable Payment Requirement",
    pattern: /\b(usdt|crypto|bitcoin|btc|eth|binance|gift\s*card|wire\s*transfer|western\s*union)\b/i,
    weight: 35,
    why: "Adversaries leverage non-reversible payment methods to eliminate chargebacks and evade banking compliance.",
    action: "Cease communication immediately. No authentic company conducts payroll deposits via crypto/gift cards.",
    potentialImpact: "Irreversible fund transfer into anonymous illicit wallets."
  },
  {
    id: "fin-check-overpayment",
    category: "financial_fraud",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "CRITICAL",
    title: "Check Cashing / Vendor Refund Trap",
    pattern: /\b(send\s*(you\s*)?a\s*check|deposit\s*(the\s*)?check|vendor\s*account|send\s*(back\s*)?the\s*difference|wire\s*excess)\b/i,
    weight: 40,
    why: "Scammers issue fraudulent cashier's checks, asking victims to transfer 'excess funds' to a vendor. The check bounces days later, leaving the victim liable.",
    action: "Do not deposit checks from unknown recruiters. Consult your bank's fraud desk immediately.",
    potentialImpact: "Severe banking overdraft liability, frozen bank accounts, and total loss of personal funds."
  },

  // --- B. CREDENTIAL & DATA HARVESTING ---
  {
    id: "cred-otp-password",
    category: "credential_risk",
    technique: "CREDENTIAL_HARVESTING",
    severity: "CRITICAL",
    title: "Direct Request for OTP, PIN, or Password Credentials",
    pattern: /\b(otp|one\s*time\s*password|verification\s*code|net\s*banking\s*password|upi\s*pin|atm\s*pin|cvv)\b/i,
    weight: 45,
    why: "Under no circumstance does any legitimate employer or recruiter require OTPs, banking PINs, or account passwords.",
    action: "Immediately terminate contact. Change credentials if previously disclosed.",
    potentialImpact: "Immediate account takeover, unauthorized wire transfers, and identity compromise."
  },
  {
    id: "cred-remote-access",
    category: "credential_risk",
    technique: "CREDENTIAL_HARVESTING",
    severity: "CRITICAL",
    title: "Remote Access Tool (RAT) Installation Request",
    pattern: /\b(anydesk|teamviewer|ultraviewer|screenconnect|remote\s*access|install\s*software\s*to\s*test)\b/i,
    weight: 42,
    why: "Attackers use remote desktop utilities to seize control of applicant computers, access active browser sessions, and exfiltrate banking tokens.",
    action: "Do not install AnyDesk/TeamViewer on recruiter instructions. Authentic assessments use sandboxed browser IDEs.",
    potentialImpact: "Full device compromise, session token theft, and persistent backdoor access."
  },
  {
    id: "cred-premature-pii",
    category: "credential_risk",
    technique: "DATA_HARVESTING",
    severity: "HIGH",
    title: "Premature Government ID & Net Banking Data Solicitation",
    pattern: /\b(aadhaar\s*(card|otp|copy)|ssn|social\s*security\s*number|passport\s*copy|bank\s*statement|net\s*banking\s*details)\s*(before\s*interview|to\s*apply|for\s*payroll\s*setup)\b/i,
    weight: 28,
    why: "Collecting high-sensitivity identity credentials prior to formal interview completion is indicative of data harvesting and synthetic identity fraud.",
    action: "Withhold government identification and banking details until an official written contract is validated.",
    potentialImpact: "Identity theft, unauthorized credit lines opened in your name, and synthetic profile generation."
  },

  // --- C. SOCIAL ENGINEERING ---
  {
    id: "soc-high-pressure",
    category: "social_engineering",
    technique: "SOCIAL_ENGINEERING",
    severity: "HIGH",
    title: "Extreme Artificial Urgency & High-Pressure Deadlines",
    pattern: /\b(urgent\s*hiring|immediate\s*selection|act\s*now|within\s*(12|24|48)\s*hours|limited\s*slots?\s*left|expires\s*today|final\s*notice)\b/i,
    weight: 22,
    why: "Artificial urgency induces cognitive overload, pressuring candidates into bypassing standard due diligence and security verification.",
    action: "Pause and independently contact the employer's official HR department before proceeding.",
    potentialImpact: "Rushed compliance with malicious instructions under false fear of missing out."
  },
  {
    id: "soc-ephemeral-chat",
    category: "social_engineering",
    technique: "SOCIAL_ENGINEERING",
    severity: "HIGH",
    title: "Enforced Migration to Ephemeral Messaging Channels",
    pattern: /\b(telegram|whatsapp\s*only|contact\s*kindly\s*via\s*whatsapp|signal\s*app|viber|text\s*me\s*on\s*whatsapp)\b/i,
    weight: 24,
    why: "Threat actors force communications to unmonitored consumer messaging platforms to evade enterprise security filters, eliminate audit trails, and preserve anonymity.",
    action: "Insist on verified corporate email threads or official video conferencing links.",
    potentialImpact: "Untraceable interactions with zero corporate oversight or accountability."
  },
  {
    id: "soc-no-interview",
    category: "social_engineering",
    technique: "SOCIAL_ENGINEERING",
    severity: "HIGH",
    title: "Instant Job Offer Without Substantive Technical Evaluation",
    pattern: /\b(direct\s*selection|no\s*interview\s*needed|selected\s*immediately|instant\s*offer\s*letter|congratulations\s*you\s*are\s*hired)\b/i,
    weight: 25,
    why: "Pretexting an instant hiring offer exploits job seeker excitement to establish trust prior to springing fee demands.",
    action: "Legitimate corporate roles require structured multi-stage assessments. Treat instant offers with extreme caution.",
    potentialImpact: "False sense of security leading to compliance with subsequent financial demands."
  },
  {
    id: "soc-secrecy-instruction",
    category: "social_engineering",
    technique: "SOCIAL_ENGINEERING",
    severity: "HIGH",
    title: "Secrecy or Information Concealment Request",
    pattern: /\b(keep\s*this\s*confidential|do\s*not\s*disclose|do\s*not\s*inform\s*anyone|secret\s*hiring|private\s*assignment)\b/i,
    weight: 25,
    why: "Isolating the victim from friends, family, or security advisors prevents external intervention during an active scam.",
    action: "Discuss suspicious demands openly with trusted mentors or career counselors.",
    potentialImpact: "Total isolation of the target during financial or credential extraction."
  },

  // --- D. JOB POSTING CREDIBILITY & SALARY ---
  {
    id: "job-unrealistic-salary",
    category: "job_credibility",
    technique: "SOCIAL_ENGINEERING",
    severity: "HIGH",
    title: "Disproportionate Compensation vs. Zero-Skill Requirement",
    pattern: /\b(earn\s*(\$|₹|rs\.?|inr)?\s*([3-9]\d{3}|[1-9]\d{4,})\s*(per\s*)?(day|week)|no\s*experience\s*(needed|required)?\s*.*(\$4,000|\$5,000|₹\d{5,}))\b/i,
    weight: 24,
    why: "Promising exorbitant compensation for trivial tasks (typing, liking videos, captcha solving) is the primary bait in recruitment phishing.",
    action: "Cross-reference industry benchmarks (Levels.fyi, Glassdoor) for realistic compensation ranges.",
    potentialImpact: "Lure into task/commission scam funnels and unpaid labor."
  },
  {
    id: "job-task-commission",
    category: "job_credibility",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "CRITICAL",
    title: "Task-Based / YouTube Like / Hotel Review Commission Scheme",
    pattern: /\b(like\s*(youtube|tiktok|instagram)\s*videos|hotel\s*review|complete\s*(daily\s*)?tasks|earn\s*commission\s*per\s*task|deposit\s*to\s*unlock\s*level)\b/i,
    weight: 38,
    why: "Classic Ponzi task scam where users receive small initial payouts, then must deposit large sums to 'unlock higher tier task commissions'.",
    action: "Do not participate. These operations collapse once significant victim capital is deposited.",
    potentialImpact: "Substantial financial loss in fake investment/task portals."
  }
];

export function runThreatAnalysis(form: JobInputForm): CyberThreatReport {
  const jobDescription = form.jobDescription.trim();
  const companyName = form.companyName.trim();
  const recruiterEmail = form.recruiterEmail.trim();
  const applicationUrl = form.applicationUrl.trim();
  const emailHeaders = form.emailHeaders?.trim() || "";

  const fullSearchText = `${jobDescription}\n${companyName}\n${recruiterEmail}\n${applicationUrl}\n${emailHeaders}`;

  // 1. Run Email & URL Analyzers
  const emailAnalysis = analyzeRecruiterEmail(recruiterEmail, companyName);
  const urlAnalysis = analyzeApplicationUrl(applicationUrl, companyName);
  const headerAnalysis = emailHeaders ? analyzeEmailHeaders(emailHeaders) : undefined;

  // 2. Rule evaluation & Signal Extraction
  const detectedSignals: DetectedSignal[] = [];
  const matchedRuleIds = new Set<string>();

  let socialScore = 10;
  let financialScore = 5;
  let credentialScore = 5;
  let phishingScore = 10;
  let credibilityScore = 15;

  for (const rule of DETECTION_RULES) {
    if (rule.pattern.test(fullSearchText)) {
      const evidence = extractEvidenceSnippet(fullSearchText, rule.pattern);
      detectedSignals.push({
        id: rule.id,
        category: rule.category,
        technique: rule.technique,
        severity: rule.severity,
        title: rule.title,
        why: rule.why,
        evidence: evidence || "Pattern identified in submitted job parameters.",
        action: rule.action,
        potentialImpact: rule.potentialImpact
      });
      matchedRuleIds.add(rule.id);

      // Distribute to category scores
      if (rule.category === "social_engineering") socialScore += rule.weight;
      if (rule.category === "financial_fraud") financialScore += rule.weight;
      if (rule.category === "credential_risk") credentialScore += rule.weight;
      if (rule.category === "job_credibility") credibilityScore += rule.weight;
    }
  }

  // 3. Incorporate Email Security Signals into Phishing Score
  if (emailAnalysis.risk === "CRITICAL") {
    phishingScore += 45;
    detectedSignals.push({
      id: "email-critical-anomaly",
      category: "phishing_impersonation",
      technique: "IMPERSONATION",
      severity: "CRITICAL",
      title: emailAnalysis.isLookalike ? "Deceptive Typosquatting Recruiter Domain" : "Disposable Ephemeral Recruiter Domain",
      why: emailAnalysis.details[0] || "Severe domain risk detected in recruiter identity.",
      evidence: emailAnalysis.email,
      action: "Do not reply. Validate recruiter identity on official company channels.",
      potentialImpact: "Direct interaction with an active threat actor impersonating corporate HR."
    });
  } else if (emailAnalysis.domainType === "PUBLIC" && companyName.length >= 3) {
    phishingScore += 20;
    detectedSignals.push({
      id: "email-public-provider",
      category: "phishing_impersonation",
      technique: "IMPERSONATION",
      severity: "MEDIUM",
      title: `Recruiter Using Public Provider (@${emailAnalysis.domain})`,
      why: "Established enterprise recruiters typically communicate via corporate email infrastructure rather than personal free accounts.",
      evidence: emailAnalysis.email,
      action: "Verify the recruiter's official identity on LinkedIn or through the company's verified switchboard.",
      potentialImpact: "Potential unauthenticated impersonator operating outside corporate oversight."
    });
  }

  // 4. Incorporate URL Security Signals into Phishing Score
  if (urlAnalysis.risk === "CRITICAL") {
    phishingScore += 48;
    detectedSignals.push({
      id: "url-critical-anomaly",
      category: "phishing_impersonation",
      technique: "MALICIOUS_LINK",
      severity: "CRITICAL",
      title: "Severe Destination URL & Hosting Threat Detected",
      why: urlAnalysis.indicators.join(" "),
      evidence: urlAnalysis.rawUrl,
      action: "Do not click or navigate to this destination. Block the URL.",
      potentialImpact: "Drive-by credential harvesting, malware payload delivery, or credential theft."
    });
  } else if (urlAnalysis.risk === "HIGH" || urlAnalysis.isShortener) {
    phishingScore += 26;
    detectedSignals.push({
      id: "url-shortener-warning",
      category: "phishing_impersonation",
      technique: "MALICIOUS_LINK",
      severity: "HIGH",
      title: urlAnalysis.isShortener ? "Obfuscated URL Shortener Link" : "High-Risk Application Portal Domain",
      why: urlAnalysis.indicators[0] || "Destination URL uses obfuscation or unverified TLD.",
      evidence: urlAnalysis.rawUrl,
      action: "Manually navigate to the company's official /careers page instead of following shortened links.",
      potentialImpact: "Redirection to unauthorized phishing portals."
    });
  }

  // 5. Incorporate Email Header Forensics if provided
  if (headerAnalysis) {
    if (headerAnalysis.risk === "CRITICAL" || headerAnalysis.spf === "FAILED" || headerAnalysis.dmarc === "FAILED") {
      phishingScore += 35;
      detectedSignals.push({
        id: "header-auth-failure",
        category: "phishing_impersonation",
        technique: "PHISHING",
        severity: "CRITICAL",
        title: "Cryptographic Email Authentication Failure (SPF/DKIM/DMARC)",
        why: "Mail server failed cryptographic origin checks. The sender's From address is very likely spoofed.",
        evidence: `SPF: ${headerAnalysis.spf}, DKIM: ${headerAnalysis.dkim}, DMARC: ${headerAnalysis.dmarc}`,
        action: "Treat this email as fraudulent spearphishing. Do not download attachments.",
        potentialImpact: "Active domain spoofing and spearphishing payload delivery."
      });
    } else if (headerAnalysis.fromReplyToMismatch) {
      phishingScore += 28;
      detectedSignals.push({
        id: "header-from-replyto-mismatch",
        category: "phishing_impersonation",
        technique: "IMPERSONATION",
        severity: "HIGH",
        title: "From vs. Reply-To Header Domain Mismatch",
        why: headerAnalysis.anomalies[0] || "The reply destination differs from the display sender.",
        evidence: `From: ${headerAnalysis.from} | Reply-To: ${headerAnalysis.replyTo}`,
        action: "Ensure you do not reply to unauthenticated external mailboxes.",
        potentialImpact: "Stealth diversion of responses to an attacker-controlled inbox."
      });
    }
  }

  // 6. Positive credibility signals
  const positives: string[] = [];
  if (urlAnalysis.isRecognizedAts) {
    positives.push(`Application link is hosted on a recognized enterprise recruitment platform (${urlAnalysis.atsProviderName}).`);
    phishingScore = Math.max(0, phishingScore - 15);
  }
  if (emailAnalysis.companyMatch === "MATCH" && emailAnalysis.domainType === "CORPORATE") {
    positives.push(`Recruiter domain (@${emailAnalysis.domain}) is an authenticated corporate handle matching '${companyName}'.`);
    phishingScore = Math.max(0, phishingScore - 15);
  }
  if (!detectedSignals.some((s) => s.category === "financial_fraud")) {
    positives.push("No upfront registration, equipment deposit, or advance fee demands detected.");
  }
  if (!detectedSignals.some((s) => s.category === "credential_risk")) {
    positives.push("No unauthorized OTP, banking password, or remote access installation requests identified.");
  }
  if (jobDescription.length > 250 && !detectedSignals.some((s) => s.id === "job-unrealistic-salary")) {
    positives.push("Job posting provides comprehensive scope, requirements, and structured responsibilities.");
    credibilityScore = Math.max(5, credibilityScore - 10);
  }

  // Clamp category scores 0-100
  const clampedSocial = Math.max(0, Math.min(100, Math.round(socialScore)));
  const clampedFinancial = Math.max(0, Math.min(100, Math.round(financialScore)));
  const clampedCredential = Math.max(0, Math.min(100, Math.round(credentialScore)));
  const clampedPhishing = Math.max(0, Math.min(100, Math.round(phishingScore)));
  const clampedCredibility = Math.max(0, Math.min(100, Math.round(credibilityScore)));

  // Calculate Overall Weighted Score
  // Critical categories carry the highest impact
  const hasCritical = detectedSignals.some((s) => s.severity === "CRITICAL");
  const hasHigh = detectedSignals.some((s) => s.severity === "HIGH");

  let rawOverall =
    clampedFinancial * 0.35 +
    clampedCredential * 0.3 +
    clampedPhishing * 0.2 +
    clampedSocial * 0.1 +
    clampedCredibility * 0.05;

  if (hasCritical && rawOverall < 80) {
    rawOverall = Math.max(82, rawOverall);
  } else if (hasHigh && rawOverall < 60) {
    rawOverall = Math.max(62, rawOverall);
  }

  const overallScore = Math.max(0, Math.min(100, Math.round(rawOverall)));

  let overallSeverity: ThreatSeverity = "LOW";
  if (overallScore >= 80) overallSeverity = "CRITICAL";
  else if (overallScore >= 60) overallSeverity = "HIGH";
  else if (overallScore >= 30) overallSeverity = "MEDIUM";
  else overallSeverity = "LOW";

  // Actions synthesis
  const actions = detectedSignals.length > 0
    ? Array.from(new Set(detectedSignals.map((s) => s.action))).slice(0, 5)
    : [
        "Proceed via the verified corporate careers portal.",
        "Keep tax identification, SSN, and banking data private until a formal offer letter is executed.",
        "Archive a copy of this job posting and correspondence for your personal records."
      ];

  // Company Trust synthesis
  const companyProvided = companyName.length >= 2;
  const corporateDomain = emailAnalysis.domainType === "CORPORATE";
  const recognizedPlatform = urlAnalysis.isRecognizedAts;
  const detailedJobSpecs = jobDescription.length > 200;
  const contactAvailable = recruiterEmail.length > 4;

  let trustLevel: CompanyTrustReport["trustLevel"] = "UNVERIFIED";
  const trustNotes: string[] = [];

  if (corporateDomain && recognizedPlatform) {
    trustLevel = "HIGH";
    trustNotes.push("Corporate email domain and recognized ATS portal align with stated employer.");
  } else if (companyProvided && (corporateDomain || detailedJobSpecs)) {
    trustLevel = "MODERATE";
    trustNotes.push("Stated employer provided with partial digital alignment.");
  } else {
    trustLevel = "LOW";
    trustNotes.push("Limited verifiable corporate infrastructure in submitted information.");
  }

  // Educational Takeaway
  let educationalTakeaway: EducationalTakeaway = {
    concept: "Zero-Trust Hiring Verification",
    title: "Verify Before Disclosing",
    explanation: "Authentic organizations welcome independent verification. Always cross-check job listings on official company /careers portals.",
    practicalAdvice: "Never transfer money or execute remote-access software as part of an interview process."
  };

  if (detectedSignals.some((s) => s.category === "financial_fraud")) {
    educationalTakeaway = {
      concept: "Advance-Fee Fraud Defense",
      title: "Legitimate Employers Never Charge Applicants",
      explanation: "No legitimate corporation requires candidates to pay onboarding, equipment, or processing deposits. Real employers absorb all hiring and equipment logistics costs.",
      practicalAdvice: "If a recruiter demands money for 'laptop shipping' or 'registration', terminate contact immediately."
    };
  } else if (detectedSignals.some((s) => s.category === "credential_risk")) {
    educationalTakeaway = {
      concept: "Credential & Session Protection",
      title: "Protect OTPs & Remote Desktop Access",
      explanation: "Threat actors request OTPs or ask victims to install AnyDesk/TeamViewer under the guise of 'technical onboarding'. Once installed, attackers hijack active sessions and bank accounts.",
      practicalAdvice: "Never install remote control software on instructions from an unverified recruiter."
    };
  } else if (detectedSignals.some((s) => s.id === "email-public-provider")) {
    educationalTakeaway = {
      concept: "Email Infrastructure Awareness",
      title: "Free Email Providers in Recruitment",
      explanation: "A recruiter using a public email provider (@gmail.com) is not definitive proof of fraud (e.g. early-stage founders), but it is a weaker trust indicator that requires independent verification.",
      practicalAdvice: "Ask the recruiter for an email from the company's official domain name to verify their corporate standing."
    };
  }

  const summary = detectedSignals.length > 0
    ? `JobLens security engine extracted ${detectedSignals.length} threat signal${detectedSignals.length === 1 ? "" : "s"} across ${new Set(detectedSignals.map((s) => s.category)).size} attack vector categories, calculating a Threat Score of ${overallScore}/100 (${overallSeverity} RISK).`
    : `No overt cyber threat or recruitment scam indicators detected. Opportunity exhibits ${positives.length} positive credibility marker${positives.length === 1 ? "" : "s"}. Always practice zero-trust verification.`;

  return {
    id: `threat-report-${Date.now()}`,
    timestamp: new Date().toISOString(),
    jobTitle: form.jobTitle || "Unspecified Role",
    companyName: companyName || "Unspecified Entity",
    recruiterEmail: recruiterEmail || "N/A",
    applicationUrl: applicationUrl || "N/A",
    jobDescription,
    overallScore,
    overallSeverity,
    categoryScores: {
      socialEngineering: clampedSocial,
      financialFraud: clampedFinancial,
      credentialRisk: clampedCredential,
      phishingImpersonation: clampedPhishing,
      jobCredibility: clampedCredibility
    },
    signals: detectedSignals,
    positives,
    actions,
    emailAnalysis,
    urlAnalysis,
    headerAnalysis,
    companyTrust: {
      companyName,
      companyProvided,
      corporateDomain,
      recognizedPlatform,
      detailedJobSpecs,
      contactAvailable,
      trustLevel,
      trustNotes,
      externalVerificationStatus: "LOCAL_HEURISTICS_ONLY"
    },
    educationalTakeaway,
    summary
  };
}
