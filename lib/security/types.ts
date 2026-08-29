export type ThreatSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AttackTechnique =
  | "SOCIAL_ENGINEERING"
  | "PHISHING"
  | "IMPERSONATION"
  | "ADVANCE_FEE_FRAUD"
  | "CREDENTIAL_HARVESTING"
  | "FINANCIAL_FRAUD"
  | "MALICIOUS_LINK"
  | "DATA_HARVESTING";

export type SignalCategory =
  | "social_engineering"
  | "financial_fraud"
  | "credential_risk"
  | "phishing_impersonation"
  | "job_credibility";

export interface DetectedSignal {
  id: string;
  category: SignalCategory;
  technique: AttackTechnique;
  severity: ThreatSeverity;
  title: string;
  why: string;
  evidence: string;
  action: string;
  potentialImpact: string;
}

export interface EmailSecurityReport {
  email: string;
  domain: string;
  domainType: "CORPORATE" | "PUBLIC" | "SUSPICIOUS" | "DISPOSABLE" | "UNVERIFIED";
  companyMatch: "MATCH" | "POSSIBLE_MISMATCH" | "UNVERIFIED" | "SUSPICIOUS_LOOKALIKE";
  risk: ThreatSeverity;
  details: string[];
  isLookalike: boolean;
  lookalikeTarget?: string;
}

export interface UrlSecurityReport {
  rawUrl: string;
  domain: string;
  protocol: "HTTPS" | "HTTP" | "INVALID";
  isShortener: boolean;
  isIpAddress: boolean;
  isPunycode: boolean;
  isSuspiciousTld: boolean;
  isRecognizedAts: boolean;
  atsProviderName?: string;
  brandMatch: "VERIFIED_ATS" | "MATCH" | "MISMATCH" | "UNRECOGNIZED";
  risk: ThreatSeverity;
  indicators: string[];
  explanation: string;
}

export interface EmailHeaderReport {
  rawHeaderSnippet?: string;
  from: string;
  fromDomain: string;
  replyTo?: string;
  replyToDomain?: string;
  returnPath?: string;
  returnPathDomain?: string;
  subject?: string;
  messageId?: string;
  spf: "PASSED" | "FAILED" | "SOFTFAIL" | "NOT_AVAILABLE";
  dkim: "PASSED" | "FAILED" | "NOT_AVAILABLE";
  dmarc: "PASSED" | "FAILED" | "NOT_AVAILABLE";
  fromReplyToMismatch: boolean;
  embeddedLinks: string[];
  risk: ThreatSeverity;
  anomalies: string[];
}

export interface CompanyTrustReport {
  companyName: string;
  companyProvided: boolean;
  corporateDomain: boolean;
  recognizedPlatform: boolean;
  detailedJobSpecs: boolean;
  contactAvailable: boolean;
  trustLevel: "HIGH" | "MODERATE" | "LOW" | "UNVERIFIED";
  trustNotes: string[];
  externalVerificationStatus: "LOCAL_HEURISTICS_ONLY";
}

export interface EducationalTakeaway {
  concept: string;
  title: string;
  explanation: string;
  practicalAdvice: string;
}

export interface CyberThreatReport {
  id: string;
  timestamp: string;
  jobTitle?: string;
  companyName: string;
  recruiterEmail: string;
  applicationUrl: string;
  jobDescription: string;
  overallScore: number; // 0-100
  overallSeverity: ThreatSeverity;
  categoryScores: {
    socialEngineering: number;
    financialFraud: number;
    credentialRisk: number;
    phishingImpersonation: number;
    jobCredibility: number;
  };
  signals: DetectedSignal[];
  positives: string[];
  actions: string[];
  emailAnalysis: EmailSecurityReport;
  urlAnalysis: UrlSecurityReport;
  headerAnalysis?: EmailHeaderReport;
  companyTrust: CompanyTrustReport;
  educationalTakeaway: EducationalTakeaway;
  summary: string;
}

export interface JobInputForm {
  jobTitle?: string;
  companyName: string;
  recruiterEmail: string;
  applicationUrl: string;
  jobDescription: string;
  emailHeaders?: string;
}
