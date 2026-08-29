import {
  KNOWN_ENTERPRISE_DOMAINS,
  RECOGNIZED_ATS_DOMAINS,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS
} from "./constants";

export function normalizeCompanyName(company: string): string {
  return company
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|inc|incorporated|llc|corp|corporation|technologies|technology|solutions|services|group|global|holdings)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function extractEmailDomain(email: string): string {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 ? parts[1].trim() : "";
}

export function extractUrlHostname(rawUrl: string): { hostname: string; protocol: "HTTPS" | "HTTP" | "INVALID"; pathname: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { hostname: "", protocol: "INVALID", pathname: "" };
  }

  let fullUrl = trimmed;
  let detectedProtocol: "HTTPS" | "HTTP" | "INVALID" = "HTTPS";

  if (trimmed.startsWith("http://")) {
    detectedProtocol = "HTTP";
  } else if (trimmed.startsWith("https://")) {
    detectedProtocol = "HTTPS";
  } else {
    fullUrl = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(fullUrl);
    return {
      hostname: parsed.hostname.toLowerCase().replace(/^www\./, ""),
      protocol: detectedProtocol,
      pathname: parsed.pathname
    };
  } catch {
    return { hostname: "", protocol: "INVALID", pathname: "" };
  }
}

export function isIpAddress(hostname: string): boolean {
  // IPv4 regex pattern
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Pattern.test(hostname) || hostname.startsWith("[") && hostname.endsWith("]");
}

export function isPunycode(hostname: string): boolean {
  return hostname.includes("xn--");
}

export function isUrlShortener(hostname: string): boolean {
  return URL_SHORTENERS.some((shortener) => hostname === shortener || hostname.endsWith(`.${shortener}`));
}

export function hasSuspiciousTld(hostname: string): boolean {
  return SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld));
}

export function findRecognizedAts(hostname: string): { isAts: boolean; providerName?: string } {
  for (const [domain, name] of Object.entries(RECOGNIZED_ATS_DOMAINS)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return { isAts: true, providerName: name };
    }
  }
  return { isAts: false };
}

// Levenshtein distance for typosquatting detection
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Check for homoglyphs / lookalike string patterns (e.g. amaz0n, g00gle, micros0ft)
export function detectLookalikeDomain(domain: string): { isLookalike: boolean; targetBrand?: string } {
  const rootDomain = domain.split(".")[0].toLowerCase();
  
  // Standard replacement for common leetspeak
  const deLeeted = rootDomain
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/8/g, "b")
    .replace(/rn/g, "m")
    .replace(/vv/g, "w");

  const majorBrands = Object.keys(KNOWN_ENTERPRISE_DOMAINS);

  for (const brand of majorBrands) {
    if (rootDomain !== brand) {
      if (deLeeted === brand || deLeeted.includes(brand)) {
        return { isLookalike: true, targetBrand: brand.toUpperCase() };
      }
      const dist = levenshteinDistance(rootDomain, brand);
      if (dist === 1 && brand.length >= 4) {
        return { isLookalike: true, targetBrand: brand.toUpperCase() };
      }
    }
  }

  return { isLookalike: false };
}

// Extract actual evidence snippet around a matched pattern in text
export function extractEvidenceSnippet(text: string, pattern: RegExp, maxChars = 90): string {
  const match = text.match(pattern);
  if (!match || match.index === undefined) return "";
  
  const half = Math.floor(maxChars / 2);
  const start = Math.max(0, match.index - half);
  const end = Math.min(text.length, match.index + match[0].length + half);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `...${snippet}`;
  if (end < text.length) snippet = `${snippet}...`;
  return snippet;
}
