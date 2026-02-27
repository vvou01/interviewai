/**
 * Base44 Backend Function: GET /sessions/{id}/suggestions/latest
 *
 * Returns the most recent AISuggestion for a session. The Chrome
 * extension polls this to update its coaching overlay.
 *
 * Request
 *   Authorization: Bearer <user_api_token>
 *   Path param:    id  (session id)
 *
 * Response 200
 *   { suggestion: <AISuggestion> }   — if one exists
 *   { suggestion: null }             — if none yet
 *
 * Errors
 *   401 – missing / invalid token
 *   403 – session belongs to a different user
 *   404 – session not found
 */

export default async function sessionSuggestionsLatest({ req, context }) {
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

  // ── 3. Fetch latest suggestion ────────────────────────────────────────────────
  const suggestions = await entities.AISuggestions.filter(
    { session_id: sessionId },
    "-created_date",
    1
  );

  return { status: 200, body: { suggestion: suggestions[0] || null } };
}
