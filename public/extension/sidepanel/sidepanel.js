/**
 * JobLens Manifest V3 Side Panel Controller
 * True Firebase Authentication & Authoritative Deterministic Security Engine
 */

let userAccount = null;
let isAuthenticated = false;
let scanHistory = [];
let incidentLogs = [];
let currentReport = null;

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  setupEvents();
  await loadState();
});

async function loadState() {
  let storedUser = null;

  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const data = await chrome.storage.local.get(["joblens_user", "joblens_history", "joblens_incidents"]);
    storedUser = data.joblens_user;
    if (data.joblens_history) scanHistory = data.joblens_history;
    if (data.joblens_incidents) incidentLogs = data.joblens_incidents;
  } else {
    try {
      const u = localStorage.getItem("joblens_user");
      const h = localStorage.getItem("joblens_history");
      const inc = localStorage.getItem("joblens_incidents");
      if (u) storedUser = JSON.parse(u);
      if (h) scanHistory = JSON.parse(h);
      if (inc) incidentLogs = JSON.parse(inc);
    } catch (e) {}
  }

  if (storedUser && storedUser.uid && storedUser.idToken) {
    userAccount = storedUser;
    isAuthenticated = true;
    showMainView();
    updateUserSessionUI();
    if (userAccount.protectionEnabled) {
      triggerActiveTabScan();
    }
  } else {
    userAccount = null;
    isAuthenticated = false;
    showAuthView();
  }

  renderHistory();
}

async function saveState() {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({
      joblens_user: userAccount,
      joblens_history: scanHistory,
      joblens_incidents: incidentLogs
    });
  } else {
    try {
      if (userAccount) {
        localStorage.setItem("joblens_user", JSON.stringify(userAccount));
      } else {
        localStorage.removeItem("joblens_user");
      }
      localStorage.setItem("joblens_history", JSON.stringify(scanHistory));
      localStorage.setItem("joblens_incidents", JSON.stringify(incidentLogs));
    } catch (e) {}
  }
}

function showAuthView() {
  document.getElementById("view-onboarding")?.classList.remove("hidden");
  document.getElementById("view-main")?.classList.add("hidden");
  hideAuthError();
}

function showMainView() {
  document.getElementById("view-onboarding")?.classList.add("hidden");
  document.getElementById("view-main")?.classList.remove("hidden");
}

function showAuthError(msg) {
  const box = document.getElementById("auth-error-box");
  const text = document.getElementById("auth-error-text");
  if (box && text) {
    text.textContent = msg;
    box.classList.remove("hidden");
  }
}

function hideAuthError() {
  document.getElementById("auth-error-box")?.classList.add("hidden");
}

function updateUserSessionUI() {
  if (!userAccount) return;
  const nameEl = document.getElementById("user-display-name");
  const emailEl = document.getElementById("user-display-email");
  const uidEl = document.getElementById("user-display-uid");
  const badgeEl = document.getElementById("user-session-badge");
  const sensitivitySelect = document.getElementById("settings-sensitivity");

  if (nameEl) nameEl.textContent = userAccount.name || "Candidate User";
  if (emailEl) emailEl.textContent = userAccount.email || "Authenticated";
  if (uidEl) uidEl.textContent = `UID: ${userAccount.uid}`;
  if (badgeEl) {
    if (userAccount.isAnonymous) {
      badgeEl.textContent = "Verified Guest Firebase Session";
      badgeEl.style.color = "#38bdf8";
    } else {
      badgeEl.textContent = "Verified Firebase JWT Account";
      badgeEl.style.color = "#86efac";
    }
  }
  if (sensitivitySelect && userAccount.threatSensitivity) {
    sensitivitySelect.value = userAccount.threatSensitivity;
  }
}

function setupEvents() {
  // Navigation Tabs
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId)?.classList.add("active");
    });
  });

  // Auth View Tab Switching (Sign In vs Sign Up)
  const tabSignIn = document.getElementById("btn-tab-signin");
  const tabSignUp = document.getElementById("btn-tab-signup");
  const formSignIn = document.getElementById("form-signin");
  const formSignUp = document.getElementById("form-signup");

  tabSignIn?.addEventListener("click", () => {
    tabSignIn.classList.add("active");
    tabSignUp?.classList.remove("active");
    formSignIn?.classList.remove("hidden");
    formSignUp?.classList.add("hidden");
    hideAuthError();
  });

  tabSignUp?.addEventListener("click", () => {
    tabSignUp.classList.add("active");
    tabSignIn?.classList.remove("active");
    formSignUp?.classList.remove("hidden");
    formSignIn?.classList.add("hidden");
    hideAuthError();
  });

  // Real Email & Password Sign In
  formSignIn?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAuthError();

    const email = document.getElementById("signin-email")?.value;
    const password = document.getElementById("signin-password")?.value;
    const submitBtn = document.getElementById("btn-submit-signin");

    if (!email || !password) return;

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Authenticating with Firebase...";
      }

      const authService = typeof JobLensAuthService !== "undefined" ? JobLensAuthService : window.JobLensAuthService;
      if (!authService) throw new Error("Authentication service unavailable");

      const authRes = await authService.signInWithEmailPassword(email, password);

      userAccount = {
        uid: authRes.uid,
        name: authRes.name,
        email: authRes.email,
        idToken: authRes.idToken,
        refreshToken: authRes.refreshToken,
        isAnonymous: false,
        threatSensitivity: "STANDARD",
        protectionEnabled: true,
        authenticatedAt: authRes.authenticatedAt
      };
      isAuthenticated = true;

      await saveState();
      updateUserSessionUI();
      showMainView();
      triggerActiveTabScan();
    } catch (err) {
      showAuthError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In with JobLens Account";
      }
    }
  });

  // Real Email & Password Sign Up
  formSignUp?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAuthError();

    const name = document.getElementById("signup-name")?.value;
    const email = document.getElementById("signup-email")?.value;
    const password = document.getElementById("signup-password")?.value;
    const sensitivity = document.getElementById("signup-sensitivity")?.value || "STANDARD";
    const submitBtn = document.getElementById("btn-submit-signup");

    if (!email || !password || !name) return;

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating Firebase Account...";
      }

      const authService = typeof JobLensAuthService !== "undefined" ? JobLensAuthService : window.JobLensAuthService;
      if (!authService) throw new Error("Authentication service unavailable");

      const authRes = await authService.signUpWithEmailPassword(email, password, name);

      userAccount = {
        uid: authRes.uid,
        name: authRes.name,
        email: authRes.email,
        idToken: authRes.idToken,
        refreshToken: authRes.refreshToken,
        isAnonymous: false,
        threatSensitivity: sensitivity,
        protectionEnabled: true,
        authenticatedAt: authRes.authenticatedAt
      };
      isAuthenticated = true;

      await saveState();
      updateUserSessionUI();
      showMainView();
      triggerActiveTabScan();
    } catch (err) {
      showAuthError(err.message || "Registration failed. Please try again.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Verified Candidate Account";
      }
    }
  });

  // Real Guest Anonymous Sign In
  document.getElementById("btn-signin-guest")?.addEventListener("click", async () => {
    hideAuthError();
    const guestBtn = document.getElementById("btn-signin-guest");

    try {
      if (guestBtn) {
        guestBtn.disabled = true;
        guestBtn.textContent = "Authenticating Guest Session...";
      }

      const authService = typeof JobLensAuthService !== "undefined" ? JobLensAuthService : window.JobLensAuthService;
      if (!authService) throw new Error("Authentication service unavailable");

      const authRes = await authService.signInAsGuest();

      userAccount = {
        uid: authRes.uid,
        name: authRes.name,
        email: authRes.email,
        idToken: authRes.idToken,
        refreshToken: authRes.refreshToken,
        isAnonymous: true,
        threatSensitivity: "STANDARD",
        protectionEnabled: true,
        authenticatedAt: authRes.authenticatedAt
      };
      isAuthenticated = true;

      await saveState();
      updateUserSessionUI();
      showMainView();
      triggerActiveTabScan();
    } catch (err) {
      showAuthError(err.message || "Failed to initialize guest security session.");
    } finally {
      if (guestBtn) {
        guestBtn.disabled = false;
        guestBtn.textContent = "⚡ Continue as Guest Candidate";
      }
    }
  });

  // Protection Toggle
  const toggle = document.getElementById("protection-toggle");
  toggle?.addEventListener("change", () => {
    if (!userAccount) return;
    userAccount.protectionEnabled = toggle.checked;
    const statusText = document.getElementById("protection-status-text");
    if (statusText) statusText.textContent = toggle.checked ? "Protection: ON" : "Protection: OFF";
    saveState();
  });

  // Settings Sensitivity Change
  document.getElementById("settings-sensitivity")?.addEventListener("change", (e) => {
    if (userAccount) {
      userAccount.threatSensitivity = e.target.value;
      saveState();
    }
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
      platform: "Custom Text Input",
      sourceType: "RECRUITER_CHAT",
      jobTitle: "Direct Recruiter Message",
      companyName: "Unspecified Entity",
      jobDescription: text
    });
  });

  document.getElementById("btn-select-text-action")?.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          ensureContentScriptInjected(tabs[0].id, () => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "GET_SELECTED_TEXT" }, (res) => {
              if (res?.selectedText) {
                analyzeOpportunity({
                  platform: "Page Text Selection",
                  sourceType: "JOB_POSTING",
                  jobTitle: "Highlighted Recruitment Selection",
                  companyName: "Active Page Selection",
                  jobDescription: res.selectedText,
                  applicationUrl: res.url
                });
              } else {
                document.getElementById("manual-input-box")?.classList.remove("hidden");
                document.getElementById("manual-paste-text")?.focus();
              }
            });
          });
        }
      });
    } else {
      document.getElementById("manual-input-box")?.classList.remove("hidden");
    }
  });

  document.getElementById("btn-open-paste-action")?.addEventListener("click", () => {
    document.getElementById("manual-input-box")?.classList.remove("hidden");
    document.getElementById("manual-paste-text")?.focus();
  });

  document.getElementById("btn-copy-report")?.addEventListener("click", () => {
    if (!currentReport) return;
    const signalsSummary = (currentReport.signals || []).map(s => `• [${s.category}] ${s.title} (${s.contribution} pts): "${s.evidence}"`).join("\n");
    const reportText = `JOBLENS RECRUITMENT SECURITY FORENSIC REPORT\n=========================================\nTarget: ${currentReport.jobTitle}\nEmployer: ${currentReport.companyName}\nSource: ${currentReport.rawInput?.platform || "Web"}\nThreat Score: ${currentReport.overallScore}/100 (${currentReport.overallSeverity})\nUser Override Status: ${currentReport.userStatus || "None"}\n\nEVIDENCE & WHY THIS SCORE:\n${signalsSummary || "No threat signals detected."}\n\nRECOMMENDED DEFENSIVE ACTION:\n${currentReport.action}\n\nGenerated: ${currentReport.timestamp}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      alert("Forensic report copied to clipboard.");
    }
  });

  document.getElementById("btn-save-report")?.addEventListener("click", () => {
    if (currentReport) {
      saveToHistory(currentReport);
      alert("Opportunity evaluation saved to local history.");
    }
  });

  // Mark Safe preserves score and sets status: "MARKED_SAFE"
  document.getElementById("btn-mark-safe")?.addEventListener("click", () => {
    if (!currentReport) return;
    if (currentReport.userStatus === "MARKED_SAFE") {
      currentReport.userStatus = null;
    } else {
      currentReport.userStatus = "MARKED_SAFE";
    }
    saveToHistory(currentReport);
    renderScanResult(currentReport);
  });

  // Create Incident Report
  document.getElementById("btn-report-scam")?.addEventListener("click", () => {
    if (!currentReport) return;
    const incId = `INC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;
    const incident = {
      incidentId: incId,
      timestamp: new Date().toISOString(),
      companyName: currentReport.companyName || "Unspecified Entity",
      jobTitle: currentReport.jobTitle || "Recruitment Opportunity",
      overallScore: currentReport.overallScore,
      severity: currentReport.overallSeverity,
      detectedSignals: currentReport.signals || [],
      sourceUrl: currentReport.rawInput?.applicationUrl || "Direct Text",
      platform: currentReport.rawInput?.platform || "Web"
    };

    incidentLogs.unshift(incident);
    if (incidentLogs.length > 50) incidentLogs.pop();
    saveState();

    alert(`Incident logged to JobLens local threat registry.\n\nIncident ID: ${incId}\nEmployer: ${incident.companyName}\nCalculated Risk: ${incident.overallScore}/100 (${incident.severity})\n\nLocal forensic record created.`);
  });

  document.getElementById("btn-clear-history")?.addEventListener("click", () => {
    scanHistory = [];
    saveState();
    renderHistory();
  });

  // Sign Out / Reset Session
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    userAccount = null;
    isAuthenticated = false;
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.remove(["joblens_user"]);
    }
    try {
      localStorage.removeItem("joblens_user");
    } catch (e) {}

    const emailInp = document.getElementById("signin-email");
    const passInp = document.getElementById("signin-password");
    if (emailInp) emailInp.value = "";
    if (passInp) passInp.value = "";

    showAuthView();

    if (typeof chrome !== "undefined" && chrome.action?.setBadgeText) {
      chrome.action.setBadgeText({ text: "" });
    }
  });

  // Demo Scenarios (Controlled Benchmark Scenarios)
  document.getElementById("btn-demo-advance-fee")?.addEventListener("click", () => {
    document.querySelector('[data-tab="tab-scan"]')?.click();
    analyzeOpportunity({
      isDemoMode: true,
      platform: "Demo: Advance-Fee Scenario",
      sourceType: "JOB_POSTING",
      jobTitle: "Senior DevOps Engineer",
      companyName: "Global Apex Tech",
      recruiterEmail: "recruiter.apex@gmail.com",
      jobDescription: "Congratulations! You have been selected. To receive your MacBook Pro M3 and home workstation hardware, candidates must submit a $250 refundable equipment courier and insurance deposit to our logistics partner within 24 hours."
    });
  });

  document.getElementById("btn-demo-task-scam")?.addEventListener("click", () => {
    document.querySelector('[data-tab="tab-scan"]')?.click();
    analyzeOpportunity({
      isDemoMode: true,
      platform: "Demo: YouTube Task Scam",
      sourceType: "RECRUITER_CHAT",
      jobTitle: "Online Digital Review Specialist",
      companyName: "Prime Marketing Media",
      recruiterEmail: "hiring@yahoo.com",
      jobDescription: "Simple part-time work from home. Like YouTube videos and hotel reviews to earn ₹3,500 daily payout guaranteed. Complete initial tasks and connect on Telegram @PrimeHR for task commission recharge."
    });
  });

  document.getElementById("btn-demo-whatsapp-urgency")?.addEventListener("click", () => {
    document.querySelector('[data-tab="tab-scan"]')?.click();
    analyzeOpportunity({
      isDemoMode: true,
      platform: "Demo: WhatsApp Urgency",
      sourceType: "RECRUITER_CHAT",
      jobTitle: "Data Analyst",
      companyName: "Apex Consultants",
      jobDescription: "Immediate selection without interview! Limited slots left, offer expires in 24 hours. Contact kindly via WhatsApp wa.me/919876543210 to claim your onboarding kit."
    });
  });

  document.getElementById("btn-demo-legit-job")?.addEventListener("click", () => {
    document.querySelector('[data-tab="tab-scan"]')?.click();
    analyzeOpportunity({
      isDemoMode: true,
      platform: "Demo: Legitimate Posting",
      sourceType: "JOB_POSTING",
      jobTitle: "Senior Software Engineer (Distributed Systems)",
      companyName: "Stripe",
      recruiterEmail: "talent@stripe.com",
      applicationUrl: "https://stripe.com/jobs/senior-software-engineer",
      jobDescription: "We are looking for a Senior Software Engineer to design, build, and scale our core payment infrastructure. Responsibilities include architecting high-throughput distributed systems, collaborating with product managers, and mentoring engineers. Qualifications: 5+ years of experience in Java, Go, or Rust, strong foundation in relational databases, and experience with distributed consensus algorithms. Compensation includes base salary, equity, and comprehensive health benefits. Apply through our official careers portal."
    });
  });

  // Listen for messages from background worker
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "JOBLENS_SCAN_SELECTION" && msg.text) {
        document.querySelector('[data-tab="tab-scan"]')?.click();
        analyzeOpportunity({
          platform: "Selected Text",
          sourceType: "RECRUITER_CHAT",
          jobTitle: "Selected Recruitment Message",
          companyName: "Web Selection",
          jobDescription: msg.text,
          applicationUrl: msg.url
        });
      } else if (msg.type === "JOBLENS_TRIGGER_PAGE_SCAN") {
        document.querySelector('[data-tab="tab-scan"]')?.click();
        triggerActiveTabScan();
      }
    });
  }
}

function ensureContentScriptInjected(tabId, callback) {
  if (typeof chrome !== "undefined" && chrome.scripting?.executeScript) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/content.js"]
    }).then(() => {
      callback();
    }).catch(() => {
      // In case already injected or scripting restricted
      callback();
    });
  } else {
    callback();
  }
}

function triggerActiveTabScan() {
  if (typeof chrome !== "undefined" && chrome.tabs?.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id || !activeTab.url || activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("chrome-extension://")) {
        showNoJobState("Active tab scanning requires a public web page (HTTP/HTTPS). Use Custom Text or select text to scan.");
        return;
      }

      document.getElementById("scan-loading")?.classList.remove("hidden");
      document.getElementById("scan-result-card")?.classList.add("hidden");
      document.getElementById("no-job-card")?.classList.add("hidden");

      ensureContentScriptInjected(activeTab.id, () => {
        chrome.tabs.sendMessage(activeTab.id, { type: "EXTRACT_PAGE_JOB_DATA" }, (response) => {
          document.getElementById("scan-loading")?.classList.add("hidden");
          if (chrome.runtime.lastError || !response || !response.success) {
            showNoJobState("JobLens couldn't identify a recruitment opportunity on this page.");
            const platEl = document.getElementById("detected-platform");
            const titleEl = document.getElementById("target-job-title");
            const compEl = document.getElementById("target-company-name");
            if (platEl) platEl.textContent = "Web Page";
            if (titleEl) titleEl.textContent = activeTab.title || "Active Web Page";
            if (compEl) {
              try {
                compEl.textContent = new URL(activeTab.url).hostname;
              } catch (e) {
                compEl.textContent = "Current Web Page";
              }
            }
          } else {
            analyzeOpportunity(response);
          }
        });
      });
    });
  } else {
    showNoJobState("Extension preview mode: Select text or run a demo scenario from the Radar tab.");
  }
}

function showNoJobState(message) {
  document.getElementById("scan-loading")?.classList.add("hidden");
  document.getElementById("scan-result-card")?.classList.add("hidden");
  const noJobCard = document.getElementById("no-job-card");
  if (noJobCard) {
    noJobCard.classList.remove("hidden");
    const p = noJobCard.querySelector("p");
    if (p && message) p.textContent = message;
  }
}

function analyzeOpportunity(inputData) {
  document.getElementById("scan-loading")?.classList.remove("hidden");
  document.getElementById("scan-result-card")?.classList.add("hidden");
  document.getElementById("no-job-card")?.classList.add("hidden");
  document.getElementById("context-card")?.classList.remove("hidden");

  document.getElementById("detected-platform").textContent = inputData.platform || "Web";
  document.getElementById("detected-type").textContent = inputData.sourceType || "Recruitment Content";
  document.getElementById("target-job-title").textContent = inputData.jobTitle || "Recruitment Opportunity";
  document.getElementById("target-company-name").textContent = inputData.companyName || "Unspecified Entity";
  document.getElementById("target-contact-info").textContent = inputData.recruiterEmail ? `✉️ ${inputData.recruiterEmail}` : "";

  // Call Authoritative Single Source of Truth Security Engine
  let report;
  if (typeof JobLensSecurityEngine !== "undefined" && JobLensSecurityEngine.runSecurityEvaluation) {
    report = JobLensSecurityEngine.runSecurityEvaluation(inputData);
  } else if (typeof window !== "undefined" && window.JobLensSecurityEngine?.runSecurityEvaluation) {
    report = window.JobLensSecurityEngine.runSecurityEvaluation(inputData);
  } else {
    report = {
      id: `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      jobTitle: inputData.jobTitle || "Recruitment Opportunity",
      companyName: inputData.companyName || "Unspecified Entity",
      overallScore: 0,
      overallSeverity: "LOW",
      categories: [],
      signals: [],
      trustAdjustments: [],
      compoundInteractions: [],
      attackChain: [],
      why: "Evaluated with local security heuristics.",
      action: "Verify recruiter credentials through official channels.",
      rawInput: inputData
    };
  }

  if (inputData.isDemoMode) {
    report.isDemoMode = true;
  }

  currentReport = report;
  saveToHistory(report);
  renderScanResult(report);

  // Update extension action badge
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      type: "UPDATE_RISK_BADGE",
      severity: report.overallSeverity,
      score: report.overallScore
    }).catch(() => {});
  }
}

function renderScanResult(report) {
  document.getElementById("scan-loading")?.classList.add("hidden");
  document.getElementById("no-job-card")?.classList.add("hidden");
  document.getElementById("scan-result-card")?.classList.remove("hidden");

  // Demo Banner
  const demoBanner = document.getElementById("demo-mode-banner");
  if (demoBanner) {
    if (report.isDemoMode) demoBanner.classList.remove("hidden");
    else demoBanner.classList.add("hidden");
  }

  // User Status Override Banner
  const statusBanner = document.getElementById("user-status-banner");
  const markSafeBtn = document.getElementById("btn-mark-safe");
  if (statusBanner) {
    if (report.userStatus === "MARKED_SAFE") {
      statusBanner.classList.remove("hidden");
      const detail = document.getElementById("user-status-detail");
      if (detail) detail.textContent = `Original calculated risk score: ${report.overallScore}/100 (${report.overallSeverity}). Forensic audit trail preserved.`;
      if (markSafeBtn) markSafeBtn.textContent = "Unmark Safe";
    } else {
      statusBanner.classList.add("hidden");
      if (markSafeBtn) markSafeBtn.textContent = "Mark Safe";
    }
  }

  document.getElementById("threat-score-val").textContent = report.overallScore;
  const progressFill = document.getElementById("score-progress-fill");
  if (progressFill) progressFill.style.width = `${report.overallScore}%`;

  const banner = document.getElementById("risk-banner");
  banner.className = "risk-banner";
  const icon = document.getElementById("risk-badge-icon");
  const text = document.getElementById("risk-badge-text");

  if (report.overallSeverity === "CRITICAL") {
    banner.classList.add("risk-critical");
    if (icon) icon.textContent = "🚨";
    if (text) text.textContent = "HIGH-RISK FRAUD SIGNALS DETECTED";
    if (progressFill) progressFill.style.backgroundColor = "var(--color-critical)";
  } else if (report.overallSeverity === "HIGH") {
    banner.classList.add("risk-high");
    if (icon) icon.textContent = "⚠️";
    if (text) text.textContent = "SUSPICIOUS RECRUITMENT PATTERNS";
    if (progressFill) progressFill.style.backgroundColor = "var(--color-high)";
  } else if (report.overallSeverity === "MEDIUM") {
    banner.classList.add("risk-med");
    if (icon) icon.textContent = "⚡";
    if (text) text.textContent = "MODERATE RISK INDICATORS";
    if (progressFill) progressFill.style.backgroundColor = "var(--color-med)";
  } else {
    banner.classList.add("risk-low");
    if (icon) icon.textContent = "🟢";
    if (text) text.textContent = "LOW-RISK OPPORTUNITY";
    if (progressFill) progressFill.style.backgroundColor = "var(--color-low)";
  }

  if (report.overallSeverity === "LOW" && (!report.signals || report.signals.length === 0)) {
    document.getElementById("trust-box")?.classList.remove("hidden");
    document.getElementById("threat-breakdown-box")?.classList.add("hidden");
  } else {
    document.getElementById("trust-box")?.classList.add("hidden");
    document.getElementById("threat-breakdown-box")?.classList.remove("hidden");

    // Category pills
    const pillsRow = document.getElementById("category-pills-row");
    if (pillsRow) {
      pillsRow.innerHTML = "";
      (report.categories || []).forEach(cat => {
        const pill = document.createElement("span");
        pill.className = "pill pill-danger";
        pill.textContent = cat;
        pillsRow.appendChild(pill);
      });
    }

    // Explainable Evidence Breakdown
    const signalsContainer = document.getElementById("why-signals-breakdown");
    if (signalsContainer) {
      signalsContainer.innerHTML = "";
      if (report.signals && report.signals.length > 0) {
        report.signals.forEach(sig => {
          const card = document.createElement("div");
          card.className = "why-signal-card";
          
          let sevColor = "#ef4444";
          if (sig.severity === "MEDIUM") sevColor = "#eab308";
          if (sig.severity === "LOW") sevColor = "#10b981";

          card.innerHTML = `
            <div class="why-signal-header">
              <span class="why-signal-title">
                <span style="color:${sevColor}">●</span> ${sig.title}
              </span>
              <span class="why-signal-weight">+${sig.weight} pts</span>
            </div>
            <div class="why-signal-evidence">"${sig.evidence}"</div>
            <div class="why-signal-why">${sig.why}</div>
          `;
          signalsContainer.appendChild(card);
        });
      } else {
        signalsContainer.innerHTML = `<p class="text-xs text-dim">No high-risk detection rules triggered.</p>`;
      }
    }

    // Compound Multipliers
    const compoundBox = document.getElementById("compound-box");
    const compoundList = document.getElementById("compound-list");
    if (compoundBox && compoundList) {
      if (report.compoundInteractions && report.compoundInteractions.length > 0) {
        compoundBox.classList.remove("hidden");
        compoundList.innerHTML = "";
        report.compoundInteractions.forEach(c => {
          const item = document.createElement("div");
          item.className = "compound-item";
          item.innerHTML = `<span>⚠️ ${c.title}</span><strong>${c.adjustment}</strong>`;
          compoundList.appendChild(item);
        });
      } else {
        compoundBox.classList.add("hidden");
      }
    }

    // Positive Trust Adjustments
    const adjustmentsBox = document.getElementById("adjustments-box");
    const adjustmentsList = document.getElementById("adjustments-list");
    if (adjustmentsBox && adjustmentsList) {
      if (report.trustAdjustments && report.trustAdjustments.length > 0) {
        adjustmentsBox.classList.remove("hidden");
        adjustmentsList.innerHTML = "";
        report.trustAdjustments.forEach(t => {
          const item = document.createElement("div");
          item.className = "adjustment-item";
          item.innerHTML = `<span>🟢 ${t.title} (${t.evidence})</span><strong>${t.adjustment}</strong>`;
          adjustmentsList.appendChild(item);
        });
      } else {
        adjustmentsBox.classList.add("hidden");
      }
    }

    const actionText = document.getElementById("action-text");
    if (actionText) actionText.textContent = report.action;
  }
}

function saveToHistory(report) {
  scanHistory = scanHistory.filter(h => h.id !== report.id && h.jobTitle !== report.jobTitle);
  scanHistory.unshift({
    id: report.id,
    timestamp: report.timestamp || new Date().toISOString(),
    jobTitle: report.jobTitle,
    companyName: report.companyName,
    overallScore: report.overallScore,
    overallSeverity: report.overallSeverity,
    userStatus: report.userStatus,
    why: report.why,
    signals: report.signals,
    categories: report.categories,
    trustAdjustments: report.trustAdjustments,
    compoundInteractions: report.compoundInteractions,
    action: report.action,
    rawInput: report.rawInput
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
    const statusNote = item.userStatus === "MARKED_SAFE" ? " • <span style='color:#86efac'>Marked Safe</span>" : "";
    el.innerHTML = `
      <div class="history-item-top">
        <span class="history-item-title">${item.jobTitle || "Job Opportunity"}</span>
        <span class="pill" style="background-color:${color}22; color:${color}; border:1px solid ${color}44;">${item.overallScore}/100</span>
      </div>
      <div class="history-item-company">${item.companyName || "Employer"}${statusNote} • ${new Date(item.timestamp).toLocaleDateString()}</div>
    `;
    el.addEventListener("click", () => {
      document.querySelector('[data-tab="tab-scan"]')?.click();
      currentReport = item;
      renderScanResult(item);
    });
    container.appendChild(el);
  });
}
