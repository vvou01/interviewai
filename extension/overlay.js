// InterviewAI — Overlay UI
// Injects a floating coaching panel into the meeting page
// Uses Shadow DOM to isolate styles from the host page

(function () {
  // Prevent double injection
  if (document.getElementById("interviewai-root")) return;

  // ─── State ────────────────────────────────────────────────────────────────
  let currentState = "idle"; // idle | connecting | active | reconnecting | error | hidden
  let isMinimized = false;
  let isHidden = false;
  let currentSuggestion = null;
  let isSalaryMode = false;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let transcriptLines = [];
  let userPlan = "free";

  // ─── Inject Overlay Container ─────────────────────────────────────────────
  const root = document.createElement("div");
  root.id = "interviewai-root";
  document.body.appendChild(root);

  // Load CSS
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = chrome.runtime.getURL("styles/overlay.css");
  document.head.appendChild(cssLink);

  // ─── Build Panel HTML ─────────────────────────────────────────────────────
  function buildPanel() {
    root.innerHTML = `
      <div class="iai-panel" id="iai-panel">
        <!-- Header -->
        <div class="iai-header" id="iai-header">
          <div class="iai-header-left">
            <div class="iai-status-dot" id="iai-dot"></div>
            <span id="iai-status-text">InterviewAI</span>
          </div>
          <div class="iai-header-actions">
            <button class="iai-btn-icon" id="iai-minimize-btn" title="Minimize (Alt+M)">─</button>
            <button class="iai-btn-icon" id="iai-hide-btn" title="Hide (Alt+H)">✕</button>
          </div>
        </div>

        <!-- Body -->
        <div class="iai-body" id="iai-body">
          <div id="iai-content">
            <div class="iai-waiting">
              <div class="iai-waiting-icon">🎤</div>
              <div>Waiting for session to start...</div>
            </div>
          </div>
        </div>

        <!-- Transcript Strip -->
        <div class="iai-transcript-strip" id="iai-transcript-strip" style="display:none"></div>

        <!-- Keyboard hint -->
        <div class="iai-shortcut-hint">Alt+H hide · Alt+M minimize · Alt+S salary mode</div>
      </div>
    `;

    // Dragging
    setupDragging();

    // Buttons
    document.getElementById("iai-minimize-btn").onclick = toggleMinimize;
    document.getElementById("iai-hide-btn").onclick = toggleHide;

    // Restore position from storage
    chrome.storage.local.get(["overlayX", "overlayY"], (data) => {
      if (data.overlayX !== undefined) {
        root.style.left = data.overlayX + "px";
        root.style.top = data.overlayY + "px";
        root.style.right = "auto";
      }
    });
  }

  // ─── Dragging ─────────────────────────────────────────────────────────────
  function setupDragging() {
    const header = document.getElementById("iai-header");
    if (!header) return;

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = root.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const x = e.clientX - dragOffsetX;
      const y = e.clientY - dragOffsetY;
      root.style.left = Math.max(0, Math.min(window.innerWidth - 340, x)) + "px";
      root.style.top = Math.max(0, Math.min(window.innerHeight - 100, y)) + "px";
      root.style.right = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        // Save position
        chrome.storage.local.set({
          overlayX: parseInt(root.style.left),
          overlayY: parseInt(root.style.top),
        });
      }
    });
  }

  // ─── State Management ─────────────────────────────────────────────────────
  function setState(state, message = "") {
    currentState = state;
    const dot = document.getElementById("iai-dot");
    const statusText = document.getElementById("iai-status-text");
    const content = document.getElementById("iai-content");
    if (!dot || !statusText || !content) return;

    dot.className = "iai-status-dot";

    switch (state) {
      case "idle":
        statusText.textContent = "InterviewAI · Ready";
        content.innerHTML = `
          <div class="iai-waiting">
            <div class="iai-waiting-icon">🎤</div>
            <div>Activate via extension popup to begin</div>
          </div>`;
        break;

      case "connecting":
        dot.classList.add("iai-connecting");
        statusText.textContent = "Connecting...";
        content.innerHTML = `
          <div class="iai-waiting">
            <div class="iai-waiting-icon">⚡</div>
            <div>Setting up audio capture...</div>
          </div>`;
        break;

      case "active":
        dot.classList.add("iai-active");
        statusText.textContent = "Live · Coaching Active";
        if (!currentSuggestion) {
          content.innerHTML = `
            <div class="iai-waiting">
              <div class="iai-waiting-icon">👂</div>
              <div>Waiting for interviewer...</div>
            </div>`;
        }
        break;

      case "reconnecting":
        dot.classList.add("iai-connecting");
        statusText.textContent = "Reconnecting...";
        content.innerHTML = `
          <div class="iai-waiting">
            <div class="iai-waiting-icon">🔄</div>
            <div>Connection lost — reconnecting...</div>
          </div>`;
        break;

      case "error":
        dot.classList.add("iai-error");
        statusText.textContent = "Error";
        content.innerHTML = `
          <div class="iai-waiting">
            <div class="iai-waiting-icon">⚠️</div>
            <div style="color:#ef4444">${message || "Something went wrong"}</div>
          </div>`;
        break;
    }
  }

  // ─── Render Suggestion ─────────────────────────────────────────────────────
  function renderSuggestion(suggestion) {
    currentSuggestion = suggestion;
    const content = document.getElementById("iai-content");
    if (!content) return;

    // Check for salary keywords
    const salaryKeywords = ["salary", "compensation", "package", "pay", "wage", "rate", "offer"];
    const isSalary = salaryKeywords.some(
      (k) => JSON.stringify(suggestion).toLowerCase().includes(k)
    );

    if (isSalary || isSalaryMode) {
      renderSalaryMode();
      return;
    }

    if (userPlan === "free") {
      renderUpgradeState();
      return;
    }

    const timingClass =
      suggestion.target_duration_seconds < 90
        ? "iai-timing-green"
        : suggestion.target_duration_seconds <= 150
        ? "iai-timing-amber"
        : "iai-timing-red";

    const qTypeClass = `iai-badge-${(suggestion.question_type || "behavioral").toLowerCase()}`;

    let html = `<div class="iai-suggestion">`;

    // Alert banner
    if (suggestion.alert_type && suggestion.alert_message) {
      const alertClass =
        suggestion.alert_type === "timing"
          ? "iai-alert-amber"
          : suggestion.alert_type === "encouragement"
          ? "iai-alert-green"
          : "iai-alert-amber";
      const alertIcon =
        suggestion.alert_type === "timing"
          ? "⏱"
          : suggestion.alert_type === "encouragement"
          ? "💪"
          : "🎯";
      html += `
        <div class="iai-alert ${alertClass}">
          <span>${alertIcon}</span>
          <span>${suggestion.alert_message}</span>
        </div>`;
    }

    // Badges
    html += `<div class="iai-badges">
      <span class="iai-badge ${qTypeClass}">${suggestion.question_type || "behavioral"}</span>
      ${suggestion.framework ? `<span class="iai-badge iai-badge-framework">${suggestion.framework}</span>` : ""}
    </div>`;

    // Headline
    html += `<div class="iai-headline">${suggestion.headline}</div>`;

    // Structure
    if (suggestion.structure?.length > 0) {
      html += `<div class="iai-structure">
        <div class="iai-structure-title">How to structure your answer</div>`;
      suggestion.structure.slice(0, 3).forEach((item) => {
        html += `<div class="iai-structure-item">
          <span class="iai-structure-label">${item.label}</span>
          <span class="iai-structure-guidance">${item.guidance}</span>
        </div>`;
      });
      html += `</div>`;
    }

    // CV Hook
    if (suggestion.cv_hook) {
      html += `<div class="iai-cv-hook">
        <div class="iai-cv-hook-label">Draw from your experience</div>
        <div class="iai-cv-hook-text">${suggestion.cv_hook}</div>
      </div>`;
    }

    // Keywords
    if (suggestion.keywords_to_include?.length > 0) {
      html += `<div class="iai-chips-section">
        <div class="iai-chips-label">Keywords to include</div>
        <div class="iai-chips">
          ${suggestion.keywords_to_include
            .map((k) => `<span class="iai-chip iai-chip-green">${k}</span>`)
            .join("")}
        </div>
      </div>`;
    }

    // Things to avoid
    if (suggestion.things_to_avoid?.length > 0) {
      html += `<div class="iai-chips-section">
        <div class="iai-chips-label">Avoid saying</div>
        <div class="iai-chips">
          ${suggestion.things_to_avoid
            .map((k) => `<span class="iai-chip iai-chip-red">${k}</span>`)
            .join("")}
        </div>
      </div>`;
    }

    // Timing
    if (suggestion.target_duration_seconds) {
      html += `<span class="iai-timing ${timingClass}">
        ⏱ Aim for ${suggestion.target_duration_seconds}s
      </span>`;
    }

    // Follow-up questions
    if (suggestion.follow_up_questions?.length > 0) {
      html += `<div class="iai-followups">
        <div class="iai-followups-label">Questions to ask them</div>
        ${suggestion.follow_up_questions
          .map((q) => `<div class="iai-followup-item">${q}</div>`)
          .join("")}
      </div>`;
    }

    // Coaching note
    if (suggestion.coaching_note) {
      html += `<div class="iai-coaching-note">
        <span class="iai-coaching-note-label">From your last answer:</span>
        ${suggestion.coaching_note}
      </div>`;
    }

    html += `</div>`;
    content.innerHTML = html;
  }

  // ─── Salary Mode ──────────────────────────────────────────────────────────
  function renderSalaryMode() {
    const content = document.getElementById("iai-content");
    if (!content) return;
    content.innerHTML = `
      <div class="iai-salary-mode">
        <div class="iai-salary-header">💰 SALARY NEGOTIATION MODE</div>
        <div class="iai-salary-body">
          <div class="iai-salary-rule">💡 Don't name a number first</div>
          <div class="iai-salary-rule">💡 Let them anchor — then negotiate up</div>
          <div class="iai-salary-rule">💡 Ask: "What's the budgeted range for this role?"</div>
          <div class="iai-salary-rule">💡 Consider total package, not just base</div>
          <div class="iai-salary-rule">💡 Take time: "I'd like to consider the full offer"</div>
          <div class="iai-salary-counter">
            Suggested response: "I'm flexible — could you share the budgeted range?"
          </div>
        </div>
      </div>`;
  }

  // ─── Upgrade State ────────────────────────────────────────────────────────
  function renderUpgradeState() {
    const content = document.getElementById("iai-content");
    if (!content) return;

    // Show blurred sample behind upgrade CTA
    content.innerHTML = `
      <div class="iai-upgrade">
        <div class="iai-upgrade-title">🔒 Live Coaching is Pro</div>
        <div class="iai-upgrade-sub">Upgrade to get real-time AI suggestions during your interviews</div>
        <a class="iai-upgrade-btn" href="https://interviewcoach.base44.app/Billing" target="_blank">
          Upgrade to Pro →
        </a>
      </div>
      <div style="filter:blur(4px);opacity:0.4;pointer-events:none;margin-top:8px">
        <div class="iai-badges">
          <span class="iai-badge iai-badge-behavioral">Behavioral</span>
          <span class="iai-badge iai-badge-framework">STAR</span>
        </div>
        <div class="iai-headline">Lead with a specific example that shows ownership and initiative</div>
        <div class="iai-chips-section">
          <div class="iai-chips">
            <span class="iai-chip iai-chip-green">leadership</span>
            <span class="iai-chip iai-chip-green">initiative</span>
            <span class="iai-chip iai-chip-green">outcome</span>
          </div>
        </div>
      </div>`;
  }

  // ─── Listening State ──────────────────────────────────────────────────────
  function renderListening(speaker, text) {
    const transcriptStrip = document.getElementById("iai-transcript-strip");
    if (!transcriptStrip) return;

    transcriptStrip.style.display = "block";
    const cls = speaker === "interviewer" ? "iai-interviewer" : "iai-candidate";
    const label = speaker === "interviewer" ? "Interviewer" : "You";
    transcriptStrip.innerHTML = `
      <div class="iai-transcript-line ${cls}">
        <strong>${label}:</strong> ${text.slice(-80)}${text.length > 80 ? "..." : ""}
      </div>`;
  }

  // ─── Toggle Controls ──────────────────────────────────────────────────────
  function toggleMinimize() {
    isMinimized = !isMinimized;
    const body = document.getElementById("iai-body");
    const strip = document.getElementById("iai-transcript-strip");
    const shortcut = root.querySelector(".iai-shortcut-hint");
    const panel = document.getElementById("iai-panel");

    if (body) body.style.display = isMinimized ? "none" : "";
    if (strip) strip.style.display = isMinimized ? "none" : "";
    if (shortcut) shortcut.style.display = isMinimized ? "none" : "";
    if (panel) panel.classList.toggle("iai-collapsed", isMinimized);

    const btn = document.getElementById("iai-minimize-btn");
    if (btn) btn.textContent = isMinimized ? "□" : "─";
  }

  function toggleHide() {
    isHidden = !isHidden;
    const panel = document.getElementById("iai-panel");
    if (panel) panel.classList.toggle("iai-hidden", isHidden);
  }

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "h") {
      e.preventDefault();
      toggleHide();
    }
    if (e.altKey && e.key === "m") {
      e.preventDefault();
      toggleMinimize();
    }
    if (e.altKey && e.key === "s") {
      e.preventDefault();
      isSalaryMode = !isSalaryMode;
      if (isSalaryMode) {
        renderSalaryMode();
      } else if (currentSuggestion) {
        renderSuggestion(currentSuggestion);
      } else {
        setState("active");
      }
    }
    if (e.key === "Escape" && !isMinimized) {
      toggleMinimize();
    }
  });

  // ─── Event Listeners from content.js ─────────────────────────────────────
  window.addEventListener("interviewai:ready", () => {
    buildPanel();
    setState("idle");
  });

  window.addEventListener("interviewai:state", (e) => {
    setState(e.detail.state, e.detail.message);
  });

  window.addEventListener("interviewai:suggestion", (e) => {
    renderSuggestion(e.detail);
  });

  window.addEventListener("interviewai:transcript", (e) => {
    renderListening(e.detail.speaker, e.detail.text);
  });

  window.addEventListener("interviewai:listening", (e) => {
    renderListening(e.detail.speaker, e.detail.text);
  });

  window.addEventListener("interviewai:error", (e) => {
    setState("error", e.detail.message);
  });

  window.addEventListener("interviewai:upgrade_required", () => {
    userPlan = "free";
    renderUpgradeState();
  });

  // ─── Init ─────────────────────────────────────────────────────────────────
  // Check user plan from storage
  chrome.storage.local.get(["userPlan"], (data) => {
    if (data.userPlan) userPlan = data.userPlan;
  });

  // Build panel immediately
  buildPanel();
  setState("idle");
})();
