// InterviewAI — Background Service Worker
// Manages extension state across tabs

// ─── Message Handlers ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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

// ─── Keep Service Worker Alive ────────────────────────────────────────────────
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();
