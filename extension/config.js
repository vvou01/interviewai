// InterviewAI Chrome Extension — Configuration
// Your Base44 backend URL
const CONFIG = {
  BASE_URL: "https://interviewcoach.base44.app",
  APP_ID: "f75959b5-6c17-4fb1-8b4b-dfd9837b8f6e",

  // Base44 function names (must match exactly)
  FUNCTIONS: {
    START_SESSION: "startSession",
    PROCESS_AUDIO: "processAudio",
    END_SESSION: "endSession",
    GET_REPORT: "sessionReport",
    GET_LATEST_SUGGESTION: "sessionSuggestionsLatest",
  },

  // Deepgram streaming endpoint
  DEEPGRAM_URL: "wss://api.deepgram.com/v1/listen",
  DEEPGRAM_PARAMS:
    "encoding=linear16&sample_rate=16000&channels=1" +
    "&diarize=true&utterance_end_ms=1200&interim_results=true" +
    "&punctuate=true&smart_format=true",

  // Polling intervals (ms)
  TRANSCRIPT_POLL_MS: 3000,
  COACHING_POLL_MS: 2000,

  // Timeouts
  API_TIMEOUT_MS: 5000,
  SUGGESTION_TIMEOUT_MS: 3000,
};
