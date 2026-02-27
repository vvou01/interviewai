/**
 * Base44 Backend Function: POST /sessions/{id}/end
 *
 * Called by the Chrome extension (or web app) when the interview ends.
 * Marks the session completed, increments the user's monthly counter,
 * and fires generateDebrief without awaiting — the response is returned
 * immediately while the debrief continues in the background.
 *
 * The frontend polls GET /sessions/{id}/report until status is "ready".
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY – used transitively by generateDebrief
 *
 * Request
 *   Authorization: Bearer <user_api_token>
 *   Path param:    id  (session id)
 *
 * Response 200  (returned before debrief generation finishes)
 *   { success: true }
 *
 * Errors
 *   401 – missing / invalid token
 *   403 – session belongs to a different user
 *   404 – session not found
 */

import { generateDebrief } from "./generateDebrief.js";

export default async function sessionEnd({ req, context }) {
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

  // ── 3. Mark session completed ────────────────────────────────────────────────
  await entities.InterviewSessions.update(sessionId, {
    status: "completed",
    ended_at: new Date().toISOString(),
  });

  // ── 4. Increment monthly usage counter ───────────────────────────────────────
  await entities.Users.update(user.id, {
    interviews_used_this_month: (user.interviews_used_this_month || 0) + 1,
  });

  // ── 5. Build transcript and fetch CV — needed by generateDebrief ─────────────
  const entries = await entities.TranscriptEntries.filter(
    { session_id: sessionId },
    "created_date"
  );
  const transcript = entries
    .map((e) => `${e.speaker === "interviewer" ? "Interviewer" : "Candidate"}: ${e.text}`)
    .join("\n");

  let cvText = "";
  if (session.cv_profile_id) {
    const cvProfiles = await entities.CVProfiles.filter({ id: session.cv_profile_id });
    cvText = cvProfiles[0]?.cv_text || "";
  }

  // ── 6. Fire debrief generation WITHOUT awaiting ──────────────────────────────
  // This intentionally does not use await. The HTTP response is returned
  // immediately; generateDebrief runs in the background and writes the
  // DebriefReport record when complete. The frontend polls /report to detect it.
  generateDebrief({ session, transcript, cvText, entities }).catch((err) => {
    console.error(`[sessionEnd] generateDebrief fire-and-forget error session=${sessionId}:`, err.message);
  });

  // ── 7. Return immediately ────────────────────────────────────────────────────
  return { status: 200, body: { success: true } };
}
