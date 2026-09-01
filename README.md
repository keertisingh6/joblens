# JobLens — Recruitment Cybersecurity & Scam Defense Engine

> **Proactive browser-based recruitment security layer and forensic intelligence center designed to protect job seekers from fake jobs, advance-fee fraud, recruiter impersonation, and identity harvesting.**

---

## 🌟 Live Demo & Deployment

- **Live Deployment Link:** [https://ais-pre-5ufyuiwdsmfxghvka26pry-1075863191730.asia-southeast1.run.app](https://ais-pre-5ufyuiwdsmfxghvka26pry-1075863191730.asia-southeast1.run.app)
- **Built for:** Hackathon Recruitment Security & Cybersecurity Track

---

## 🛡️ Problem Statement & Solution

Job recruitment fraud is one of the fastest-growing cyber threats targeting vulnerable job seekers. Attackers impersonate legitimate brands, solicit upfront fees for "laptop couriers" or "background checks", run malicious commission-recharge task scams, and harvest government ID credentials (Aadhaar/PAN/SSN).

**JobLens** solves this through a dual-engine architecture:
1. **Manifest V3 Chrome Extension**: Real-time side panel and on-page scanner with True Firebase Authentication that intercepts fraudulent recruitment patterns across LinkedIn, Indeed, Naukri, Glassdoor, Webmail, and ATS platforms.
2. **Web Forensic Intelligence Hub**: A full-featured web application offering a live interactive extension simulator, explainable risk breakdown engine, incident logging registry, and candidate protection protocols.

---

## ✨ Key Features & Capabilities

- 🔍 **Authoritative Single-Source Threat Engine**:
  - Deterministic, multi-dimensional risk matrix (0–100 threat score).
  - 8 core threat vectors: Advance-fee equipment fraud, Telegram/WhatsApp task commission schemes, impersonated recruiter domains, credential harvesting, remote access RAT lures, and artificial urgency.
  - Explainable evidence breakdown with exact score contributions.
  - Compound multiplier detection & positive trust adjustments.
- 🔐 **True Firebase Authentication**:
  - Direct Firebase Auth integration with JWT token verification.
  - Candidate Sign In, Sign Up with profile sync, and friction-free Guest Candidate sessions.
- 📦 **One-Click Extension Export**:
  - Generates a ready-to-load Chrome Manifest V3 extension package with custom permissions, background service worker, side panel, and content script.
- 🚨 **Incident Logging & Forensic Audit**:
  - Structured forensic reporting with unique Incident IDs (`INC-YYYYMM-...`) for evidence export.
  - Candidate override mechanism preserving forensic audit trails while marking opportunities safe.

---

## 🏗️ Tech Stack

- **Frontend & Full-Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Extension**: Chrome Extensions Manifest V3 (Side Panel API, Scripting, Storage, Content Scripts)
- **Authentication**: Firebase Authentication (REST API + JWT verification)
- **Persistence**: Google Cloud Firestore & local chrome storage
- **UI Components & Icons**: Lucide React, Radix UI primitives, Motion

---

## 🚀 Getting Started

### 1. Web Application

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Loading the Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select the `extension` directory from this repository (or download the ZIP package directly from the web app).
4. Pin the JobLens extension and click the shield icon or press `Ctrl+Shift+J` (`Cmd+Shift+J` on Mac) to open the Security Side Panel!

---

## 📜 Available Scripts

- `npm run dev` — Starts Next.js development server
- `npm run build` — Compiles production Next.js build and builds static extension assets
- `npm run start` — Runs the production server
- `npm run lint` — Validates TypeScript and ESLint standards

---

## 🔒 Privacy & Permissions

JobLens strictly adheres to the principle of least privilege. Permissions are scoped strictly to verified hiring portals, webmail, and corporate ATS systems, ensuring zero passive tracking of unrelated browsing.
