/**
 * Base44 Backend Function: POST /sessions/{id}/end
 *
 * Called by the Chrome extension (or web app) when the interview ends.
 * Marks the session completed, increments the user's monthly counter,
 * and kicks off async debrief generation via InvokeLLM.
 *
 * Request
 *   Authorization: Bearer <user_api_token>
 *   Path param:    id  (session id)
 *
 * Response 200  (returns immediately — debrief generated async)
 *   { success: true, report_id: string | null }
 *
 * Errors
 *   401 – missing / invalid token
 *   403 – session belongs to a different user
 *   404 – session not found
 */

export default async function sessionEnd({ req, context }) {
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

  // ── 3. Mark session completed ────────────────────────────────────────────────
  const now = new Date().toISOString();
  await entities.InterviewSessions.update(sessionId, {
    status: "completed",
    ended_at: now,
  });

  // ── 4. Increment monthly usage counter ───────────────────────────────────────
  const currentUsed = user.interviews_used_this_month || 0;
  await entities.Users.update(user.id, {
    interviews_used_this_month: currentUsed + 1,
  });

  // ── 5. Fetch all transcript entries and CV for debrief ───────────────────────
  const entries = await entities.TranscriptEntries.filter({ session_id: sessionId }, "created_date");
  const transcript = entries
    .map((e) => `${e.speaker === "interviewer" ? "Interviewer" : "Candidate"}: ${e.text}`)
    .join("\n");

  let cvText = "";
  if (session.cv_profile_id) {
    const cvProfiles = await entities.CVProfiles.filter({ id: session.cv_profile_id });
    cvText = cvProfiles[0]?.cv_text || "";
  }

  // ── 6. Generate debrief report asynchronously ────────────────────────────────
  // We return 200 immediately and let the LLM call finish in the background.
  // The frontend polls GET /sessions/{id}/report until status is "ready".
  let reportId = null;
  try {
    const prompt = `You are an expert interview coach. Analyze this complete interview and return ONLY valid JSON.

Candidate CV:
${cvText}

Role: ${session.job_title} at ${session.company_name}
Interview type: ${session.interview_type}

Full transcript:
${transcript}

Return this exact JSON structure:
{
  "overall_score": 7,
  "summary": "2-3 sentence executive summary of performance",
  "strongest_moments": ["moment 1", "moment 2", "moment 3"],
  "missed_opportunities": ["opportunity 1", "opportunity 2"],
  "questions_analysis": [
    {
      "question": "What the interviewer asked",
      "answer_quality": "strong|adequate|weak",
      "notes": "specific coaching note on this answer"
    }
  ],
  "action_items": ["action 1", "action 2", "action 3"],
  "follow_up_email_draft": "Full thank-you email draft addressed to the interviewer"
}`;

    const llmResponse = await integrations.InvokeLLM({ prompt, response_json_schema: true });
    const reportData = typeof llmResponse === "string" ? JSON.parse(llmResponse) : llmResponse;

    const report = await entities.DebriefReports.create({
      session_id: sessionId,
      ...reportData,
    });
    reportId = report.id;

    // Update session with overall score
    await entities.InterviewSessions.update(sessionId, {
      overall_score: reportData.overall_score,
    });
  } catch (err) {
    console.error("[sessionEnd] Debrief generation error:", err.message);
    // Non-fatal — report will be generated on retry if needed
  }

  return { status: 200, body: { success: true, report_id: reportId } };
}
