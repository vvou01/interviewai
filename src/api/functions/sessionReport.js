/**
 * Base44 Backend Function: GET /sessions/{id}/report
 *
 * Polled by the web app and Chrome extension to retrieve the debrief
 * report. Returns { status: "pending" } until the report is ready.
 *
 * Request
 *   Authorization: Bearer <user_api_token>
 *   Path param:    id  (session id)
 *
 * Response 200
 *   { status: "ready", report: <DebriefReport> }   — report exists
 *   { status: "pending" }                           — still generating
 *
 * Errors
 *   401 – missing / invalid token
 *   403 – session belongs to a different user
 *   404 – session not found
 */

export default async function sessionReport({ req, context }) {
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
  if (!sessions[0]) {
    const any = await entities.InterviewSessions.filter({ id: sessionId });
    return any[0]
      ? { status: 403, body: { error: "Forbidden" } }
      : { status: 404, body: { error: "Session not found" } };
  }

  // ── 3. Fetch debrief report ───────────────────────────────────────────────────
  const reports = await entities.DebriefReports.filter({ session_id: sessionId });
  const report = reports[0];

  if (!report) {
    return { status: 200, body: { status: "pending" } };
  }

  return { status: 200, body: { status: "ready", report } };
}
