/**
 * JobLens Modular Security Detector & Dynamic Scoring Engine
 * Deterministic rule-based evaluation with zero hardcoded fixed scores.
 */

export const DETECTION_RULES = [
  {
    id: "fin-equipment-deposit",
    category: "Financial Fraud",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "CRITICAL",
    title: "Equipment / Laptop Shipping Deposit Demand",
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
    pattern: /\b(registration|processing|application|onboarding|interview|document\s*verification)\s*(fee|fees|charge|charges|deposit|cost|amount)\b/i,
    weight: 36,
    why: "Charging candidates to apply or interview is prohibited by international labor regulations and universal hiring ethical standards.",
    action: "Refuse payment. Report the listing to the hosting platform."
  },
  {
    id: "fin-crypto-wallet",
    category: "Financial Fraud",
    technique: "FINANCIAL_FRAUD",
    severity: "CRITICAL",
    title: "Cryptocurrency or Untraceable Payment Requirement",
    pattern: /\b(usdt|crypto|bitcoin|btc|eth|binance|gift\s*card|wire\s*transfer|western\s*union)\b/i,
    weight: 35,
    why: "Adversaries leverage non-reversible payment methods to eliminate chargebacks and evade banking compliance.",
    action: "Cease communication immediately. No authentic company conducts payroll deposits via crypto/gift cards."
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
    pattern: /\b(anydesk|teamviewer|ultraviewer|screenconnect|remote\s*access|install\s*software\s*to\s*test)\b/i,
    weight: 42,
    why: "Attackers use remote desktop utilities to seize control of applicant computers, access active browser sessions, and exfiltrate banking tokens.",
    action: "Do not install AnyDesk/TeamViewer on recruiter instructions. Authentic assessments use sandboxed browser IDEs."
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
    pattern: /\b(urgent\s*hiring|immediate\s*selection|act\s*now|within\s*(12|24|48)\s*hours|limited\s*slots?\s*left|expires\s*today|final\s*notice)\b/i,
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
    pattern: /\b(telegram|whatsapp\s*only|contact\s*kindly\s*via\s*whatsapp|signal\s*app|viber|text\s*me\s*on\s*whatsapp|t\.me\/)\b/i,
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
    pattern: /\b(like\s*youtube\s*videos|hotel\s*review\s*task|earn\s*₹?\s*\d{3,5}\s*daily|task\s*commission|daily\s*payout\s*guaranteed)\b/i,
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
    weight: 18,
    why: "Enterprise corporations communicate through authenticated corporate domain MX records.",
    action: "Verify the recruiter profile directly on the company's official LinkedIn page or careers portal."
  }
];

export function runSecurityEvaluation(data) {
  const text = `${data.jobTitle || ""} ${data.companyName || ""} ${data.jobDescription || ""} ${data.recruiterEmail || ""} ${data.applicationUrl || ""}`;
  let rawScore = 0;
  const detectedSignals = [];
  const categories = new Set();
  const categoryScores = {
    financial_fraud: 0,
    phishing: 0,
    impersonation: 0,
    social_engineering: 0,
    credential_risk: 0,
    recruitment_fraud: 0
  };

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
        why: rule.why,
        action: rule.action
      });
    }
  }

  // Compound interaction multipliers
  const hasPayment = detectedSignals.some(s => s.category === "Financial Fraud");
  const hasUrgency = detectedSignals.some(s => s.title.includes("Urgency"));
  const hasEphemeral = detectedSignals.some(s => s.title.includes("Ephemeral Messaging"));
  const hasHarvesting = detectedSignals.some(s => s.category === "Credential / Data Risk");

  if (hasPayment && hasUrgency) rawScore += 12;
  if (hasPayment && hasEphemeral) rawScore += 15;
  if (hasHarvesting && hasEphemeral) rawScore += 14;

  // Positive trust signals (reduces risk)
  let trustBonus = 0;
  const isCorporateDomain = data.recruiterEmail && !/@(gmail|yahoo|outlook|hotmail)\.com/i.test(data.recruiterEmail);
  if (isCorporateDomain) trustBonus += 8;
  if (data.jobDescription && data.jobDescription.length > 500 && !hasPayment && !hasHarvesting) trustBonus += 6;

  const finalScore = Math.max(0, Math.min(100, rawScore - trustBonus));

  let severity = "LOW";
  if (finalScore >= 75) severity = "CRITICAL";
  else if (finalScore >= 45) severity = "HIGH";
  else if (finalScore >= 20) severity = "MEDIUM";

  // Attack chain reconstruction
  const attackChain = [];
  if (detectedSignals.some(s => s.category === "Impersonation")) {
    attackChain.push({ step: 1, title: "Unsolicited Outreach", desc: "Attacker contacts victim using spoofed brand authority" });
  }
  if (detectedSignals.some(s => s.category === "Social Engineering")) {
    attackChain.push({ step: 2, title: "Psychological Pressure", desc: "Induces urgency or redirects to unmonitored messaging app" });
  }
  if (detectedSignals.some(s => s.category === "Financial Fraud")) {
    attackChain.push({ step: 3, title: "Extortion / Advance Fee Demand", desc: "Demands upfront payment for equipment or registration" });
  }
  if (detectedSignals.some(s => s.category === "Credential / Data Risk")) {
    attackChain.push({ step: 4, title: "Data Harvesting / Takeover", desc: "Harvests national ID, OTP, or remote device access" });
  }

  return {
    id: `scan_${Date.now()}`,
    timestamp: new Date().toISOString(),
    jobTitle: data.jobTitle || "Recruitment Opportunity",
    companyName: data.companyName || "Unspecified Entity",
    overallScore: finalScore,
    overallSeverity: severity,
    categories: Array.from(categories),
    signals: detectedSignals,
    attackChain,
    why: detectedSignals[0]?.why || "Opportunity adheres to standard recruitment safety patterns.",
    action: detectedSignals[0]?.action || "Proceed with standard professional verification.",
    rawInput: data
  };
}