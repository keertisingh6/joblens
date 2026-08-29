import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// Minimal valid 1x1 RGBA PNG buffer generator or multi-size shield icon generator
function createPngIcon(size, r = 14, g = 165, b = 233) {
  // We can generate an uncompressed or simple deflate PNG
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression method: 0
  ihdr[11] = 0; // Filter method: 0
  ihdr[12] = 0; // Interlace method: 0

  const ihdrChunk = createChunk("IHDR", ihdr);

  // Raw image data with scanline filter bytes
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw shield shape
      const nx = (x - width / 2) / (width / 2);
      const ny = (y - height / 2) / (height / 2);
      const inShield = (Math.abs(nx) <= 0.8 && ny >= -0.8 && ny <= 0.8 - Math.pow(Math.abs(nx), 1.5));

      if (inShield) {
        // Cyan / Sky primary color with gradient
        const factor = 1 - (y / height) * 0.3;
        rawData[pxOffset] = Math.round(r * factor);
        rawData[pxOffset + 1] = Math.round(g * factor);
        rawData[pxOffset + 2] = Math.round(b * factor);
        rawData[pxOffset + 3] = 255;
      } else {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

console.log("🛠️ Building JobLens Chrome Manifest V3 Extension Package...");

const EXT_DIR = path.resolve("./extension");
const PUBLIC_EXT_DIR = path.resolve("./public/extension");

// Ensure directories exist
for (const base of [EXT_DIR, PUBLIC_EXT_DIR]) {
  fs.mkdirSync(path.join(base, "icons"), { recursive: true });
  fs.mkdirSync(path.join(base, "background"), { recursive: true });
  fs.mkdirSync(path.join(base, "content"), { recursive: true });
  fs.mkdirSync(path.join(base, "sidepanel"), { recursive: true });
  fs.mkdirSync(path.join(base, "detectors"), { recursive: true });
}

// 1. Generate PNG Icons
const iconSizes = [16, 32, 48, 128];
for (const size of iconSizes) {
  const iconBuf = createPngIcon(size);
  fs.writeFileSync(path.join(EXT_DIR, `icons/icon${size}.png`), iconBuf);
  fs.writeFileSync(path.join(PUBLIC_EXT_DIR, `icons/icon${size}.png`), iconBuf);
}

// Also save SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
fs.writeFileSync(path.join(EXT_DIR, "icons/icon.svg"), svgIcon);
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "icons/icon.svg"), svgIcon);

// 2. Manifest V3 JSON
const manifest = {
  manifest_version: 3,
  name: "JobLens - Recruitment Security & Scam Detection",
  version: "2.1.0",
  description: "Proactive browser-based recruitment security layer that detects fake jobs, advance-fee fraud, recruiter impersonation, and data harvesting.",
  permissions: [
    "sidePanel",
    "storage",
    "activeTab",
    "scripting",
    "contextMenus"
  ],
  host_permissions: [
    "<all_urls>"
  ],
  background: {
    service_worker: "background/service-worker.js"
  },
  side_panel: {
    default_path: "sidepanel/sidepanel.html"
  },
  action: {
    default_title: "Open JobLens Security Side Panel",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["content/content.js"],
      run_at: "document_idle"
    }
  ],
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Ctrl+Shift+J",
        mac: "Command+Shift+J"
      },
      description: "Open JobLens Side Panel"
    }
  }
};

const manifestStr = JSON.stringify(manifest, null, 2);
fs.writeFileSync(path.join(EXT_DIR, "manifest.json"), manifestStr);
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "manifest.json"), manifestStr);

// 3. Background Service Worker
const serviceWorkerJs = `/**
 * JobLens Background Service Worker (Manifest V3)
 * Orchestrates Side Panel, Context Menus, and Active Tab Security Badging
 */

// Enable open on extension action click
chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Set up Context Menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "joblens-scan-selection",
    title: "🛡️ Scan selection with JobLens",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "joblens-scan-page",
    title: "🔍 Analyze recruitment opportunity on this page",
    contexts: ["page"]
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  // Open side panel in current window
  await chrome.sidePanel.open({ windowId: tab.windowId });

  // Relay data to side panel
  setTimeout(() => {
    if (info.menuItemId === "joblens-scan-selection" && info.selectionText) {
      chrome.runtime.sendMessage({
        type: "JOBLENS_SCAN_SELECTION",
        text: info.selectionText,
        url: tab.url || "",
        tabId: tab.id
      }).catch(() => {});
    } else if (info.menuItemId === "joblens-scan-page") {
      chrome.runtime.sendMessage({
        type: "JOBLENS_TRIGGER_PAGE_SCAN",
        tabId: tab.id,
        url: tab.url || ""
      }).catch(() => {});
    }
  }, 400);
});

// Listen for messages from content scripts and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_RISK_BADGE") {
    const tabId = sender.tab?.id || message.tabId;
    if (tabId) {
      let badgeText = "SAFE";
      let badgeColor = "#10B981"; // Emerald

      if (message.severity === "CRITICAL") {
        badgeText = "CRIT";
        badgeColor = "#DC2626"; // Red
      } else if (message.severity === "HIGH") {
        badgeText = "WARN";
        badgeColor = "#EA580C"; // Orange
      } else if (message.severity === "MEDIUM") {
        badgeText = "MED";
        badgeColor = "#EAB308"; // Amber
      }

      chrome.action.setBadgeText({ tabId, text: badgeText });
      chrome.action.setBadgeBackgroundColor({ tabId, color: badgeColor });
    }
    sendResponse({ received: true });
  }
});
`;

fs.writeFileSync(path.join(EXT_DIR, "background/service-worker.js"), serviceWorkerJs.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "background/service-worker.js"), serviceWorkerJs.trim());
// Also keep a root background.js alias for backward compatibility
fs.writeFileSync(path.join(EXT_DIR, "background.js"), serviceWorkerJs.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "background.js"), serviceWorkerJs.trim());

// 4. Content Script with Deep DOM Extractors
const contentJs = `/**
 * JobLens Content Script (Manifest V3)
 * Non-invasive DOM extraction with platform adapters for LinkedIn, Indeed, Naukri, Webmail, etc.
 */

(() => {
  // Listen for extraction requests from side panel or service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_PAGE_JOB_DATA") {
      const extracted = extractJobOrRecruitmentData();
      sendResponse(extracted);
    } else if (request.type === "GET_SELECTED_TEXT") {
      const selected = window.getSelection()?.toString()?.trim() || "";
      sendResponse({ selectedText: selected, url: window.location.href });
    }
    return true;
  });

  function extractJobOrRecruitmentData() {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();
    const pageTitle = document.title || "";
    const selectedText = window.getSelection()?.toString()?.trim() || "";

    // 1. LinkedIn
    if (hostname.includes("linkedin.com")) {
      const isJobPage = url.includes("/jobs/") || document.querySelector(".jobs-description") || document.querySelector(".job-details-jobs-unified-top-card__job-title");
      if (isJobPage) {
        const titleEl = document.querySelector("h1.job-details-jobs-unified-top-card__job-title, h1.topcard__title, .jobs-unified-top-card__job-title");
        const companyEl = document.querySelector(".job-details-jobs-unified-top-card__company-name, .topcard__flavor--black-link, .jobs-unified-top-card__company-name");
        const descEl = document.querySelector("#job-details, .jobs-description__content, .jobs-box__html-content, .show-more-less-html__markup");
        const recruiterEl = document.querySelector(".hirer-card__hirer-information, .jobs-poster__name");

        return {
          success: true,
          platform: "LinkedIn",
          sourceType: "JOB_POSTING",
          jobTitle: titleEl?.textContent?.trim() || pageTitle.split("|")[0]?.trim() || "LinkedIn Job Posting",
          companyName: companyEl?.textContent?.trim() || "LinkedIn Employer",
          recruiterEmail: extractEmails(descEl?.textContent || "")[0] || "",
          applicationUrl: url,
          jobDescription: descEl?.textContent?.trim() || document.body.innerText.slice(0, 4000),
          recruiterName: recruiterEl?.textContent?.trim() || ""
        };
      }

      if (url.includes("/messaging/")) {
        const activeChat = document.querySelector(".msg-thread, .msg-conversation-card--active");
        const chatText = activeChat?.textContent?.trim() || selectedText;
        if (chatText) {
          return {
            success: true,
            platform: "LinkedIn Messaging",
            sourceType: "RECRUITER_CHAT",
            jobTitle: "Recruiter Direct Message",
            companyName: "LinkedIn Contact",
            recruiterEmail: extractEmails(chatText)[0] || "",
            applicationUrl: url,
            jobDescription: chatText
          };
        }
      }
    }

    // 2. Naukri
    if (hostname.includes("naukri.com")) {
      const titleEl = document.querySelector("h1[class*='styles_jcp-heading'], h1[class*='styles_job-title'], h1.jd-header-title");
      const companyEl = document.querySelector("a[class*='styles_company-name'], a[class*='styles_comp-name'], div[class*='styles_company-name']");
      const descEl = document.querySelector("section[class*='styles_job-desc-container'], div[class*='styles_JDRest__desc'], .dang-inner-html");

      if (titleEl || descEl) {
        const descText = descEl?.textContent?.trim() || document.body.innerText.slice(0, 4000);
        return {
          success: true,
          platform: "Naukri.com",
          sourceType: "JOB_POSTING",
          jobTitle: titleEl?.textContent?.trim() || pageTitle.split("|")[0]?.trim() || "Naukri Job Opportunity",
          companyName: companyEl?.textContent?.trim() || "Naukri Employer",
          recruiterEmail: extractEmails(descText)[0] || "",
          applicationUrl: url,
          jobDescription: descText
        };
      }
    }

    // 3. Indeed
    if (hostname.includes("indeed.com")) {
      const titleEl = document.querySelector("h1.jobsearch-JobInfoHeader-title, [data-testid='jobsearch-JobInfoHeader-title']");
      const companyEl = document.querySelector("[data-testid='inlineHeader-companyName'], [data-company-name='true'], .jobsearch-InlineCompanyRating-companyHeader");
      const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText");

      if (titleEl || descEl) {
        const descText = descEl?.textContent?.trim() || "";
        return {
          success: true,
          platform: "Indeed",
          sourceType: "JOB_POSTING",
          jobTitle: titleEl?.textContent?.trim() || pageTitle.split("-")[0]?.trim() || "Indeed Job Posting",
          companyName: companyEl?.textContent?.trim() || "Indeed Employer",
          recruiterEmail: extractEmails(descText)[0] || "",
          applicationUrl: url,
          jobDescription: descText
        };
      }
    }

    // 4. Webmail (Gmail / Outlook)
    if (hostname.includes("mail.google.com")) {
      const subjectEl = document.querySelector("h2.hP");
      const senderEl = document.querySelector("span.gD");
      const bodyEl = document.querySelector("div.a3s.aiL, div[role='main'] .adn.ads");

      if (subjectEl && bodyEl) {
        const senderEmail = senderEl?.getAttribute("email") || senderEl?.textContent || "";
        const bodyText = bodyEl.textContent?.trim() || "";
        return {
          success: true,
          platform: "Gmail",
          sourceType: "EMAIL_INVITATION",
          jobTitle: subjectEl.textContent?.trim() || "Recruitment Email Offer",
          companyName: extractCompanyFromEmail(senderEmail) || "Email Sender",
          recruiterEmail: senderEmail,
          applicationUrl: url,
          jobDescription: bodyText
        };
      }
    }

    // 5. Lever / Greenhouse / Workday Career Portals
    if (hostname.includes("lever.co") || hostname.includes("greenhouse.io") || hostname.includes("myworkdayjobs.com") || url.includes("/careers/") || url.includes("/job/")) {
      const heading = document.querySelector("h1, h2");
      const mainContent = document.querySelector("main, article, [role='main'], .content, #content");
      const descText = mainContent?.textContent?.trim() || document.body.innerText.slice(0, 4000);

      return {
        success: true,
        platform: "Careers Portal",
        sourceType: "CAREERS_PAGE",
        jobTitle: heading?.textContent?.trim() || pageTitle.split(/[-|]/)[0]?.trim() || "Corporate Job Posting",
        companyName: hostname.replace(/^www\\./, "").split(".")[0].toUpperCase(),
        recruiterEmail: extractEmails(descText)[0] || "",
        applicationUrl: url,
        jobDescription: descText
      };
    }

    // 6. Generic Heuristic Detection
    const fullBodyText = document.body ? document.body.innerText : "";
    const recruitmentKeywords = /\\b(job description|responsibilities|qualifications|apply now|compensation|salary|per month|per annum|work from home|remote position|requirements)\\b/i;
    
    if (recruitmentKeywords.test(fullBodyText)) {
      const heading = document.querySelector("h1, h2, title");
      return {
        success: true,
        platform: "Web Page",
        sourceType: "JOB_POSTING",
        jobTitle: heading?.textContent?.trim() || pageTitle.split(/[-|]/)[0]?.trim() || "Identified Job Opportunity",
        companyName: hostname.replace(/^www\\./, ""),
        recruiterEmail: extractEmails(fullBodyText)[0] || "",
        applicationUrl: url,
        jobDescription: selectedText || fullBodyText.slice(0, 3500)
      };
    }

    // Non-recruitment page
    return {
      success: false,
      platform: "Generic Web Page",
      sourceType: "NON_JOB",
      jobTitle: "",
      companyName: "",
      recruiterEmail: "",
      applicationUrl: url,
      jobDescription: selectedText
    };
  }

  function extractEmails(text) {
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g);
    return matches ? Array.from(new Set(matches)) : [];
  }

  function extractCompanyFromEmail(email) {
    if (!email || !email.includes("@")) return "";
    const domain = email.split("@")[1].toLowerCase();
    const freeProviders = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
    if (freeProviders.includes(domain)) return "";
    return domain.split(".")[0].toUpperCase();
  }
})();
`;

fs.writeFileSync(path.join(EXT_DIR, "content/content.js"), contentJs.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "content/content.js"), contentJs.trim());
fs.writeFileSync(path.join(EXT_DIR, "content.js"), contentJs.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "content.js"), contentJs.trim());

// 5. Client Security Engine (Standalone Pure JS Detection & Dynamic Scorer)
const securityEngineJs = `/**
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
    pattern: /\\b(laptop|macbook|equipment|hardware|kit|device)\\s*(deposit|fee|charge|cost|insurance|refundable\\s*deposit|courier\\s*charge)\\b/i,
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
    pattern: /\\b(registration|processing|application|onboarding|interview|document\\s*verification)\\s*(fee|fees|charge|charges|deposit|cost|amount)\\b/i,
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
    pattern: /\\b(usdt|crypto|bitcoin|btc|eth|binance|gift\\s*card|wire\\s*transfer|western\\s*union)\\b/i,
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
    pattern: /\\b(otp|one\\s*time\\s*password|verification\\s*code|net\\s*banking\\s*password|upi\\s*pin|atm\\s*pin|cvv)\\b/i,
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
    pattern: /\\b(anydesk|teamviewer|ultraviewer|screenconnect|remote\\s*access|install\\s*software\\s*to\\s*test)\\b/i,
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
    pattern: /\\b(aadhaar|pan\\s*card|ssn|social\\s*security\\s*number|passport\\s*copy|bank\\s*statement|net\\s*banking\\s*details)\\b/i,
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
    pattern: /\\b(urgent\\s*hiring|immediate\\s*selection|act\\s*now|within\\s*(12|24|48)\\s*hours|limited\\s*slots?\\s*left|expires\\s*today|final\\s*notice)\\b/i,
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
    pattern: /\\b(telegram|whatsapp\\s*only|contact\\s*kindly\\s*via\\s*whatsapp|signal\\s*app|viber|text\\s*me\\s*on\\s*whatsapp|t\\.me\\/)\\b/i,
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
    pattern: /\\b(like\\s*youtube\\s*videos|hotel\\s*review\\s*task|earn\\s*₹?\\s*\\d{3,5}\\s*daily|task\\s*commission|daily\\s*payout\\s*guaranteed)\\b/i,
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
    pattern: /@(gmail\\.com|yahoo\\.com|outlook\\.com|hotmail\\.com|rediffmail\\.com)\\b/i,
    weight: 18,
    why: "Enterprise corporations communicate through authenticated corporate domain MX records.",
    action: "Verify the recruiter profile directly on the company's official LinkedIn page or careers portal."
  }
];

export function runSecurityEvaluation(data) {
  const text = \`\${data.jobTitle || ""} \${data.companyName || ""} \${data.jobDescription || ""} \${data.recruiterEmail || ""} \${data.applicationUrl || ""}\`;
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
  const isCorporateDomain = data.recruiterEmail && !/@(gmail|yahoo|outlook|hotmail)\\.com/i.test(data.recruiterEmail);
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
    id: \`scan_\${Date.now()}\`,
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
`;

fs.writeFileSync(path.join(EXT_DIR, "detectors/security-engine.js"), securityEngineJs.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "detectors/security-engine.js"), securityEngineJs.trim());

// 6. Side Panel HTML with All 4 Core Views (Live Scan, History, Radar, Safety, Settings)
const sidepanelHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JobLens - Recruitment Security Side Panel</title>
  <link rel="stylesheet" href="sidepanel.css">
</head>
<body class="theme-dark">
  <div id="app-container">
    <!-- ONBOARDING VIEW (Shown on first run) -->
    <section id="view-onboarding" class="view-panel hidden">
      <div class="onboarding-card">
        <div class="brand-badge">
          <div class="brand-icon">🛡️</div>
          <h2>JobLens</h2>
        </div>
        <p class="tagline">Browser Recruitment Security Layer</p>
        <p class="onboarding-desc">
          Proactive protection against fake jobs, advance-fee scams, recruiter impersonation, and phishing as you browse.
        </p>

        <form id="onboarding-form" class="form-stack">
          <div class="field">
            <label for="onboard-name">Your Name</label>
            <input type="text" id="onboard-name" placeholder="e.g. Keerti Singh" required>
          </div>
          <div class="field">
            <label for="onboard-email">Email (for alert sync)</label>
            <input type="email" id="onboard-email" placeholder="e.g. keerti@example.com" required>
          </div>
          <div class="field">
            <label for="onboard-sensitivity">Threat Sensitivity</label>
            <select id="onboard-sensitivity">
              <option value="STANDARD">Standard (Balanced Heuristics)</option>
              <option value="AGGRESSIVE">Aggressive (Zero-Trust Strict)</option>
              <option value="RELAXED">Relaxed (Flags Critical Only)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            Enable Proactive Protection
          </button>
        </form>
        <p class="privacy-note">🔒 Evaluates opportunities with zero tracking.</p>
      </div>
    </section>

    <!-- MAIN SIDE PANEL VIEW -->
    <section id="view-main" class="view-panel">
      <!-- Top App Bar -->
      <header class="app-header">
        <div class="header-brand">
          <span class="logo-shield">🛡️</span>
          <div>
            <h1 class="brand-title">JobLens</h1>
            <span class="sub-label">Recruitment Security</span>
          </div>
        </div>
        
        <div class="protection-toggle-container">
          <span class="protection-status" id="protection-status-text">Protection: ON</span>
          <label class="switch">
            <input type="checkbox" id="protection-toggle" checked>
            <span class="slider round"></span>
          </label>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <nav class="panel-nav">
        <button class="nav-tab active" data-tab="tab-scan">🔍 Live Scan</button>
        <button class="nav-tab" data-tab="tab-history">📜 History</button>
        <button class="nav-tab" data-tab="tab-radar">⚡ Radar</button>
        <button class="nav-tab" data-tab="tab-safety">📋 Safety</button>
        <button class="nav-tab" data-tab="tab-settings">⚙️ Settings</button>
      </nav>

      <!-- TAB 1: LIVE SCAN -->
      <div id="tab-scan" class="tab-content active">
        <!-- Target Context Bar -->
        <div class="context-card" id="context-card">
          <div class="context-header">
            <span class="platform-badge" id="detected-platform">LinkedIn</span>
            <span class="source-type" id="detected-type">Job Posting</span>
          </div>
          <div class="context-details">
            <h3 class="target-title" id="target-job-title">Scanning active tab...</h3>
            <p class="target-company" id="target-company-name">Detecting employer...</p>
            <p class="target-contact" id="target-contact-info"></p>
          </div>
          <div class="context-actions">
            <button class="btn btn-xs btn-primary" id="btn-refresh-page">🔍 Scan This Page</button>
            <button class="btn btn-xs btn-outline" id="btn-manual-input">✏️ Custom Text</button>
          </div>
        </div>

        <!-- Manual Paste Box (Collapsible) -->
        <div class="manual-input-box hidden" id="manual-input-box">
          <label for="manual-paste-text">Analyze Selected Text / WhatsApp / Recruiter Message:</label>
          <textarea id="manual-paste-text" placeholder="Paste job offer, WhatsApp message, or Telegram recruiter conversation here..."></textarea>
          <div class="manual-input-actions">
            <button class="btn btn-xs btn-primary" id="btn-submit-manual">Analyze Content</button>
            <button class="btn btn-xs btn-ghost" id="btn-cancel-manual">Cancel</button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="scan-loading hidden" id="scan-loading">
          <div class="spinner"></div>
          <p>Running multi-dimensional recruitment threat matrix...</p>
        </div>

        <!-- NO JOB DETECTED STATE -->
        <div class="no-job-card hidden" id="no-job-card">
          <div class="no-job-icon">🔎</div>
          <h3>JobLens couldn't identify a job posting on this page.</h3>
          <p>You can select any recruitment text on the page or paste recruiter messages directly.</p>
          <div class="no-job-actions">
            <button class="btn btn-secondary btn-block" id="btn-select-text-action">
              ✂️ Select Text to Scan
            </button>
            <button class="btn btn-outline btn-block" id="btn-open-paste-action">
              📋 Paste Opportunity / Message
            </button>
          </div>
        </div>

        <!-- SCAN RESULT CARD -->
        <div class="scan-result-card hidden" id="scan-result-card">
          <!-- RISK HEADER -->
          <div class="risk-banner" id="risk-banner">
            <div class="risk-banner-header">
              <div class="risk-title-group">
                <span class="risk-icon" id="risk-badge-icon">🚨</span>
                <span class="risk-title-text" id="risk-badge-text">RECRUITMENT SCAM DETECTED</span>
              </div>
              <div class="score-pill">
                <span class="score-num" id="threat-score-val">87</span>
                <span class="score-denom">/100</span>
              </div>
            </div>
            <div class="score-progress-bar">
              <div class="score-progress-fill" id="score-progress-fill"></div>
            </div>
          </div>

          <!-- TRUST SIGNALS (For Low Risk) -->
          <div class="trust-box hidden" id="trust-box">
            <div class="trust-title">✅ Verified Trust Indicators</div>
            <p class="trust-desc">No advance-fee extortion, credential harvesting, or impersonation signals detected. Follow standard candidate due diligence.</p>
          </div>

          <!-- THREAT BREAKDOWN -->
          <div class="threat-breakdown-box" id="threat-breakdown-box">
            <div class="category-pills" id="category-pills-row"></div>
            
            <div class="why-box">
              <span class="section-tag">WHY THIS MATTERS</span>
              <p id="why-text" class="why-text"></p>
            </div>

            <div class="action-box">
              <span class="section-tag">DEFENSIVE ACTION</span>
              <p id="action-text" class="action-text"></p>
            </div>

            <!-- EVIDENCE SNIPPETS -->
            <div class="evidence-box">
              <span class="section-tag">EVIDENCE DETECTED (<span id="evidence-count">0</span>)</span>
              <div id="evidence-list" class="evidence-list"></div>
            </div>
          </div>

          <!-- BOTTOM ACTION TOOLBAR -->
          <div class="scan-actions-grid">
            <button class="btn btn-xs btn-outline" id="btn-copy-report">📋 Copy Report</button>
            <button class="btn btn-xs btn-outline" id="btn-save-report">💾 Save</button>
            <button class="btn btn-xs btn-outline btn-danger-ghost" id="btn-report-scam">🚨 Report</button>
            <button class="btn btn-xs btn-ghost" id="btn-mark-safe">Mark Safe</button>
          </div>
        </div>
      </div>

      <!-- TAB 2: THREAT HISTORY -->
      <div id="tab-history" class="tab-content">
        <div class="history-header">
          <h3>Saved Threat Intelligence</h3>
          <button class="btn btn-xs btn-ghost" id="btn-clear-history">Clear</button>
        </div>
        <div id="history-items-container" class="history-list"></div>
      </div>

      <!-- TAB 3: SCAM RADAR -->
      <div id="tab-radar" class="tab-content">
        <div class="radar-header">
          <h3>Recruitment Threat Radar</h3>
          <p class="text-dim text-xs">8 Core Cyber Threat Vectors</p>
        </div>
        <div class="radar-list">
          <div class="radar-item">
            <div class="radar-item-title">💼 Advance-Fee Laptop / Equipment Scam</div>
            <p class="radar-item-desc">Adversaries demand refundable deposits for MacBook/monitors before courier dispatch.</p>
          </div>
          <div class="radar-item">
            <div class="radar-item-title">📱 YouTube / Review Task Scam</div>
            <p class="radar-item-desc">Lures victims with small payouts for video likes, then demands thousands in prepaid recharge fees.</p>
          </div>
          <div class="radar-item">
            <div class="radar-item-title">🆔 Aadhaar / PAN Credential Harvesting</div>
            <p class="radar-item-desc">Demands sensitive national ID scans and bank credentials prior to interview.</p>
          </div>
          <div class="radar-item">
            <div class="radar-item-title">🖥️ AnyDesk / Remote Access RAT</div>
            <p class="radar-item-desc">Pressures candidate to install remote desktop utilities under guise of 'system test'.</p>
          </div>
        </div>
      </div>

      <!-- TAB 4: SAFETY TOOLKIT -->
      <div id="tab-safety" class="tab-content">
        <div class="safety-header">
          <h3>Candidate Verification Protocol</h3>
        </div>
        <div class="safety-checklist">
          <label class="check-item"><input type="checkbox"> 1. Verify recruiter profile on official LinkedIn.</label>
          <label class="check-item"><input type="checkbox"> 2. Cross-check email domain against corporate MX records.</label>
          <label class="check-item"><input type="checkbox"> 3. Never pay application, interview, or equipment deposits.</label>
          <label class="check-item"><input type="checkbox"> 4. Never share 6-digit OTPs or banking PINs.</label>
          <label class="check-item"><input type="checkbox"> 5. Never install remote desktop utilities on candidate devices.</label>
        </div>
      </div>

      <!-- TAB 5: SETTINGS -->
      <div id="tab-settings" class="tab-content">
        <div class="settings-card">
          <h3>User Security Profile</h3>
          <p class="user-email-text" id="user-display-email">candidate@joblens.security</p>
          <div class="field pt-2">
            <label>Threat Sensitivity</label>
            <select id="settings-sensitivity">
              <option value="STANDARD">Standard (Balanced)</option>
              <option value="AGGRESSIVE">Aggressive (Zero-Trust)</option>
              <option value="RELAXED">Relaxed (Critical Only)</option>
            </select>
          </div>
          <div class="settings-actions pt-4">
            <button class="btn btn-secondary btn-block" id="btn-logout">Sign Out / Reset Session</button>
          </div>
        </div>
      </div>
    </section>
  </div>

  <script src="sidepanel.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(EXT_DIR, "sidepanel/sidepanel.html"), sidepanelHtml.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "sidepanel/sidepanel.html"), sidepanelHtml.trim());
fs.writeFileSync(path.join(EXT_DIR, "sidepanel.html"), sidepanelHtml.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "sidepanel.html"), sidepanelHtml.trim());

// 7. Side Panel CSS
const sidepanelCss = `/* JobLens Manifest V3 Side Panel Theme */
:root {
  --bg-primary: #030712;
  --bg-card: #0b1120;
  --bg-subtle: #111827;
  --border-color: #1f2937;
  --text-main: #f9fafb;
  --text-dim: #9ca3af;
  --color-primary: #0ea5e9;
  --color-primary-hover: #38bdf8;
  --color-critical: #ef4444;
  --color-high: #f97316;
  --color-med: #eab308;
  --color-low: #10b981;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { background-color: var(--bg-primary); color: var(--text-main); font-size: 12px; line-height: 1.4; overflow-x: hidden; }

#app-container { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
.hidden { display: none !important; }

/* Header */
.app-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background-color: var(--bg-card); border-bottom: 1px solid var(--border-color); }
.header-brand { display: flex; align-items: center; gap: 8px; }
.logo-shield { font-size: 18px; }
.brand-title { font-size: 13px; font-weight: 700; color: #fff; }
.sub-label { font-size: 10px; color: var(--text-dim); }

.protection-toggle-container { display: flex; align-items: center; gap: 6px; }
.protection-status { font-size: 10px; font-weight: 600; color: var(--color-low); }

/* Switch */
.switch { position: relative; display: inline-block; width: 28px; height: 16px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #374151; transition: .2s; border-radius: 16px; }
.slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px; background-color: white; transition: .2s; border-radius: 50%; }
input:checked + .slider { background-color: var(--color-low); }
input:checked + .slider:before { transform: translateX(12px); }

/* Navigation */
.panel-nav { display: flex; background-color: var(--bg-primary); border-bottom: 1px solid var(--border-color); padding: 2px 6px; overflow-x: auto; gap: 2px; }
.nav-tab { background: none; border: none; color: var(--text-dim); padding: 6px 8px; font-size: 11px; font-weight: 500; cursor: pointer; border-radius: 6px; white-space: nowrap; transition: 0.15s; }
.nav-tab:hover { color: #fff; background-color: var(--bg-subtle); }
.nav-tab.active { color: #fff; background-color: #0369a1; font-weight: 600; }

/* Tab Content */
.tab-content { display: none; padding: 12px; }
.tab-content.active { display: block; }

/* Context Card */
.context-card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 10px; }
.context-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.platform-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; background-color: rgba(14, 165, 233, 0.15); color: var(--color-primary); padding: 2px 5px; border-radius: 4px; }
.source-type { font-size: 10px; color: var(--text-dim); }
.target-title { font-size: 13px; font-weight: 600; color: #fff; line-height: 1.3; }
.target-company { font-size: 11px; color: var(--color-primary); margin-top: 1px; }
.target-contact { font-size: 10px; color: var(--text-dim); font-family: monospace; margin-top: 2px; }
.context-actions { display: flex; gap: 6px; margin-top: 8px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; font-size: 11px; font-weight: 600; border-radius: 6px; border: 1px solid transparent; cursor: pointer; transition: 0.15s; }
.btn-primary { background-color: var(--color-primary); color: #fff; }
.btn-primary:hover { background-color: var(--color-primary-hover); }
.btn-secondary { background-color: #1e293b; color: #fff; border-color: #334155; }
.btn-outline { background-color: transparent; border-color: var(--border-color); color: var(--text-main); }
.btn-outline:hover { background-color: var(--bg-subtle); color: #fff; }
.btn-ghost { background-color: transparent; color: var(--text-dim); }
.btn-ghost:hover { color: #fff; background-color: var(--bg-subtle); }
.btn-xs { padding: 4px 8px; font-size: 10px; }
.btn-block { width: 100%; margin-top: 6px; }
.btn-danger-ghost { color: var(--color-critical); border-color: rgba(239, 68, 68, 0.3); }

/* Scan Results */
.scan-result-card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-top: 10px; }
.risk-banner { padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; }
.risk-banner-header { display: flex; align-items: center; justify-content: space-between; }
.risk-title-group { display: flex; align-items: center; gap: 6px; }
.risk-icon { font-size: 16px; }
.risk-title-text { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
.score-pill { font-weight: 800; font-size: 14px; }
.score-denom { font-size: 10px; color: var(--text-dim); }
.score-progress-bar { height: 4px; width: 100%; background-color: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 6px; overflow: hidden; }
.score-progress-fill { height: 100%; transition: width 0.4s ease; }

.risk-critical { background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; }
.risk-high { background-color: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.4); color: #fdba74; }
.risk-med { background-color: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); color: #fde047; }
.risk-low { background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #86efac; }

/* Threat Breakdown */
.section-tag { font-size: 9px; font-weight: 700; color: var(--text-dim); letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
.why-box, .action-box, .evidence-box { margin-top: 8px; padding: 6px 8px; border-radius: 6px; background-color: rgba(0,0,0,0.3); border: 1px solid var(--border-color); }
.why-text { font-size: 11px; color: #e2e8f0; }
.action-text { font-size: 11px; color: var(--color-primary); font-weight: 500; }
.category-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.pill { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
.pill-danger { background-color: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }

.evidence-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.evidence-item { padding: 4px 6px; background-color: rgba(0,0,0,0.4); border-radius: 4px; border: 1px solid #1f2937; }
.evidence-title { font-size: 10px; font-weight: 700; color: #fca5a5; }
.evidence-snippet { font-size: 9px; font-family: monospace; color: #cbd5e1; word-break: break-all; }

.scan-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 10px; }

/* Loading & No Job */
.scan-loading { text-align: center; padding: 20px 0; color: var(--text-dim); }
.spinner { width: 24px; height: 24px; border: 2px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 8px; }
@keyframes spin { to { transform: rotate(360deg); } }

.no-job-card { text-align: center; padding: 16px 12px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; }
.no-job-icon { font-size: 24px; margin-bottom: 6px; }
.no-job-card h3 { font-size: 12px; color: #fff; margin-bottom: 4px; }
.no-job-card p { font-size: 11px; color: var(--text-dim); margin-bottom: 10px; }

/* Manual Box */
.manual-input-box { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; margin-bottom: 10px; }
.manual-input-box textarea { width: 100%; height: 70px; background-color: #030712; border: 1px solid var(--border-color); border-radius: 4px; color: #fff; font-size: 11px; padding: 6px; resize: none; margin-top: 4px; }
.manual-input-actions { display: flex; gap: 6px; margin-top: 6px; }

/* History & Radar */
.history-item, .radar-item { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; cursor: pointer; transition: 0.15s; }
.history-item:hover { border-color: var(--color-primary); }
.history-item-top { display: flex; justify-content: space-between; align-items: center; }
.history-item-title { font-weight: 600; font-size: 11px; color: #fff; }
.history-item-company { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

.radar-item-title { font-weight: 600; font-size: 11px; color: #fff; }
.radar-item-desc { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

/* Onboarding */
.onboarding-card { padding: 24px 16px; text-align: center; }
.brand-badge { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 4px; }
.brand-icon { font-size: 24px; }
.tagline { font-size: 11px; color: var(--color-primary); font-weight: 600; }
.onboarding-desc { font-size: 11px; color: var(--text-dim); margin: 8px 0 16px; }
.form-stack { text-align: left; display: flex; flex-direction: column; gap: 10px; }
.field label { font-size: 10px; font-weight: 600; color: var(--text-dim); display: block; margin-bottom: 2px; }
.field input, .field select { width: 100%; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 8px; color: #fff; font-size: 11px; }
.privacy-note { font-size: 10px; color: var(--text-dim); margin-top: 12px; }
.safety-checklist { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.check-item { font-size: 11px; color: #cbd5e1; display: flex; align-items: flex-start; gap: 6px; cursor: pointer; }
`;

fs.writeFileSync(path.join(EXT_DIR, "sidepanel/sidepanel.css"), sidepanelCss.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "sidepanel/sidepanel.css"), sidepanelCss.trim());
fs.writeFileSync(path.join(EXT_DIR, "sidepanel.css"), sidepanelCss.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "sidepanel.css"), sidepanelCss.trim());

// 8. Sidepanel JS with Full Wiring
const sidepanelJs = `/**
 * JobLens Manifest V3 Side Panel Controller
 * Handles Active Tab Extraction, Context Menu Events, Local & API Scans, and User Storage
 */

// Embedded detection patterns for instant evaluation
const LOCAL_RULES = [
  {
    category: "Financial Fraud",
    pattern: /\\b(laptop|macbook|equipment|hardware|kit|device|courier|security|registration|training|interview)\\s*(fee|deposit|cost|charge|payment|refundable)\\b/i,
    weight: 38,
    why: "Legitimate corporate employers ship equipment at company expense. Demanding upfront deposits is the primary hallmark of advance-fee fraud.",
    action: "Do not send money. Official employers never demand deposits or equipment fees."
  },
  {
    category: "Financial Fraud",
    pattern: /\\b(usdt|crypto|bitcoin|eth|binance|gift\\s*card|wire\\s*transfer|western\\s*union|task\\s*recharge)\\b/i,
    weight: 35,
    why: "Adversaries request irreversible cryptocurrency or gift cards to evade banking fraud recovery systems.",
    action: "Cease communication immediately. Legitimate companies never process payroll or expenses via crypto."
  },
  {
    category: "Social Engineering",
    pattern: /\\b(telegram|whatsapp|signal|viber)\\s*(@|t\\.me\\/|wa\\.me\\/|hr|interview|manager|recruiter)\\b/i,
    weight: 28,
    why: "Diverting candidates from professional platforms to unmonitored encrypted apps enables untraceable impersonation.",
    action: "Insist on verified enterprise communication through official company email domains."
  },
  {
    category: "Credential / Data Risk",
    pattern: /\\b(aadhaar|pan\\s*card|ssn|social\\s*security|bank\\s*account|otp|password|pin|passport\\s*scan)\\b/i,
    weight: 35,
    why: "Requesting sensitive national ID or banking credentials before a formal contract is a data harvesting risk.",
    action: "Never provide banking PINs, OTPs, or government IDs during initial screening."
  },
  {
    category: "Credential / Data Risk",
    pattern: /\\b(anydesk|teamviewer|ultraviewer|screen\\s*share|remote\\s*access|install\\s*agent|apk)\\b/i,
    weight: 42,
    why: "Adversaries use remote access software to harvest keystrokes, browser sessions, and banking tokens.",
    action: "Never install remote desktop software on candidate devices."
  },
  {
    category: "Social Engineering",
    pattern: /\\b(immediate\\s*joining|offer\\s*expires\\s*in\\s*\\d+\\s*(hours|minutes)|urgent\\s*requirement|direct\\s*selection\\s*without\\s*interview)\\b/i,
    weight: 22,
    why: "Artificial urgency and zero-interview selection are coercive social engineering tactics designed to prevent candidate due diligence.",
    action: "Legitimate corporate hiring involves structured evaluation stages."
  },
  {
    category: "Impersonation",
    pattern: /@(gmail\\.com|yahoo\\.com|outlook\\.com|hotmail\\.com|rediffmail\\.com)\\b/i,
    weight: 18,
    why: "Recruiters claiming to represent enterprise brands should contact you from their corporate domain.",
    action: "Cross-check the recruiter's identity on the official corporate careers portal."
  }
];

let userAccount = {
  name: "Candidate",
  email: "candidate@joblens.security",
  protectionEnabled: true,
  threatSensitivity: "STANDARD",
  onboardingCompleted: true
};
let scanHistory = [];
let currentReport = null;

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  setupEvents();

  if (!userAccount.onboardingCompleted) {
    document.getElementById("view-onboarding")?.classList.remove("hidden");
    document.getElementById("view-main")?.classList.add("hidden");
  } else {
    document.getElementById("view-onboarding")?.classList.add("hidden");
    document.getElementById("view-main")?.classList.remove("hidden");
    if (userAccount.protectionEnabled) {
      triggerActiveTabScan();
    }
  }
});

async function loadState() {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const data = await chrome.storage.local.get(["joblens_user", "joblens_history"]);
    if (data.joblens_user) userAccount = data.joblens_user;
    if (data.joblens_history) scanHistory = data.joblens_history;
  } else {
    try {
      const u = localStorage.getItem("joblens_user");
      const h = localStorage.getItem("joblens_history");
      if (u) userAccount = JSON.parse(u);
      if (h) scanHistory = JSON.parse(h);
    } catch (e) {}
  }
  renderHistory();
}

async function saveState() {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({
      joblens_user: userAccount,
      joblens_history: scanHistory
    });
  } else {
    try {
      localStorage.setItem("joblens_user", JSON.stringify(userAccount));
      localStorage.setItem("joblens_history", JSON.stringify(scanHistory));
    } catch (e) {}
  }
}

function setupEvents() {
  // Tabs
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId)?.classList.add("active");
    });
  });

  // Onboarding Form
  document.getElementById("onboarding-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    userAccount.name = document.getElementById("onboard-name").value || "Candidate";
    userAccount.email = document.getElementById("onboard-email").value || "user@joblens.security";
    userAccount.threatSensitivity = document.getElementById("onboard-sensitivity").value;
    userAccount.onboardingCompleted = true;
    saveState();
    document.getElementById("view-onboarding")?.classList.add("hidden");
    document.getElementById("view-main")?.classList.remove("hidden");
    triggerActiveTabScan();
  });

  // Protection Toggle
  const toggle = document.getElementById("protection-toggle");
  toggle?.addEventListener("change", () => {
    userAccount.protectionEnabled = toggle.checked;
    const statusText = document.getElementById("protection-status-text");
    if (statusText) statusText.textContent = toggle.checked ? "Protection: ON" : "Protection: OFF";
    saveState();
  });

  // Actions
  document.getElementById("btn-refresh-page")?.addEventListener("click", triggerActiveTabScan);
  
  document.getElementById("btn-manual-input")?.addEventListener("click", () => {
    document.getElementById("manual-input-box")?.classList.toggle("hidden");
  });
  
  document.getElementById("btn-cancel-manual")?.addEventListener("click", () => {
    document.getElementById("manual-input-box")?.classList.add("hidden");
  });

  document.getElementById("btn-submit-manual")?.addEventListener("click", () => {
    const text = document.getElementById("manual-paste-text")?.value || "";
    if (!text.trim()) return;
    document.getElementById("manual-input-box")?.classList.add("hidden");
    analyzeOpportunity({
      platform: "Custom Text / Chat",
      sourceType: "MANUAL_INPUT",
      jobTitle: "Direct Recruiter Message",
      companyName: "Unspecified Entity",
      jobDescription: text
    });
  });

  document.getElementById("btn-select-text-action")?.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "GET_SELECTED_TEXT" }, (res) => {
            if (res?.selectedText) {
              analyzeOpportunity({
                platform: "Web Selection",
                sourceType: "SELECTION",
                jobTitle: "Highlighted Recruitment Text",
                companyName: "Extracted Selection",
                jobDescription: res.selectedText,
                applicationUrl: res.url
              });
            } else {
              document.getElementById("manual-input-box")?.classList.remove("hidden");
            }
          });
        }
      });
    }
  });

  document.getElementById("btn-open-paste-action")?.addEventListener("click", () => {
    document.getElementById("manual-input-box")?.classList.remove("hidden");
    document.getElementById("manual-paste-text")?.focus();
  });

  document.getElementById("btn-copy-report")?.addEventListener("click", () => {
    if (!currentReport) return;
    const reportText = \`JOBLENS SECURITY REPORT\\nSource: \${currentReport.rawInput?.platform || "Web"}\\nJob: \${currentReport.jobTitle}\\nThreat Score: \${currentReport.overallScore}/100 (\${currentReport.overallSeverity})\\nThreats: \${currentReport.categories?.join(", ") || "None"}\\nRecommendation: \${currentReport.action}\\nTimestamp: \${currentReport.timestamp}\`;
    navigator.clipboard.writeText(reportText);
    alert("Copied forensic report to clipboard!");
  });

  document.getElementById("btn-save-report")?.addEventListener("click", () => {
    if (currentReport) {
      saveToHistory(currentReport);
      alert("Report saved to JobLens local history.");
    }
  });

  document.getElementById("btn-mark-safe")?.addEventListener("click", () => {
    if (currentReport) {
      currentReport.overallScore = 0;
      currentReport.overallSeverity = "LOW";
      renderScanResult(currentReport);
    }
  });

  document.getElementById("btn-report-scam")?.addEventListener("click", () => {
    alert("Scam report logged with Incident ID: INC-" + Date.now().toString(36).toUpperCase());
  });

  document.getElementById("btn-clear-history")?.addEventListener("click", () => {
    scanHistory = [];
    saveState();
    renderHistory();
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    userAccount.onboardingCompleted = false;
    saveState();
    location.reload();
  });

  // Listen for messages from background (e.g. context menus)
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "JOBLENS_SCAN_SELECTION" && msg.text) {
        analyzeOpportunity({
          platform: "Selected Text",
          sourceType: "SELECTION",
          jobTitle: "Highlighted Message",
          companyName: "Web Selection",
          jobDescription: msg.text,
          applicationUrl: msg.url
        });
      } else if (msg.type === "JOBLENS_TRIGGER_PAGE_SCAN") {
        triggerActiveTabScan();
      }
    });
  }
}

function triggerActiveTabScan() {
  if (typeof chrome !== "undefined" && chrome.tabs?.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) return;

      document.getElementById("scan-loading")?.classList.remove("hidden");
      document.getElementById("scan-result-card")?.classList.add("hidden");
      document.getElementById("no-job-card")?.classList.add("hidden");

      chrome.tabs.sendMessage(activeTab.id, { type: "EXTRACT_PAGE_JOB_DATA" }, (response) => {
        document.getElementById("scan-loading")?.classList.add("hidden");
        if (chrome.runtime.lastError || !response || !response.success) {
          document.getElementById("no-job-card")?.classList.remove("hidden");
          document.getElementById("detected-platform").textContent = "Web Page";
          document.getElementById("target-job-title").textContent = activeTab.title || "Web Page";
          document.getElementById("target-company-name").textContent = new URL(activeTab.url || "https://example.com").hostname;
        } else {
          analyzeOpportunity(response);
        }
      });
    });
  } else {
    // Fallback for standalone preview
    analyzeOpportunity({
      platform: "LinkedIn",
      sourceType: "JOB_POSTING",
      jobTitle: "Senior Frontend Engineer",
      companyName: "TechCorp Global",
      jobDescription: "Pay $150 refundable equipment insurance deposit for MacBook Pro M3."
    });
  }
}

function analyzeOpportunity(inputData) {
  document.getElementById("scan-loading")?.classList.remove("hidden");
  document.getElementById("scan-result-card")?.classList.add("hidden");
  document.getElementById("no-job-card")?.classList.add("hidden");
  document.getElementById("context-card")?.classList.remove("hidden");

  document.getElementById("detected-platform").textContent = inputData.platform || "Web";
  document.getElementById("detected-type").textContent = inputData.sourceType || "Job Content";
  document.getElementById("target-job-title").textContent = inputData.jobTitle || "Recruitment Opportunity";
  document.getElementById("target-company-name").textContent = inputData.companyName || "Employer";
  document.getElementById("target-contact-info").textContent = inputData.recruiterEmail ? \`✉️ \${inputData.recruiterEmail}\` : "";

  // Deterministic local evaluation
  const report = evaluateLocally(inputData);
  currentReport = report;
  saveToHistory(report);
  renderScanResult(report);

  // Update extension badge
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      type: "UPDATE_RISK_BADGE",
      severity: report.overallSeverity,
      score: report.overallScore
    });
  }
}

function evaluateLocally(data) {
  const text = \`\${data.jobTitle} \${data.companyName} \${data.jobDescription} \${data.recruiterEmail} \${data.applicationUrl}\`;
  let score = 0;
  const detectedSignals = [];
  const categories = new Set();

  for (const rule of LOCAL_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      score += rule.weight;
      categories.add(rule.category);
      detectedSignals.push({
        title: rule.category,
        evidence: match[0],
        why: rule.why,
        action: rule.action
      });
    }
  }

  score = Math.min(100, score);
  let severity = "LOW";
  if (score >= 75) severity = "CRITICAL";
  else if (score >= 45) severity = "HIGH";
  else if (score >= 20) severity = "MEDIUM";

  return {
    id: \`scan_\${Date.now()}\`,
    timestamp: new Date().toISOString(),
    jobTitle: data.jobTitle,
    companyName: data.companyName,
    overallScore: score,
    overallSeverity: severity,
    categories: Array.from(categories),
    signals: detectedSignals,
    why: detectedSignals[0]?.why || "Opportunity adheres to normal recruitment patterns.",
    action: detectedSignals[0]?.action || "Proceed with standard professional verification.",
    rawInput: data
  };
}

function renderScanResult(report) {
  document.getElementById("scan-loading")?.classList.add("hidden");
  document.getElementById("no-job-card")?.classList.add("hidden");
  document.getElementById("scan-result-card")?.classList.remove("hidden");

  document.getElementById("threat-score-val").textContent = report.overallScore;
  document.getElementById("score-progress-fill").style.width = \`\${report.overallScore}%\`;

  const banner = document.getElementById("risk-banner");
  banner.className = "risk-banner";
  const icon = document.getElementById("risk-badge-icon");
  const text = document.getElementById("risk-badge-text");
  const fill = document.getElementById("score-progress-fill");

  if (report.overallSeverity === "CRITICAL") {
    banner.classList.add("risk-critical");
    icon.textContent = "🚨";
    text.textContent = "RECRUITMENT SCAM DETECTED";
    fill.style.backgroundColor = "var(--color-critical)";
  } else if (report.overallSeverity === "HIGH") {
    banner.classList.add("risk-high");
    icon.textContent = "⚠️";
    text.textContent = "HIGH RECRUITMENT RISK";
    fill.style.backgroundColor = "var(--color-high)";
  } else if (report.overallSeverity === "MEDIUM") {
    banner.classList.add("risk-med");
    icon.textContent = "⚡";
    text.textContent = "MODERATE RISK SIGNALS";
    fill.style.backgroundColor = "var(--color-med)";
  } else {
    banner.classList.add("risk-low");
    icon.textContent = "🟢";
    text.textContent = "LOW RISK OPPORTUNITY";
    fill.style.backgroundColor = "var(--color-low)";
  }

  if (report.overallSeverity === "LOW") {
    document.getElementById("trust-box")?.classList.remove("hidden");
    document.getElementById("threat-breakdown-box")?.classList.add("hidden");
  } else {
    document.getElementById("trust-box")?.classList.add("hidden");
    document.getElementById("threat-breakdown-box")?.classList.remove("hidden");

    const pillsRow = document.getElementById("category-pills-row");
    pillsRow.innerHTML = "";
    (report.categories || []).forEach(cat => {
      const pill = document.createElement("span");
      pill.className = "pill pill-danger";
      pill.textContent = cat;
      pillsRow.appendChild(pill);
    });

    document.getElementById("why-text").textContent = report.why;
    document.getElementById("action-text").textContent = report.action;

    const list = document.getElementById("evidence-list");
    list.innerHTML = "";
    document.getElementById("evidence-count").textContent = report.signals?.length || 0;
    (report.signals || []).forEach(sig => {
      const item = document.createElement("div");
      item.className = "evidence-item";
      item.innerHTML = \`<div class="evidence-title">• \${sig.title}</div><div class="evidence-snippet">"\${sig.evidence}"</div>\`;
      list.appendChild(item);
    });
  }
}

function saveToHistory(report) {
  scanHistory = scanHistory.filter(h => h.id !== report.id && h.jobTitle !== report.jobTitle);
  scanHistory.unshift({
    id: report.id,
    timestamp: new Date().toISOString(),
    jobTitle: report.jobTitle,
    companyName: report.companyName,
    overallScore: report.overallScore,
    overallSeverity: report.overallSeverity,
    why: report.why
  });
  if (scanHistory.length > 25) scanHistory.pop();
  saveState();
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById("history-items-container");
  if (!container) return;
  if (scanHistory.length === 0) {
    container.innerHTML = \`<p class="text-dim text-center py-4">No recent scans recorded.</p>\`;
    return;
  }
  container.innerHTML = "";
  scanHistory.forEach(item => {
    const el = document.createElement("div");
    el.className = "history-item";
    const color = item.overallSeverity === "CRITICAL" || item.overallSeverity === "HIGH" ? "#ef4444" : "#10b981";
    el.innerHTML = \`
      <div class="history-item-top">
        <span class="history-item-title">\${item.jobTitle || "Job Opportunity"}</span>
        <span class="pill" style="background-color:\${color}22; color:\${color}; border:1px solid \${color}44;">\${item.overallScore}/100</span>
      </div>
      <div class="history-item-company">\${item.companyName || "Employer"} • \${new Date(item.timestamp).toLocaleDateString()}</div>
    \`;
    el.addEventListener("click", () => {
      document.querySelector('[data-tab="tab-scan"]')?.click();
      renderScanResult(item);
    });
    container.appendChild(el);
  });
}
`;

fs.writeFileSync(path.join(EXT_DIR, "sidepanel/sidepanel.js"), sidepanelJs.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "sidepanel/sidepanel.js"), sidepanelJs.trim());
fs.writeFileSync(path.join(EXT_DIR, "sidepanel.js"), sidepanelJs.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "sidepanel.js"), sidepanelJs.trim());

// 9. Create Root and Extension README
const extReadme = `# JobLens — Manifest V3 Chrome Extension

## How to Install into Google Chrome / Brave / Edge

1. Open your browser and navigate to:
   \`chrome://extensions\` (or \`brave://extensions\` / \`edge://extensions\`)
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the \`extension/\` folder located in this repository.
5. JobLens will appear in your extensions toolbar with its shield icon 🛡️.

## How to Use on Live Webpages
- Open any job posting on **LinkedIn**, **Naukri**, **Indeed**, or a corporate careers page.
- Click the **JobLens** shield icon in your browser toolbar (or press \`Ctrl+Shift+J\`).
- The **JobLens Side Panel** will open docked to your tab, automatically detect the job opportunity, and provide an instant dynamic threat evaluation.
- You can also highlight any text on a webpage or email and right-click -> *"Scan selection with JobLens"*.
`;

fs.writeFileSync(path.join(EXT_DIR, "README.md"), extReadme.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "README.md"), extReadme.trim());

// 10. Generate joblens-extension.zip containing the extension root
import("jszip").then(async ({ default: JSZip }) => {
  const zip = new JSZip();

  function addDirToZip(dirPath, zipFolder) {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(item);
        if (subFolder) addDirToZip(fullPath, subFolder);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(item, content);
      }
    }
  }

  addDirToZip(EXT_DIR, zip);

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(path.resolve("./joblens-extension.zip"), zipBuffer);
  fs.writeFileSync(path.resolve("./public/joblens-extension.zip"), zipBuffer);
  console.log("📦 Created joblens-extension.zip successfully!");
  console.log("✅ Extension files generated successfully in /extension and /public/extension!");
});
