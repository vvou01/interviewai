/**
 * Base44 Backend Function: POST /sessions/{id}/transcript
 * (internal name: processAudio)
 *
 * Called by the Chrome extension for every new transcript chunk.
 * Stores the TranscriptEntry and, when the speaker is "interviewer"
 * on a paid plan, delegates to generateCoaching for real-time coaching.
 *
 * Environment variables required:
 *   DEEPGRAM_API_KEY  – available for audio-to-text path if the extension
 *                       sends raw audio instead of pre-transcribed text
 *
 * Request
 *   Authorization: Bearer <user_api_token>
 *   Path param:    id  (session id)
 *   Body:          { speaker: "interviewer"|"candidate", text: string, timestamp_seconds: number }
 *
 * Response 200
 *   { suggestion: <AISuggestion object> | null, reason?: string }
 *
 * Errors
 *   401 – missing / invalid token
 *   403 – session belongs to a different user
 *   404 – session not found
 */

import { generateCoaching } from "./generateCoaching.js";

// Read env vars at startup so a missing key surfaces immediately in logs
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  console.warn("[processAudio] DEEPGRAM_API_KEY not set – audio transcription path unavailable");
}

export default async function processAudio({ req, context }) {
  const { entities } = context;

  // ── 1. Authenticate ──────────────────────────────────────────────────────────
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!token) return { status: 401, body: { error: "Missing authorization token" } };

  const users = await entities.Users.filter({ api_token: token });
  const user = users[0];
  if (!user) return { status: 401, body: { error: "Invalid token" } };

  // ── 2. Verify session ownership ──────────────────────────────────────────────
  const sessionId = req.params.id;
  const sessions = await entities.InterviewSessions.filter({ id: sessionId, user_id: user.id });
  const session = sessions[0];
  if (!session) {
    const any = await entities.InterviewSessions.filter({ id: sessionId });
    return any[0]
      ? { status: 403, body: { error: "Forbidden" } }
      : { status: 404, body: { error: "Session not found" } };
  }

  const { speaker, text, timestamp_seconds } = req.body;

  // ── 3. Store transcript entry ────────────────────────────────────────────────
  await entities.TranscriptEntries.create({
    session_id: sessionId,
    speaker,
    text,
    timestamp_seconds: timestamp_seconds || 0,
  });

  // ── 4. Candidate turns never generate coaching ───────────────────────────────
  if (speaker !== "interviewer") {
    return { status: 200, body: { suggestion: null } };
  }

  // ── 5. Free plan: transcript stored but no coaching ──────────────────────────
  const userPlan = user.plan || "free";
  if (userPlan === "free") {
    return { status: 200, body: { suggestion: null, reason: "upgrade_required" } };
  }

  // ── 6. Paid plan: delegate to generateCoaching ───────────────────────────────
  // Fetch last 8 entries (most recent first) then reverse to chronological order
  const recentEntries = await entities.TranscriptEntries.filter(
    { session_id: sessionId },
    "-created_date",
    8
  );
  const recentContext = recentEntries
    .reverse()
    .map((e) => `${e.speaker === "interviewer" ? "Interviewer" : "Candidate"}: ${e.text}`)
    .join("\n");

  // Fetch CV text for context
  let cvText = "";
  if (session.cv_profile_id) {
    const cvProfiles = await entities.CVProfiles.filter({ id: session.cv_profile_id });
    cvText = cvProfiles[0]?.cv_text || "";
  }

  const { suggestionData, latency_ms, error: coachingError } = await generateCoaching({
    session,
    cvText,
    recentContext,
    questionText: text,
  });

  if (coachingError) {
    return { status: 200, body: { suggestion: null, reason: "llm_error" } };
  }

  // ── 7. Persist suggestion ────────────────────────────────────────────────────
  const suggestion = await entities.AISuggestions.create({
    session_id: sessionId,
    latency_ms,
    ...suggestionData,
  });

  return { status: 200, body: { suggestion } };
}
