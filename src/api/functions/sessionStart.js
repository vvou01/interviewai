/**
 * Base44 Backend Function: POST /sessions/{id}/start
 *
 * Deploy this in the Base44 dashboard under Functions / Actions.
 * The Chrome extension calls this to transition a session from
 * "setup" → "active" and receive the context it needs for coaching.
 *
 * Request
 *   Authorization: Bearer <user_api_token>
 *   Path param:    id  (session id)
 *
 * Response 200
 *   { session_id, job_title, company_name, job_description,
 *     interview_type, cv_text, user_plan }
 *
 * Errors
 *   401 – missing / invalid token
 *   403 – session belongs to a different user
 *   404 – session not found
 */

export default async function sessionStart({ req, context }) {
  const { entities, auth } = context;

  // ── 1. Authenticate ──────────────────────────────────────────────────────────
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!token) return { status: 401, body: { error: "Missing authorization token" } };

  // Look up user by their api_token field
  const users = await entities.Users.filter({ api_token: token });
  const user = users[0];
  if (!user) return { status: 401, body: { error: "Invalid token" } };

  // ── 2. Find and verify session ownership ────────────────────────────────────
  const sessionId = req.params.id;
  const sessions = await entities.InterviewSessions.filter({ id: sessionId, user_id: user.id });
  const session = sessions[0];
  if (!session) {
    // Distinguish "not found" from "wrong user"
    const any = await entities.InterviewSessions.filter({ id: sessionId });
    return any[0]
      ? { status: 403, body: { error: "Forbidden" } }
      : { status: 404, body: { error: "Session not found" } };
  }

  // ── 3. Activate session ──────────────────────────────────────────────────────
  const now = new Date().toISOString();
  await entities.InterviewSessions.update(sessionId, {
    status: "active",
    started_at: now,
  });

  // ── 4. Fetch linked CV profile ───────────────────────────────────────────────
  let cvText = "";
  if (session.cv_profile_id) {
    const cvProfiles = await entities.CVProfiles.filter({ id: session.cv_profile_id });
    cvText = cvProfiles[0]?.cv_text || "";
  }

  // ── 5. Return session context ─────────────────────────────────────────────────
  return {
    status: 200,
    body: {
      session_id: sessionId,
      job_title: session.job_title,
      company_name: session.company_name,
      job_description: session.job_description,
      interview_type: session.interview_type,
      cv_text: cvText,
      user_plan: user.plan || "free",
    },
  };
}
