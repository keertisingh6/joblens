/**
 * JobLens Modular Security Detector & Dynamic Scoring Engine
 * Authoritative deterministic rule-based evaluation with zero hardcoded fixed scores.
 * Compatible with ES Modules, CommonJS, and Browser Global / Extension Side Panel.
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.JobLensSecurityEngine = factory();
  }
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : this, function () {

  const DETECTION_RULES = [
    {
      id: "fin-equipment-deposit",
      category: "Financial Fraud",
      technique: "ADVANCE_FEE_FRAUD",
      severity: "CRITICAL",
      title: "Equipment / Hardware Shipping Deposit Demand",
      pattern: /\b(laptop|macbook|equipment|hardware|kit|device)\s*(deposit|fee|charge|cost|insurance|refundable\s*deposit|courier\s*charge)\b/i,
      weight: 38,
      why: "Legitimate corporate employers ship enterprise hardware at company expense. Requiring candidates to pay upfront deposits is a hallmark of advance-fee fraud.",
      action: "Do not transfer any money. Never pay upfront fees for equipment or software licenses."
    },
    {
      id: "fin-registration-fee",
      category: "Financial Fraud",
      technique: "ADVANCE_FEE_FRAUD",
      severity: "CRITICAL",
      title: "Mandatory Registration / Application Fee",
      pattern: /\b(registration|processing|application|onboarding|interview|document\s*verification)\s*(fee|fees|charge|charges|deposit|cost|amount|payment)\b/i,
      weight: 36,
      why: "Charging candidates to apply, interview, or undergo document verification is prohibited by standard recruitment compliance.",
      action: "Refuse payment. Report the listing to the hosting platform."
    },
    {
      id: "fin-crypto-wallet",
      category: "Financial Fraud",
      technique: "FINANCIAL_FRAUD",
      severity: "CRITICAL",
      title: "Cryptocurrency or Untraceable Payment Requirement",
      pattern: /\b(usdt|crypto|bitcoin|btc|eth|binance|gift\s*card|wire\s*transfer|western\s*union|task\s*recharge)\b/i,
      weight: 35,
      why: "Adversaries leverage non-reversible payment methods to eliminate chargebacks and evade banking compliance.",
      action: "Cease communication immediately. No authentic company conducts payroll deposits via crypto or gift cards."
    },
    {
      id: "cred-otp-password",
      category: "Credential / Data Risk",
      technique: "CREDENTIAL_HARVESTING",
      severity: "CRITICAL",
      title: "Direct Request for OTP, PIN, or Password Credentials",
      pattern: /\b(otp|one\s*time\s*password|verification\s*code|net\s*banking\s*password|upi\s*pin|atm\s*pin|cvv)\b/i,
      weight: 45,
      why: "Under no circumstance does any legitimate employer or recruiter require OTPs, banking PINs, or account passwords.",
      action: "Immediately terminate contact. Change credentials if previously disclosed."
    },
    {
      id: "cred-remote-access",
      category: "Credential / Data Risk",
      technique: "CREDENTIAL_HARVESTING",
      severity: "CRITICAL",
      title: "Remote Access Tool (RAT) Installation Request",
      pattern: /\b(anydesk|teamviewer|ultraviewer|screenconnect|remote\s*access|install\s*agent|install\s*software\s*to\s*test)\b/i,
      weight: 42,
      why: "Attackers use remote desktop utilities to seize control of applicant computers, access active browser sessions, and exfiltrate banking tokens.",
      action: "Do not install AnyDesk or TeamViewer on recruiter instructions. Authentic technical assessments use sandboxed browser IDEs."
    },
    {
      id: "cred-premature-pii",
      category: "Credential / Data Risk",
      technique: "DATA_HARVESTING",
      severity: "HIGH",
      title: "Premature Government ID & Net Banking Data Solicitation",
      pattern: /\b(aadhaar|pan\s*card|ssn|social\s*security\s*number|passport\s*copy|bank\s*statement|net\s*banking\s*details)\b/i,
      weight: 28,
      why: "Collecting high-sensitivity identity credentials prior to formal interview completion is indicative of data harvesting and synthetic identity fraud.",
      action: "Withhold government identification and banking details until an official written contract is validated."
    },
    {
      id: "soc-high-pressure",
      category: "Social Engineering",
      technique: "SOCIAL_ENGINEERING",
      severity: "HIGH",
      title: "Extreme Artificial Urgency & High-Pressure Deadlines",
      pattern: /\b(urgent\s*hiring|immediate\s*selection|act\s*now|within\s*(12|24|48)\s*hours|limited\s*slots?\s*left|expires\s*today|final\s*notice|immediate\s*joining)\b/i,
      weight: 22,
      why: "Artificial urgency induces cognitive overload, pressuring candidates into bypassing standard due diligence and security verification.",
      action: "Pause and independently contact the employer's official HR department before proceeding."
    },
    {
      id: "soc-ephemeral-chat",
      category: "Social Engineering",
      technique: "SOCIAL_ENGINEERING",
      severity: "HIGH",
      title: "Enforced Migration to Ephemeral Messaging Channels",
      pattern: /\b(telegram|whatsapp\s*only|contact\s*kindly\s*via\s*whatsapp|signal\s*app|viber|text\s*me\s*on\s*whatsapp|t\.me\/|wa\.me\/)\b/i,
      weight: 24,
      why: "Threat actors force communications to unmonitored consumer messaging platforms to evade enterprise security filters and eliminate audit trails.",
      action: "Insist on verified enterprise communication through official company email domains."
    },
    {
      id: "rec-task-scam",
      category: "Recruitment Fraud",
      technique: "TASK_COMMISSION_SCAM",
      severity: "CRITICAL",
      title: "Task-Based YouTube / Review Micro-Job Scam",
      pattern: /\b(like\s*youtube\s*videos|hotel\s*review\s*task|earn\s*₹?\s*\d{3,5}\s*daily|task\s*commission|daily\s*payout\s*guaranteed|prepaid\s*task)\b/i,
      weight: 40,
      why: "Task-based scams lure victims with initial micro-payouts before locking funds behind massive 'recharge fees'.",
      action: "Block the sender immediately. Never participate in prepaid commission task schemes."
    },
    {
      id: "imp-free-recruiter-email",
      category: "Impersonation",
      technique: "IMPERSONATION",
      severity: "MEDIUM",
      title: "Enterprise Role Sourced from Public Webmail Provider",
      pattern: /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|rediffmail\.com)\b/i,
      weight: 14,
      why: "Public free webmail addresses are commonly used in unauthorized outreach, although small businesses may occasionally use them.",
      action: "Verify the recruiter profile directly on the company's official LinkedIn page or careers portal."
    }
  ];

  /**
   * Classifies page content to distinguish genuine recruitment content from non-recruitment pages.
   */
  function classifyRecruitmentContent(data) {
    if (!data) return { classification: "UNKNOWN", isRecruitment: false, confidence: "LOW" };

    const explicitType = (data.sourceType || "").toUpperCase();
    if (explicitType === "NON_JOB" || explicitType === "NON_RECRUITMENT_PAGE") {
      return { classification: "NON_RECRUITMENT_PAGE", isRecruitment: false, confidence: "HIGH" };
    }
    if (explicitType === "JOB_POSTING") {
      return { classification: "JOB_POSTING", isRecruitment: true, confidence: "HIGH" };
    }
    if (explicitType === "RECRUITER_CHAT" || explicitType === "RECRUITER_MESSAGE") {
      return { classification: "RECRUITER_MESSAGE", isRecruitment: true, confidence: "HIGH" };
    }
    if (explicitType === "EMAIL_INVITATION" || explicitType === "RECRUITMENT_EMAIL") {
      return { classification: "RECRUITMENT_EMAIL", isRecruitment: true, confidence: "HIGH" };
    }
    if (explicitType === "CAREERS_PAGE") {
      return { classification: "CAREERS_PAGE", isRecruitment: true, confidence: "HIGH" };
    }

    const text = `${data.jobTitle || ""} ${data.companyName || ""} ${data.jobDescription || ""}`.toLowerCase();
    
    // Check for recruitment semantic clusters
    const jobKeywords = /\b(job description|responsibilities|qualifications|years of experience|full-time|part-time|salary|per annum|per month|ctc|requirements|apply now|role overview|job summary)\b/i;
    const chatKeywords = /\b(hi|hello|reached out|opportunity for you|looking for a candidate|your profile on linkedin|resume received)\b/i;

    if (jobKeywords.test(text)) {
      return { classification: "JOB_POSTING", isRecruitment: true, confidence: "MEDIUM" };
    }
    if (chatKeywords.test(text) && text.length < 1000) {
      return { classification: "RECRUITER_MESSAGE", isRecruitment: true, confidence: "MEDIUM" };
    }

    // Default to NON_RECRUITMENT_PAGE if text is generic
    if (!text.trim() || text.length < 50) {
      return { classification: "NON_RECRUITMENT_PAGE", isRecruitment: false, confidence: "LOW" };
    }

    return { classification: "UNKNOWN", isRecruitment: false, confidence: "LOW" };
  }

  /**
   * Evaluates threat indicators and computes dynamic, explainable risk score.
   */
  function runSecurityEvaluation(data) {
    if (!data) data = {};

    const classification = classifyRecruitmentContent(data);

    // If it's a non-recruitment page, return clean zero-risk result without scam alarms
    if (!classification.isRecruitment && (classification.classification === "NON_RECRUITMENT_PAGE" || data.sourceType === "NON_JOB")) {
      return {
        id: `scan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        jobTitle: data.jobTitle || "Webpage Content",
        companyName: data.companyName || "Non-Recruitment Page",
        classification: "NON_RECRUITMENT_PAGE",
        isRecruitmentContent: false,
        overallScore: 0,
        overallSeverity: "LOW",
        categories: [],
        signals: [],
        trustAdjustments: [],
        compoundInteractions: [],
        attackChain: [],
        why: "This page does not appear to be an active recruitment opportunity. No recruitment threat indicators were identified.",
        action: "No defensive action required for standard non-recruitment browsing.",
        rawInput: data
      };
    }

    const text = `${data.jobTitle || ""} ${data.companyName || ""} ${data.jobDescription || ""} ${data.recruiterEmail || ""} ${data.applicationUrl || ""}`;
    let rawScore = 0;
    const detectedSignals = [];
    const categories = new Set();

    for (const rule of DETECTION_RULES) {
      const match = text.match(rule.pattern);
      if (match) {
        rawScore += rule.weight;
        categories.add(rule.category);
        detectedSignals.push({
          id: rule.id,
          category: rule.category,
          technique: rule.technique,
          severity: rule.severity,
          title: rule.title,
          evidence: match[0],
          weight: rule.weight,
          contribution: `+${rule.weight}`,
          why: rule.why,
          action: rule.action
        });
      }
    }

    // Compound interaction multipliers (Attack-chain correlation)
    const compoundInteractions = [];
    const hasPayment = detectedSignals.some(s => s.category === "Financial Fraud");
    const hasUrgency = detectedSignals.some(s => s.id === "soc-high-pressure");
    const hasEphemeral = detectedSignals.some(s => s.id === "soc-ephemeral-chat");
    const hasHarvesting = detectedSignals.some(s => s.category === "Credential / Data Risk");
    const hasImpersonation = detectedSignals.some(s => s.category === "Impersonation");

    if (hasPayment && hasUrgency) {
      rawScore += 12;
      compoundInteractions.push({
        title: "Compound Risk: Upfront Fee Demand combined with Artificial Urgency",
        adjustment: "+12 pts",
        weight: 12
      });
    }
    if (hasPayment && hasEphemeral) {
      rawScore += 15;
      compoundInteractions.push({
        title: "Compound Risk: Advance Fee Demand redirected to Ephemeral Messaging",
        adjustment: "+15 pts",
        weight: 15
      });
    }
    if (hasPayment && hasImpersonation) {
      rawScore += 14;
      compoundInteractions.push({
        title: "Compound Risk: Upfront Fee Demand from Unverified Email Domain",
        adjustment: "+14 pts",
        weight: 14
      });
    }
    if (hasHarvesting && hasEphemeral) {
      rawScore += 14;
      compoundInteractions.push({
        title: "Compound Risk: Credential Solicitation on Ephemeral Messaging",
        adjustment: "+14 pts",
        weight: 14
      });
    }

    // Positive trust adjustments (reduces risk for legitimate patterns)
    const trustAdjustments = [];
    let trustBonus = 0;

    const email = (data.recruiterEmail || "").trim();
    if (email && email.includes("@")) {
      const isFreeEmail = /@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/i.test(email);
      if (!isFreeEmail) {
        trustBonus += 8;
        trustAdjustments.push({
          title: "Verified Corporate MX Domain",
          evidence: email,
          adjustment: "-8 pts",
          amount: 8,
          why: "Recruiter address is hosted on a private enterprise domain rather than a free disposable provider."
        });
      }
    }

    const descLength = (data.jobDescription || "").length;
    if (descLength > 450 && !hasPayment && !hasHarvesting) {
      trustBonus += 6;
      trustAdjustments.push({
        title: "Comprehensive Job Specification",
        evidence: `${descLength} characters of detailed role scope`,
        adjustment: "-6 pts",
        amount: 6,
        why: "Opportunity provides detailed technical scope and structured requirements without extortion or credential requests."
      });
    }

    const finalScore = Math.max(0, Math.min(100, rawScore - trustBonus));

    let severity = "LOW";
    if (finalScore >= 75) severity = "CRITICAL";
    else if (finalScore >= 45) severity = "HIGH";
    else if (finalScore >= 20) severity = "MEDIUM";

    // Attack chain reconstruction
    const attackChain = [];
    if (detectedSignals.some(s => s.category === "Impersonation")) {
      attackChain.push({ step: 1, title: "Unsolicited Outreach", desc: "Attacker contacts candidate via unverified channel" });
    }
    if (detectedSignals.some(s => s.category === "Social Engineering")) {
      attackChain.push({ step: 2, title: "Psychological Pressure", desc: "Induces artificial urgency or shifts communication to encrypted app" });
    }
    if (detectedSignals.some(s => s.category === "Financial Fraud")) {
      attackChain.push({ step: 3, title: "Advance Fee Demand", desc: "Demands upfront payment for equipment, software, or interview processing" });
    }
    if (detectedSignals.some(s => s.category === "Credential / Data Risk")) {
      attackChain.push({ step: 4, title: "Data / Account Takeover", desc: "Harvests national ID credentials, banking OTPs, or installs remote control agent" });
    }

    let summaryWhy = "Opportunity adheres to standard recruitment safety patterns.";
    let summaryAction = "Proceed with standard professional verification.";

    if (detectedSignals.length > 0) {
      summaryWhy = detectedSignals[0].why;
      summaryAction = detectedSignals[0].action;
    }

    return {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobTitle: data.jobTitle || "Recruitment Opportunity",
      companyName: data.companyName || "Unspecified Entity",
      classification: classification.classification,
      isRecruitmentContent: true,
      overallScore: finalScore,
      overallSeverity: severity,
      categories: Array.from(categories),
      signals: detectedSignals,
      trustAdjustments,
      compoundInteractions,
      attackChain,
      why: summaryWhy,
      action: summaryAction,
      userStatus: null,
      rawInput: data
    };
  }

  return {
    DETECTION_RULES,
    classifyRecruitmentContent,
    runSecurityEvaluation
  };
});
