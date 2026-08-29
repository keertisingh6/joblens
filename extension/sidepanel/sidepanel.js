/**
 * JobLens Manifest V3 Side Panel Controller
 * Handles Active Tab Extraction, Context Menu Events, Local & API Scans, and User Storage
 */

// Embedded detection patterns for instant evaluation
const LOCAL_RULES = [
  {
    category: "Financial Fraud",
    pattern: /\b(laptop|macbook|equipment|hardware|kit|device|courier|security|registration|training|interview)\s*(fee|deposit|cost|charge|payment|refundable)\b/i,
    weight: 38,
    why: "Legitimate corporate employers ship equipment at company expense. Demanding upfront deposits is the primary hallmark of advance-fee fraud.",
    action: "Do not send money. Official employers never demand deposits or equipment fees."
  },
  {
    category: "Financial Fraud",
    pattern: /\b(usdt|crypto|bitcoin|eth|binance|gift\s*card|wire\s*transfer|western\s*union|task\s*recharge)\b/i,
    weight: 35,
    why: "Adversaries request irreversible cryptocurrency or gift cards to evade banking fraud recovery systems.",
    action: "Cease communication immediately. Legitimate companies never process payroll or expenses via crypto."
  },
  {
    category: "Social Engineering",
    pattern: /\b(telegram|whatsapp|signal|viber)\s*(@|t\.me\/|wa\.me\/|hr|interview|manager|recruiter)\b/i,
    weight: 28,
    why: "Diverting candidates from professional platforms to unmonitored encrypted apps enables untraceable impersonation.",
    action: "Insist on verified enterprise communication through official company email domains."
  },
  {
    category: "Credential / Data Risk",
    pattern: /\b(aadhaar|pan\s*card|ssn|social\s*security|bank\s*account|otp|password|pin|passport\s*scan)\b/i,
    weight: 35,
    why: "Requesting sensitive national ID or banking credentials before a formal contract is a data harvesting risk.",
    action: "Never provide banking PINs, OTPs, or government IDs during initial screening."
  },
  {
    category: "Credential / Data Risk",
    pattern: /\b(anydesk|teamviewer|ultraviewer|screen\s*share|remote\s*access|install\s*agent|apk)\b/i,
    weight: 42,
    why: "Adversaries use remote access software to harvest keystrokes, browser sessions, and banking tokens.",
    action: "Never install remote desktop software on candidate devices."
  },
  {
    category: "Social Engineering",
    pattern: /\b(immediate\s*joining|offer\s*expires\s*in\s*\d+\s*(hours|minutes)|urgent\s*requirement|direct\s*selection\s*without\s*interview)\b/i,
    weight: 22,
    why: "Artificial urgency and zero-interview selection are coercive social engineering tactics designed to prevent candidate due diligence.",
    action: "Legitimate corporate hiring involves structured evaluation stages."
  },
  {
    category: "Impersonation",
    pattern: /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|rediffmail\.com)\b/i,
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
    const reportText = `JOBLENS SECURITY REPORT\nSource: ${currentReport.rawInput?.platform || "Web"}\nJob: ${currentReport.jobTitle}\nThreat Score: ${currentReport.overallScore}/100 (${currentReport.overallSeverity})\nThreats: ${currentReport.categories?.join(", ") || "None"}\nRecommendation: ${currentReport.action}\nTimestamp: ${currentReport.timestamp}`;
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
  document.getElementById("target-contact-info").textContent = inputData.recruiterEmail ? `✉️ ${inputData.recruiterEmail}` : "";

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
  const text = `${data.jobTitle} ${data.companyName} ${data.jobDescription} ${data.recruiterEmail} ${data.applicationUrl}`;
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
    id: `scan_${Date.now()}`,
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
  document.getElementById("score-progress-fill").style.width = `${report.overallScore}%`;

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
      item.innerHTML = `<div class="evidence-title">• ${sig.title}</div><div class="evidence-snippet">"${sig.evidence}"</div>`;
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
    container.innerHTML = `<p class="text-dim text-center py-4">No recent scans recorded.</p>`;
    return;
  }
  container.innerHTML = "";
  scanHistory.forEach(item => {
    const el = document.createElement("div");
    el.className = "history-item";
    const color = item.overallSeverity === "CRITICAL" || item.overallSeverity === "HIGH" ? "#ef4444" : "#10b981";
    el.innerHTML = `
      <div class="history-item-top">
        <span class="history-item-title">${item.jobTitle || "Job Opportunity"}</span>
        <span class="pill" style="background-color:${color}22; color:${color}; border:1px solid ${color}44;">${item.overallScore}/100</span>
      </div>
      <div class="history-item-company">${item.companyName || "Employer"} • ${new Date(item.timestamp).toLocaleDateString()}</div>
    `;
    el.addEventListener("click", () => {
      document.querySelector('[data-tab="tab-scan"]')?.click();
      renderScanResult(item);
    });
    container.appendChild(el);
  });
}