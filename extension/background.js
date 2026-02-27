// InterviewAI — Background Service Worker
// Handles tab audio capture (must run in background context)
// and manages extension state across tabs

let activeStream = null;
let activeTabId = null;

// ─── Tab Audio Capture ───────────────────────────────────────────────────────
// content.js cannot call tabCapture directly — must go through background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TAB_STREAM") {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ error: "No tab ID found" });
      return true;
    }

    // Only one active capture at a time
    if (activeStream && activeTabId === tabId) {
      sendResponse({ error: "Already capturing this tab" });
      return true;
    }

    chrome.tabCapture.capture(
      { audio: true, video: false },
      (stream) => {
        if (chrome.runtime.lastError) {
          console.error(
            "[InterviewAI] tabCapture error:",
            chrome.runtime.lastError.message
          );
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        if (!stream) {
          sendResponse({ error: "No stream returned from tabCapture" });
          return;
        }

        activeStream = stream;
        activeTabId = tabId;

        // Pass stream ID back to content script
        // We store it and let content.js retrieve audio via MediaStream
        // Chrome doesn't allow passing MediaStream directly via message
        // Instead we use a shared audio context approach via offscreen
        sendResponse({ success: true, streamId: tabId });
      }
    );
    return true; // keep channel open for async response
  }

  if (msg.type === "GET_STORED_STREAM") {
    if (activeStream && activeTabId === msg.tabId) {
      // We can't transfer MediaStream via messages
      // Signal that stream is ready for content.js to access
      sendResponse({ ready: true });
    } else {
      sendResponse({ ready: false });
    }
    return true;
  }

  if (msg.type === "STOP_CAPTURE") {
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
      activeStream = null;
      activeTabId = null;
    }
    sendResponse({ success: true });
    return true;
  }

  if (msg.type === "UPDATE_BADGE") {
    const tabId = msg.tabId || sender.tab?.id;
    if (tabId) {
      chrome.action.setBadgeText({
        text: msg.text || "",
        tabId,
      });
      chrome.action.setBadgeBackgroundColor({
        color: msg.color || "#22c55e",
        tabId,
      });
    }
    return true;
  }
});

// ─── Extension Install / Update ──────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open onboarding page on first install
    chrome.tabs.create({
      url: "https://interviewcoach.base44.app/Settings",
    });
  }
});

// ─── Keep Service Worker Alive During Active Session ─────────────────────────
chrome.alarms.create("keepAlive", { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    // Ping to keep service worker active
    chrome.storage.local.get("sessionActive", () => {});
  }
});
