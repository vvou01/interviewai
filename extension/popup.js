// InterviewAI — Popup Script
// Handles auth token storage, session ID input, start/stop controls

(async () => {
  // ─── State ──────────────────────────────────────────────────────────────
  let authToken = null;
  let currentUser = null;
  let isSessionActive = false;
  let currentSessionId = null;

  // ─── DOM References ──────────────────────────────────────────────────────
  const notConnected = document.getElementById("not-connected");
  const connected = document.getElementById("connected");
  const tokenInput = document.getElementById("token-input");
  const connectBtn = document.getElementById("connect-btn");
  const sessionIdInput = document.getElementById("session-id-input");
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const errorMsg = document.getElementById("error-msg");
  const sessionSetup = document.getElementById("session-setup");
  const sessionActive = document.getElementById("session-active");
  const headerDot = document.getElementById("header-dot");
  const headerStatusText = document.getElementById("header-status-text");
  const userEmail = document.getElementById("user-email");
  const userPlan = document.getElementById("user-plan");
  const userAvatar = document.getElementById("user-avatar");
  const activeSessionId = document.getElementById("active-session-id");

  // ─── Init ────────────────────────────────────────────────────────────────
  await init();

  async function init() {
    // Load stored auth token
    const stored = await chrome.storage.local.get([
      "authToken",
      "userEmail",
      "userPlan",
      "sessionActive",
      "sessionId",
    ]);

    if (stored.authToken) {
      authToken = stored.authToken;
      // Verify token is still valid
      const user = await verifyToken(stored.authToken);
      if (user) {
        currentUser = user;
        showConnectedState(user);

        if (stored.sessionActive && stored.sessionId) {
          isSessionActive = true;
          currentSessionId = stored.sessionId;
          showActiveSession(stored.sessionId);
        }
      } else {
        // Token expired or invalid
        await clearAuth();
        showNotConnectedState();
      }
    } else {
      showNotConnectedState();
    }
  }

  // ─── Auth Token Verification ─────────────────────────────────────────────
  async function verifyToken(token) {
    try {
      const response = await fetch(
        `${CONFIG.BASE_URL}/api/apps/${CONFIG.APP_ID}/entities/User/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-App-Id": CONFIG.APP_ID,
          },
          signal: AbortSignal.timeout(CONFIG.API_TIMEOUT_MS),
        }
      );

      if (!response.ok) return null;

      const user = await response.json();

      return {
        email: user.email || "Connected",
        plan: user.plan || "free",
        full_name: user.full_name || "User",
      };
    } catch (e) {
      console.warn("[InterviewAI] Token verification failed:", e.message);
      return null;
    }
  }

  // ─── Connect Account ──────────────────────────────────────────────────────
  connectBtn.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      showError("Please paste your API token");
      return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";
    hideError();

    const user = await verifyToken(token);

    if (!user) {
      showError("Invalid token. Get your token from InterviewAI Settings.");
      connectBtn.disabled = false;
      connectBtn.textContent = "Connect Account";
      return;
    }

    // Store token and user info
    authToken = token;
    currentUser = user;

    await chrome.storage.local.set({
      authToken: token,
      userEmail: user.email,
      userPlan: user.plan || "free",
    });

    connectBtn.disabled = false;
    connectBtn.textContent = "Connect Account";
    showConnectedState(user);
  });

  // ─── Session ID Input ─────────────────────────────────────────────────────
  sessionIdInput.addEventListener("input", () => {
    const val = sessionIdInput.value.trim();
    startBtn.disabled = val.length < 5;
  });

  sessionIdInput.addEventListener("paste", (e) => {
    setTimeout(() => {
      const val = sessionIdInput.value.trim();
      startBtn.disabled = val.length < 5;
    }, 50);
  });

  // ─── Start Session ────────────────────────────────────────────────────────
  startBtn.addEventListener("click", async () => {
    const sessionId = sessionIdInput.value.trim();
    if (!sessionId) return;

    startBtn.disabled = true;
    startBtn.textContent = "Starting...";
    hideError();

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        showError("No active tab found. Open your meeting first.");
        startBtn.disabled = false;
        startBtn.textContent = "Start Coaching Session";
        return;
      }

      // Check if tab is a supported meeting platform
      const supportedUrls = [
        "meet.google.com",
        "teams.microsoft.com",
        "zoom.us",
        "app.zoom.us",
      ];

      const isSupported = supportedUrls.some((url) =>
        tab.url?.includes(url)
      );

      if (!isSupported) {
        showError(
          "Please navigate to Google Meet, Teams, or Zoom first, then try again."
        );
        startBtn.disabled = false;
        startBtn.textContent = "Start Coaching Session";
        return;
      }

      // Get Deepgram key from storage or prompt
      const stored = await chrome.storage.local.get(["deepgramApiKey"]);
      const deepgramApiKey = stored.deepgramApiKey;

      if (!deepgramApiKey) {
        showError(
          "Deepgram API key not configured. Contact support or check Settings."
        );
        startBtn.disabled = false;
        startBtn.textContent = "Start Coaching Session";
        return;
      }

      // Send start message to content script
      await chrome.tabs.sendMessage(tab.id, {
        type: "START_SESSION",
        sessionId,
        authToken,
        deepgramApiKey,
      });

      // Store active session state
      isSessionActive = true;
      currentSessionId = sessionId;

      await chrome.storage.local.set({
        sessionActive: true,
        sessionId,
      });

      showActiveSession(sessionId);
    } catch (err) {
      console.error("[InterviewAI] Start session error:", err);
      showError(
        "Could not start session. Make sure the extension is active on the meeting tab."
      );
      startBtn.disabled = false;
      startBtn.textContent = "Start Coaching Session";
    }
  });

  // ─── Stop Session ─────────────────────────────────────────────────────────
  stopBtn.addEventListener("click", async () => {
    stopBtn.disabled = true;
    stopBtn.textContent = "Stopping...";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { type: "STOP_SESSION" });
      }

      await chrome.storage.local.remove(["sessionActive", "sessionId"]);
      isSessionActive = false;
      currentSessionId = null;

      showSessionSetup();
    } catch (err) {
      console.warn("[InterviewAI] Stop session error:", err);
    }

    stopBtn.disabled = false;
    stopBtn.textContent = "Stop Session";
  });

  // ─── Logout ───────────────────────────────────────────────────────────────
  logoutBtn.addEventListener("click", async () => {
    await clearAuth();
    showNotConnectedState();
  });

  async function clearAuth() {
    authToken = null;
    currentUser = null;
    isSessionActive = false;
    currentSessionId = null;

    await chrome.storage.local.remove([
      "authToken",
      "userEmail",
      "userPlan",
      "sessionActive",
      "sessionId",
    ]);
  }

  // ─── UI State Functions ───────────────────────────────────────────────────
  function showNotConnectedState() {
    notConnected.style.display = "block";
    connected.style.display = "none";
    setHeaderStatus("inactive", "Not connected");
  }

  function showConnectedState(user) {
    notConnected.style.display = "none";
    connected.style.display = "block";

    // User info
    userEmail.textContent = user.email || "Connected";
    userPlan.textContent =
      user.plan === "pro_plus"
        ? "Pro+ Plan"
        : user.plan === "pro"
        ? "Pro Plan"
        : "Free Plan";

    // Avatar initials
    const name = user.full_name || user.email || "U";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    userAvatar.textContent = initials;

    // Store plan for overlay
    chrome.storage.local.set({ userPlan: user.plan || "free" });

    setHeaderStatus("ready", "Ready");
    showSessionSetup();
  }

  function showActiveSession(sessionId) {
    sessionSetup.style.display = "none";
    sessionActive.style.display = "block";
    activeSessionId.textContent = `Session: ${sessionId.slice(0, 12)}...`;
    setHeaderStatus("live", "Live");
  }

  function showSessionSetup() {
    sessionSetup.style.display = "block";
    sessionActive.style.display = "none";
    sessionIdInput.value = "";
    startBtn.disabled = true;
    startBtn.textContent = "Start Coaching Session";
    setHeaderStatus("ready", "Ready");
  }

  function setHeaderStatus(state, text) {
    headerStatusText.textContent = text;
    headerDot.className = "status-dot";
    if (state === "live") headerDot.classList.add("live");
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
  }

  function hideError() {
    errorMsg.style.display = "none";
  }
})();
