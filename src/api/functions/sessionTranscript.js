/**
 * Base44 Backend Function: POST /sessions/{id}/transcript
 *
 * Called by the Chrome extension for every new transcript chunk.
 * Stores the entry, and when the speaker is "interviewer" on a
 * pro/pro_plus plan, generates an AI suggestion via InvokeLLM.
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

export default async function sessionTranscript({ req, context }) {
  const { entities, integrations } = context;

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

  // ── 4. Only generate suggestions for interviewer turns on paid plans ─────────
  if (speaker !== "interviewer") {
    return { status: 200, body: { suggestion: null } };
  }

  const userPlan = user.plan || "free";
  if (userPlan === "free") {
    return { status: 200, body: { suggestion: null, reason: "upgrade_required" } };
  }

  // ── 5. Fetch last 8 transcript entries for context ───────────────────────────
  const allEntries = await entities.TranscriptEntries.filter({ session_id: sessionId }, "-created_date", 8);
  const recentContext = allEntries
    .reverse()
    .map((e) => `${e.speaker === "interviewer" ? "Interviewer" : "Candidate"}: ${e.text}`)
    .join("\n");

  // ── 6. Fetch CV text ─────────────────────────────────────────────────────────
  let cvText = "";
  if (session.cv_profile_id) {
    const cvProfiles = await entities.CVProfiles.filter({ id: session.cv_profile_id });
    cvText = cvProfiles[0]?.cv_text || "";
  }

  // ── 7. Call LLM for real-time coaching suggestion ────────────────────────────
  const llmStart = Date.now();

  const prompt = `You are a real-time interview coach. Respond ONLY with valid JSON.

Candidate CV:
${cvText}

Role: ${session.job_title} at ${session.company_name}
Interview type: ${session.interview_type}

Recent conversation:
${recentContext}

Interviewer just asked: "${text}"

Return this exact JSON structure:
{
  "question_type": "behavioral|technical|situational|motivational|curveball",
  "framework": "STAR|SOAR|direct|technical_steps",
  "headline": "one-line coaching headline",
  "structure": [
    { "label": "Opening", "guidance": "..." },
    { "label": "Core", "guidance": "..." },
    { "label": "Close", "guidance": "..." }
  ],
  "cv_hook": "specific experience from their CV to reference",
  "target_duration_seconds": 90,
  "keywords_to_include": ["keyword1", "keyword2"],
  "things_to_avoid": ["avoid this", "avoid that"],
  "follow_up_questions": ["question to ask interviewer"],
  "alert_type": null,
  "alert_message": null,
  "coaching_note": "brief private coaching note"
}`;

  let suggestionData;
  try {
    const llmResponse = await integrations.InvokeLLM({ prompt, response_json_schema: true });
    suggestionData = typeof llmResponse === "string" ? JSON.parse(llmResponse) : llmResponse;
  } catch (err) {
    console.error("[sessionTranscript] LLM parse error:", err.message);
    return { status: 200, body: { suggestion: null, reason: "llm_error" } };
  }

  const latency_ms = Date.now() - llmStart;

  // ── 8. Persist suggestion ────────────────────────────────────────────────────
  const suggestion = await entities.AISuggestions.create({
    session_id: sessionId,
    latency_ms,
    ...suggestionData,
  });

  return { status: 200, body: { suggestion } };
}
