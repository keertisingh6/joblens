import {
  detectLookalikeDomain,
  extractUrlHostname,
  findRecognizedAts,
  hasSuspiciousTld,
  isIpAddress,
  isPunycode,
  isUrlShortener,
  normalizeCompanyName
} from "./normalizer";
import type { ThreatSeverity, UrlSecurityReport } from "./types";

export function analyzeApplicationUrl(rawUrl: string, companyName: string): UrlSecurityReport {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      rawUrl: "",
      domain: "",
      protocol: "INVALID",
      isShortener: false,
      isIpAddress: false,
      isPunycode: false,
      isSuspiciousTld: false,
      isRecognizedAts: false,
      brandMatch: "UNRECOGNIZED",
      risk: "LOW",
      indicators: ["No application URL provided for domain verification."],
      explanation: "Without a destination URL, automated TLS and hosting infrastructure checks cannot be performed."
    };
  }

  const { hostname, protocol, pathname } = extractUrlHostname(trimmed);

  if (!hostname || protocol === "INVALID") {
    return {
      rawUrl: trimmed,
      domain: hostname,
      protocol: "INVALID",
      isShortener: false,
      isIpAddress: false,
      isPunycode: false,
      isSuspiciousTld: false,
      isRecognizedAts: false,
      brandMatch: "UNRECOGNIZED",
      risk: "HIGH",
      indicators: ["Malformed or unparseable URL structure."],
      explanation: "Destination link cannot be parsed into a valid standard internet host."
    };
  }

  const shortener = isUrlShortener(hostname);
  const ipBased = isIpAddress(hostname);
  const punycode = isPunycode(hostname);
  const suspiciousTld = hasSuspiciousTld(hostname);
  const atsCheck = findRecognizedAts(hostname);
  const lookalike = detectLookalikeDomain(hostname);

  const normalizedCompany = normalizeCompanyName(companyName);
  const normalizedHost = hostname.replace(/[^a-z0-9]/g, "");

  const indicators: string[] = [];
  let risk: ThreatSeverity = "LOW";
  let brandMatch: UrlSecurityReport["brandMatch"] = "UNRECOGNIZED";

  if (protocol === "HTTP") {
    indicators.push("Unencrypted HTTP protocol detected. Legitimate enterprise hiring portals enforce HTTPS.");
    risk = "MEDIUM";
  }

  if (ipBased) {
    indicators.push(`Host is a raw numerical IP address (${hostname}) instead of a registered domain name. Major phishing indicator.`);
    risk = "CRITICAL";
  }

  if (shortener) {
    indicators.push(`URL shortener (${hostname}) detected. Shortened links obscure final destination server and bypass preliminary inspections.`);
    risk = "HIGH";
  }

  if (punycode) {
    indicators.push(`Internationalized Domain Name (Punycode xn--) detected. Frequently used in homograph visual spoofing.`);
    risk = "CRITICAL";
  }

  if (lookalike.isLookalike) {
    indicators.push(`Domain exhibits typosquatting characteristics mimicking ${lookalike.targetBrand}.`);
    risk = "CRITICAL";
  }

  if (suspiciousTld) {
    indicators.push(`Domain uses a high-risk / low-reputation top-level domain (${hostname.slice(hostname.lastIndexOf("."))}).`);
    if (risk !== "CRITICAL") risk = "HIGH";
  }

  // Check for dangerous payload paths
  const suspiciousExtensions = [".exe", ".scr", ".bat", ".vbs", ".ps1", ".iso", ".zip", ".msi"];
  const hasMaliciousExtension = suspiciousExtensions.some((ext) => pathname.toLowerCase().endsWith(ext));
  if (hasMaliciousExtension) {
    indicators.push(`URL path links directly to an executable/archive file download (${pathname}). Severe malware delivery indicator.`);
    risk = "CRITICAL";
  }

  // Excessive subdomains
  const subdomains = hostname.split(".");
  if (subdomains.length > 4) {
    indicators.push("Excessive subdomain hierarchy detected (>4 levels). Common in DNS tunneling and disposable fast-flux phishing.");
    if (risk !== "CRITICAL") risk = "MEDIUM";
  }

  if (atsCheck.isAts) {
    brandMatch = "VERIFIED_ATS";
    indicators.push(`Recognized legitimate ATS / recruitment portal infrastructure (${atsCheck.providerName}).`);
    if (risk !== "CRITICAL" && !hasMaliciousExtension && !shortener) {
      risk = "LOW";
    }
  } else if (normalizedCompany.length >= 3 && normalizedHost.includes(normalizedCompany)) {
    brandMatch = "MATCH";
    indicators.push(`Application domain correlates with declared employer '${companyName}'.`);
  } else {
    brandMatch = "MISMATCH";
    indicators.push(`Application domain does not match employer name '${companyName}' or top certified ATS platforms.`);
    if (risk === "LOW") risk = "MEDIUM";
  }

  let explanation = "Destination domain passed core URL security and protocol checks.";
  if (risk === "CRITICAL") {
    explanation = "Severe malicious link or domain spoofing heuristics triggered on this destination.";
  } else if (risk === "HIGH") {
    explanation = "Elevated risk signals detected in destination URL (e.g. shortener, high-risk TLD, or anomalous structure).";
  } else if (risk === "MEDIUM") {
    explanation = "Moderate warning flags detected. Verify the destination portal directly via corporate careers page.";
  }

  return {
    rawUrl: trimmed,
    domain: hostname,
    protocol,
    isShortener: shortener,
    isIpAddress: ipBased,
    isPunycode: punycode,
    isSuspiciousTld: suspiciousTld,
    isRecognizedAts: atsCheck.isAts,
    atsProviderName: atsCheck.providerName,
    brandMatch,
    risk,
    indicators,
    explanation
  };
}
