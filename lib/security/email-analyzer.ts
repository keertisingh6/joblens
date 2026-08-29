import { DISPOSABLE_EMAIL_DOMAINS, FREE_EMAIL_PROVIDERS, KNOWN_ENTERPRISE_DOMAINS } from "./constants";
import { detectLookalikeDomain, extractEmailDomain, normalizeCompanyName } from "./normalizer";
import type { EmailHeaderReport, EmailSecurityReport, ThreatSeverity } from "./types";

export function analyzeRecruiterEmail(email: string, companyName: string): EmailSecurityReport {
  const trimmedEmail = email.trim();
  const domain = extractEmailDomain(trimmedEmail);

  if (!trimmedEmail || !domain) {
    return {
      email: trimmedEmail,
      domain: "",
      domainType: "UNVERIFIED",
      companyMatch: "UNVERIFIED",
      risk: "LOW",
      details: ["No recruiter email provided. Corporate email verification omitted."],
      isLookalike: false
    };
  }

  const isPublic = FREE_EMAIL_PROVIDERS.includes(domain);
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.includes(domain);
  const lookalikeCheck = detectLookalikeDomain(domain);

  const normalizedCompany = normalizeCompanyName(companyName);
  const normalizedDomain = domain.replace(/[^a-z0-9]/g, "");

  const knownDomains = Object.entries(KNOWN_ENTERPRISE_DOMAINS).find(([key]) =>
    normalizedCompany.includes(key)
  )?.[1] ?? [];

  const matchesKnownEnterprise = knownDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
  const companyMatchesDomain = normalizedCompany.length >= 3 && normalizedDomain.includes(normalizedCompany);

  let domainType: EmailSecurityReport["domainType"] = "CORPORATE";
  let companyMatch: EmailSecurityReport["companyMatch"] = "UNVERIFIED";
  let risk: ThreatSeverity = "LOW";
  const details: string[] = [];

  if (isDisposable) {
    domainType = "DISPOSABLE";
    companyMatch = "POSSIBLE_MISMATCH";
    risk = "CRITICAL";
    details.push(`Domain '@${domain}' is a recognized ephemeral/disposable inbox service frequently used in adversary evasion.`);
  } else if (lookalikeCheck.isLookalike) {
    domainType = "SUSPICIOUS";
    companyMatch = "SUSPICIOUS_LOOKALIKE";
    risk = "CRITICAL";
    details.push(
      `Domain '@${domain}' exhibits deceptive typosquatting / lookalike characteristics mimicking ${lookalikeCheck.targetBrand}.`
    );
  } else if (isPublic) {
    domainType = "PUBLIC";
    if (normalizedCompany.length >= 3) {
      companyMatch = "POSSIBLE_MISMATCH";
      risk = "MEDIUM";
      details.push(
        `Recruiter is communicating from a free public provider (@${domain}) rather than an authenticated corporate domain for '${companyName}'.`
      );
    } else {
      companyMatch = "UNVERIFIED";
      risk = "LOW";
      details.push(`Public email provider (@${domain}) in use. Weaker trust verification.`);
    }
  } else if (matchesKnownEnterprise || companyMatchesDomain) {
    domainType = "CORPORATE";
    companyMatch = "MATCH";
    risk = "LOW";
    details.push(`Sender domain (@${domain}) strongly correlates with stated organization '${companyName}'.`);
  } else {
    domainType = "CORPORATE";
    companyMatch = "POSSIBLE_MISMATCH";
    risk = "LOW";
    details.push(
      `Sender domain (@${domain}) does not directly match company name '${companyName}'. May indicate an external recruitment agency or third-party partner.`
    );
  }

  return {
    email: trimmedEmail,
    domain,
    domainType,
    companyMatch,
    risk,
    details,
    isLookalike: lookalikeCheck.isLookalike,
    lookalikeTarget: lookalikeCheck.targetBrand
  };
}

/**
 * Forensic analysis of pasted RFC 822 Email Headers
 */
export function analyzeEmailHeaders(rawText: string): EmailHeaderReport | undefined {
  if (!rawText || rawText.trim().length < 20) return undefined;

  const lines = rawText.split(/\r?\n/);
  const headerMap: Record<string, string> = {};

  let currentKey = "";
  for (const line of lines) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) {
      currentKey = match[1].toLowerCase();
      headerMap[currentKey] = match[2].trim();
    } else if (currentKey && (line.startsWith(" ") || line.startsWith("\t"))) {
      headerMap[currentKey] += " " + line.trim();
    }
  }

  // Extract from
  const fromRaw = headerMap["from"] || "";
  const replyToRaw = headerMap["reply-to"] || "";
  const returnPathRaw = headerMap["return-path"] || "";
  const authResults = headerMap["authentication-results"] || "";
  const subject = headerMap["subject"];
  const messageId = headerMap["message-id"];

  if (!fromRaw && !authResults && !replyToRaw) {
    return undefined;
  }

  const fromEmail = fromRaw.match(/<([^>]+)>/)?.[1] || fromRaw.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || fromRaw;
  const replyToEmail = replyToRaw.match(/<([^>]+)>/)?.[1] || replyToRaw.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "";
  const returnPathEmail = returnPathRaw.match(/<([^>]+)>/)?.[1] || returnPathRaw.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "";

  const fromDomain = extractEmailDomain(fromEmail);
  const replyToDomain = replyToEmail ? extractEmailDomain(replyToEmail) : "";
  const returnPathDomain = returnPathEmail ? extractEmailDomain(returnPathEmail) : "";

  // Parse SPF
  let spf: EmailHeaderReport["spf"] = "NOT_AVAILABLE";
  if (authResults.includes("spf=pass")) spf = "PASSED";
  else if (authResults.includes("spf=fail")) spf = "FAILED";
  else if (authResults.includes("spf=softfail")) spf = "SOFTFAIL";

  // Parse DKIM
  let dkim: EmailHeaderReport["dkim"] = "NOT_AVAILABLE";
  if (authResults.includes("dkim=pass")) dkim = "PASSED";
  else if (authResults.includes("dkim=fail")) dkim = "FAILED";

  // Parse DMARC
  let dmarc: EmailHeaderReport["dmarc"] = "NOT_AVAILABLE";
  if (authResults.includes("dmarc=pass")) dmarc = "PASSED";
  else if (authResults.includes("dmarc=fail")) dmarc = "FAILED";

  const fromReplyToMismatch = Boolean(
    replyToDomain && fromDomain && replyToDomain !== fromDomain
  );

  const anomalies: string[] = [];
  let risk: ThreatSeverity = "LOW";

  if (fromReplyToMismatch) {
    anomalies.push(`From domain (@${fromDomain}) does not match Reply-To domain (@${replyToDomain}). Frequent spearphishing spoofing indicator.`);
    risk = "HIGH";
  }

  if (spf === "FAILED" || dkim === "FAILED" || dmarc === "FAILED") {
    anomalies.push(`Cryptographic mail authentication failure detected in headers (SPF: ${spf}, DKIM: ${dkim}, DMARC: ${dmarc}).`);
    risk = "CRITICAL";
  }

  if (returnPathDomain && fromDomain && returnPathDomain !== fromDomain) {
    anomalies.push(`Return-Path domain (@${returnPathDomain}) differs from sender From domain (@${fromDomain}).`);
    if (risk !== "CRITICAL") risk = "MEDIUM";
  }

  // Extract any embedded links in body text if present
  const embeddedLinks: string[] = [];
  const urlMatches = rawText.match(/https?:\/\/[^\s"'<>]+/g);
  if (urlMatches) {
    urlMatches.slice(0, 5).forEach((u) => embeddedLinks.push(u));
  }

  return {
    rawHeaderSnippet: rawText.slice(0, 400),
    from: fromEmail,
    fromDomain,
    replyTo: replyToEmail || undefined,
    replyToDomain: replyToDomain || undefined,
    returnPath: returnPathEmail || undefined,
    returnPathDomain: returnPathDomain || undefined,
    subject,
    messageId,
    spf,
    dkim,
    dmarc,
    fromReplyToMismatch,
    embeddedLinks,
    risk,
    anomalies
  };
}
