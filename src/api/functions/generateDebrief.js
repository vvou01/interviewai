/**
 * generateDebrief
 *
 * Calls Anthropic claude-sonnet-4-6 to produce a full post-interview
 * debrief report. Stores the result in DebriefReports and updates the
 * session's overall_score.
 *
 * This function is designed to run asynchronously — sessionEnd fires it
 * without awaiting, so the HTTP response is not blocked.
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY – Anthropic API key, never hardcoded
 *
 * @param {object} params
 * @param {object} params.session   – InterviewSession entity
 * @param {string} params.transcript – Full chronological transcript as plain text
 * @param {string} params.cvText    – Candidate's CV text
 * @param {object} params.entities  – Base44 entities context
 */

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("[generateDebrief] ANTHROPIC_API_KEY environment variable is not set");
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function generateDebrief({ session, transcript, cvText, entities }) {
  const prompt = `You are an expert interview coach. Analyze this complete interview and respond ONLY with valid JSON, no prose before or after.

Candidate CV:
${cvText}

Role: ${session.job_title} at ${session.company_name}
Interview type: ${session.interview_type}
Job description:
${session.job_description || "Not provided"}

Full transcript (chronological):
${transcript}

Return exactly this JSON structure, no other text:
{
  "overall_score": 7,
  "summary": "2–3 sentence executive summary of overall performance",
  "strongest_moments": [
    "specific strong answer or behaviour with brief reasoning"
  ],
  "missed_opportunities": [
    "specific moment where candidate could have done better"
  ],
  "questions_analysis": [
    {
      "question": "exact or paraphrased interviewer question",
      "answer_quality": "strong|adequate|weak",
      "notes": "specific, actionable coaching note on this answer"
    }
  ],
  "action_items": [
    "concrete action the candidate should take before the next interview"
  ],
  "follow_up_email_draft": "Complete thank-you email to the interviewer, ready to send"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0]?.text || "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const reportData = JSON.parse(cleaned);

    // Persist report
    await entities.DebriefReports.create({
      session_id: session.id,
      ...reportData,
    });

    // Back-fill overall_score on the session
    await entities.InterviewSessions.update(session.id, {
      overall_score: reportData.overall_score,
    });

    console.log(`[generateDebrief] completed session=${session.id} score=${reportData.overall_score}`);
  } catch (err) {
    console.error(`[generateDebrief] error session=${session.id}:`, err.message);
    // Non-fatal: the frontend polls until the report appears.
    // If this fails, the operator can re-trigger or the user can re-request.
  }
}
