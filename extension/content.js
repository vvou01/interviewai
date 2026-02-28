// InterviewAI — Content Script
// Runs inside the meeting tab (Google Meet, Teams, Zoom)
// Captures mic + tab audio, streams to Deepgram, sends transcript to backend

(async () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  let isRunning = false;
  let sessionId = null;
  let authToken = null;
  let deepgramSocket = null;
  let mediaRecorder = null;
  let audioContext = null;
  let sessionStartTime = null;
  let speakerHistory = []; // track speaker turns
  let currentSpeaker = null;
  let accumulatedText = "";
  let deepgramApiKey = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT = 3;

  // ─── Init: receive start command from popup ─────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "START_SESSION") {
      sessionId = msg.sessionId;
      authToken = msg.authToken;
      deepgramApiKey = msg.deepgramApiKey;
      startCapture();
      sendResponse({ success: true });
    }
    if (msg.type === "STOP_SESSION") {
      stopCapture();
      sendResponse({ success: true });
    }
    if (msg.type === "GET_STATUS") {
      sendResponse({ isRunning, sessionId });
    }
    return true;
  });

  // ─── Audio Capture ──────────────────────────────────────────────────────────
  async function startCapture() {
    if (isRunning) return;

    try {
      updateOverlayState("connecting");

      // 1. Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        },
        video: false,
      });

      // 2. Request tab audio from background
      const bgResponse = await sendMessageToBackground("GET_TAB_STREAM");
      if (bgResponse.error) {
        console.warn(
          "[InterviewAI] Tab audio unavailable, using mic only:",
          bgResponse.error
        );
      }

      // 3. Create AudioContext and mix streams
      audioContext = new AudioContext({ sampleRate: 16000 });
      const destination = audioContext.createMediaStreamDestination();

      // Connect mic
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);

      // Try to connect tab audio if available
      // Tab audio comes through the page's audio output
      // We capture it using a gain node approach
      if (bgResponse.success) {
        try {
          // Request the tab stream via a different approach
          // We use the fact that content script can access page audio
          const tabAudioStream = await captureTabAudio();
          if (tabAudioStream) {
            const tabSource =
              audioContext.createMediaStreamSource(tabAudioStream);
            tabSource.connect(destination);
          }
        } catch (e) {
          console.warn("[InterviewAI] Could not mix tab audio:", e.message);
        }
      }

      // 4. Start Deepgram WebSocket
      await startDeepgramStream(destination.stream);

      // 5. Notify backend session is starting
      await callBackendFunction(CONFIG.FUNCTIONS.START_SESSION, { sessionId });

      isRunning = true;
      sessionStartTime = Date.now();

      // Update badge
      chrome.runtime.sendMessage({
        type: "UPDATE_BADGE",
        text: "●",
        color: "#22c55e",
      });

      updateOverlayState("active");
      console.log("[InterviewAI] Session started:", sessionId);
    } catch (err) {
      console.error("[InterviewAI] Failed to start capture:", err);
      updateOverlayState("error", err.message);

      if (err.name === "NotAllowedError") {
        showOverlayError(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        showOverlayError("Failed to start: " + err.message);
      }
    }
  }

  async function captureTabAudio() {
    // Use Web Audio API to capture what's playing in the tab
    // This works for browser-based calls where audio plays through the page
    return new Promise((resolve) => {
      // Try to get audio from video/audio elements on the page
      const mediaElements = document.querySelectorAll("audio, video");
      if (mediaElements.length === 0) {
        resolve(null);
        return;
      }

      const streams = [];
      mediaElements.forEach((el) => {
        try {
          if (el.srcObject) {
            streams.push(el.srcObject);
          } else if (el.captureStream) {
            streams.push(el.captureStream());
          }
        } catch (e) {
          // ignore
        }
      });

      if (streams.length === 0) {
        resolve(null);
        return;
      }

      // Merge all media element streams
      const ctx = new AudioContext({ sampleRate: 16000 });
      const dest = ctx.createMediaStreamDestination();
      streams.forEach((s) => {
        try {
          const src = ctx.createMediaStreamSource(s);
          src.connect(dest);
        } catch (e) {
          // ignore
        }
      });

      resolve(dest.stream);
    });
  }

  function stopCapture() {
    if (!isRunning) return;

    isRunning = false;

    if (deepgramSocket) {
      deepgramSocket.close();
      deepgramSocket = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      text: "",
      color: "#6b7280",
    });

    updateOverlayState("idle");
    console.log("[InterviewAI] Session stopped");
  }

  // ─── Deepgram Streaming ─────────────────────────────────────────────────────
  async function startDeepgramStream(stream) {
    if (!deepgramApiKey) {
      throw new Error("Deepgram API key not configured");
    }

    const url = `${CONFIG.DEEPGRAM_URL}?${CONFIG.DEEPGRAM_PARAMS}`;

    deepgramSocket = new WebSocket(url, ["token", deepgramApiKey]);

    deepgramSocket.onopen = () => {
      console.log("[InterviewAI] Deepgram connected");
      reconnectAttempts = 0;
      startMediaRecorder(stream);
    };

    deepgramSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleDeepgramMessage(data);
      } catch (e) {
        console.warn("[InterviewAI] Failed to parse Deepgram message:", e);
      }
    };

    deepgramSocket.onerror = (error) => {
      console.error("[InterviewAI] Deepgram error:", error);
    };

    deepgramSocket.onclose = (event) => {
      console.log("[InterviewAI] Deepgram closed:", event.code);
      if (isRunning && reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        const delay = reconnectAttempts * 2000;
        console.log(
          `[InterviewAI] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`
        );
        updateOverlayState("reconnecting");
        setTimeout(() => startDeepgramStream(stream), delay);
      }
    };
  }

  function startMediaRecorder(stream) {
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (
        e.data.size > 0 &&
        deepgramSocket &&
        deepgramSocket.readyState === WebSocket.OPEN
      ) {
        deepgramSocket.send(e.data);
      }
    };

    mediaRecorder.start(250); // send chunks every 250ms
  }

  // ─── Deepgram Message Handler ───────────────────────────────────────────────
  function handleDeepgramMessage(data) {
    // Handle UtteranceEnd — fire when a speaker finishes talking
    if (data.type === "UtteranceEnd") {
      if (accumulatedText.trim().length > 0) {
        const speaker = determineSpeaker(currentSpeaker);
        const timestampSeconds = Math.floor(
          (Date.now() - sessionStartTime) / 1000
        );

        sendTranscriptToBackend(speaker, accumulatedText.trim(), timestampSeconds);
        updateOverlayTranscript(speaker, accumulatedText.trim());
        accumulatedText = "";
      }
      return;
    }

    // Handle regular transcript results
    if (data.type !== "Results") return;

    const transcript = data.channel?.alternatives?.[0]?.transcript;
    if (!transcript || transcript.trim() === "") return;

    const isFinal = data.is_final;
    const words = data.channel?.alternatives?.[0]?.words || [];

    // Determine speaker from diarization
    if (words.length > 0) {
      const speakerTag = words[0]?.speaker;
      if (speakerTag !== undefined) {
        currentSpeaker = speakerTag;
        trackSpeaker(speakerTag);
      }
    }

    if (isFinal) {
      accumulatedText += " " + transcript;

      // Show interim in overlay
      const speaker = determineSpeaker(currentSpeaker);
      updateOverlayListening(speaker, transcript);
    }
  }

  // ─── Speaker Detection ──────────────────────────────────────────────────────
  // Deepgram assigns speaker 0, 1, 2... 
  // We assume first distinct speaker = interviewer
  // second distinct speaker = candidate
  function trackSpeaker(speakerTag) {
    if (!speakerHistory.includes(speakerTag)) {
      speakerHistory.push(speakerTag);
    }
  }

  function determineSpeaker(speakerTag) {
    if (speakerHistory.length === 0) return "interviewer";
    // First speaker heard = interviewer
    if (speakerTag === speakerHistory[0]) return "interviewer";
    return "candidate";
  }

  // ─── Backend API Calls ──────────────────────────────────────────────────────
  async function sendTranscriptToBackend(speaker, text, timestampSeconds) {
    try {
      const result = await callBackendFunction(CONFIG.FUNCTIONS.PROCESS_AUDIO, {
        sessionId,
        speaker,
        text,
        timestamp_seconds: timestampSeconds,
      });

      if (result?.suggestion) {
        // Show coaching suggestion in overlay
        window.dispatchEvent(
          new CustomEvent("interviewai:suggestion", {
            detail: result.suggestion,
          })
        );
      }

      if (result?.reason === "upgrade_required") {
        window.dispatchEvent(
          new CustomEvent("interviewai:upgrade_required", {})
        );
      }
    } catch (err) {
      console.warn("[InterviewAI] Transcript send failed:", err.message);
    }
  }

  async function callBackendFunction(functionName, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      CONFIG.SUGGESTION_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${CONFIG.APP_URL}/api/functions/${functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "X-App-Id": CONFIG.APP_ID,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.warn(`[InterviewAI] ${functionName} timed out`);
        return null;
      }
      throw err;
    }
  }

  // ─── Overlay Communication ──────────────────────────────────────────────────
  function updateOverlayState(state, message = "") {
    window.dispatchEvent(
      new CustomEvent("interviewai:state", {
        detail: { state, message },
      })
    );
  }

  function updateOverlayTranscript(speaker, text) {
    window.dispatchEvent(
      new CustomEvent("interviewai:transcript", {
        detail: { speaker, text },
      })
    );
  }

  function updateOverlayListening(speaker, text) {
    window.dispatchEvent(
      new CustomEvent("interviewai:listening", {
        detail: { speaker, text },
      })
    );
  }

  function showOverlayError(message) {
    window.dispatchEvent(
      new CustomEvent("interviewai:error", {
        detail: { message },
      })
    );
  }

  // ─── Helper ─────────────────────────────────────────────────────────────────
  function sendMessageToBackground(type, data = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...data }, (response) => {
        resolve(response || {});
      });
    });
  }

  // Inject overlay into page
  injectOverlay();

  async function injectOverlay() {
    await chrome.runtime.sendMessage({ type: "GET_STATUS" });
    // Overlay script handles its own injection via content_scripts
    // Just dispatch ready event
    window.dispatchEvent(new CustomEvent("interviewai:ready"));
  }
})();
