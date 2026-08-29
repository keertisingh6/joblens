"use client";

import JSZip from "jszip";

export async function generateExtensionZip(): Promise<Blob> {
  // 1. Try to fetch the pre-built, fully-packaged zip from static public assets
  try {
    const directRes = await fetch("/joblens-extension.zip");
    if (directRes.ok) {
      return await directRes.blob();
    }
  } catch {
    // fallback to dynamic JSZip assembly
  }

  const zip = new JSZip();

  // Extension Manifest V3
  const manifest = {
    manifest_version: 3,
    name: "JobLens - Recruitment Security & Scam Detection",
    version: "2.1.0",
    description: "Proactive browser security layer against recruitment scams, advance-fee fraud, recruiter impersonation, and phishing.",
    permissions: ["sidePanel", "storage", "activeTab", "scripting", "contextMenus"],
    host_permissions: ["<all_urls>"],
    background: { service_worker: "background/service-worker.js" },
    side_panel: { default_path: "sidepanel/sidepanel.html" },
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

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  try {
    const [sidepanelHtml, sidepanelCss, sidepanelJs, contentJs, serviceWorkerJs, readme] = await Promise.all([
      fetch("/extension/sidepanel/sidepanel.html").then(r => r.text()),
      fetch("/extension/sidepanel/sidepanel.css").then(r => r.text()),
      fetch("/extension/sidepanel/sidepanel.js").then(r => r.text()),
      fetch("/extension/content/content.js").then(r => r.text()),
      fetch("/extension/background/service-worker.js").then(r => r.text()),
      fetch("/extension/README.md").then(r => r.text())
    ]);

    zip.file("sidepanel/sidepanel.html", sidepanelHtml);
    zip.file("sidepanel/sidepanel.css", sidepanelCss);
    zip.file("sidepanel/sidepanel.js", sidepanelJs);
    zip.file("content/content.js", contentJs);
    zip.file("background/service-worker.js", serviceWorkerJs);
    zip.file("README.md", readme);

    // Also include root aliases for legacy loaders
    zip.file("sidepanel.html", sidepanelHtml);
    zip.file("sidepanel.css", sidepanelCss);
    zip.file("sidepanel.js", sidepanelJs);
    zip.file("content.js", contentJs);
    zip.file("background.js", serviceWorkerJs);
  } catch {
    zip.file("README.md", "# JobLens Extension\\nLoad unpacked folder in chrome://extensions");
  }

  // Icons
  const iconsFolder = zip.folder("icons");
  if (iconsFolder) {
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="60" fill="#0b1120"/><path d="M64 24 L96 36 V64 C96 84 64 104 64 104 C64 104 32 84 32 64 V36 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="4"/><circle cx="64" cy="60" r="16" fill="none" stroke="#38bdf8" stroke-width="3"/></svg>`;
    iconsFolder.file("icon.svg", iconSvg);
  }

  return await zip.generateAsync({ type: "blob" });
}
