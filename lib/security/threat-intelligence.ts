export interface ThreatIntelSource {
  name: string;
  category: "DOMAIN_REPUTATION" | "URL_PHISHING_FEED" | "WHOIS_AGE" | "MALWARE_HASH";
  status: "OFFLINE_HEURISTIC" | "NOT_CONFIGURED" | "ACTIVE";
  description: string;
  apiConfigured: boolean;
}

export const SUPPORTED_INTEL_FEEDS: ThreatIntelSource[] = [
  {
    name: "URLhaus Malware/Phishing Feed",
    category: "URL_PHISHING_FEED",
    status: "OFFLINE_HEURISTIC",
    description: "Database of verified malicious recruitment landing domains and phishing shortlinks.",
    apiConfigured: false
  },
  {
    name: "RDAP / WHOIS Domain Age Registry",
    category: "WHOIS_AGE",
    status: "NOT_CONFIGURED",
    description: "Inspects domain creation timestamp to identify newly registered domains (<30 days old) commonly used in disposable campaigns.",
    apiConfigured: false
  },
  {
    name: "VirusTotal Multi-Engine Reputation",
    category: "DOMAIN_REPUTATION",
    status: "NOT_CONFIGURED",
    description: "Aggregates 70+ cybersecurity vendor verdicts on recruiter domains and URL paths.",
    apiConfigured: false
  },
  {
    name: "JobLens Community Telemetry Feed",
    category: "DOMAIN_REPUTATION",
    status: "OFFLINE_HEURISTIC",
    description: "Local heuristic database matching 50+ known recruitment scam archetypes and ATS signatures.",
    apiConfigured: true
  }
];

export function getThreatIntelStatus() {
  return {
    architecture: "Modular OSINT / Threat Intelligence Integration Layer",
    engineVersion: "JobLens Heuristic Engine v2.4",
    offlineSignaturesCount: 48,
    activeFeeds: SUPPORTED_INTEL_FEEDS,
    disclaimer: "Running in privacy-preserving local heuristic mode. No external network queries dispatched without explicit user proxy authorization."
  };
}
