/**
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