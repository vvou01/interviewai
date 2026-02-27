/**
 * generateCoaching
 *
 * Calls the Anthropic API to produce a real-time coaching suggestion for
 * the current interviewer question. Intended to be called from processAudio.
 *
 * Can also be deployed as a standalone Base44 Function if needed for
 * direct invocation by the Chrome extension.
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY – Anthropic API key, never hardcoded
 *
 * @param {object} params
 * @param {object} params.session       – InterviewSession entity (must include
 *                                        job_title, company_name, job_description,
 *                                        interview_type)
 * @param {string} params.cvText        – Candidate's CV text
 * @param {string} params.recentContext – Last ≤8 transcript lines, chronological
 * @param {string} params.questionText  – The exact question just asked
 *
 * @returns {{ suggestionData: object, latency_ms: number, error: string|null }}
 */

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("[generateCoaching] ANTHROPIC_API_KEY environment variable is not set");
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function generateCoaching({ session, cvText, recentContext, questionText }) {
  const prompt = `You are a real-time interview coach. Respond ONLY with valid JSON, no prose before or after.

Candidate CV:
${cvText}

Job: ${session.job_title} at ${session.company_name}
Interview type: ${session.interview_type}
Job description:
${session.job_description || "Not provided"}

Recent conversation (chronological):
${recentContext}

Interviewer just asked: "${questionText}"

Return exactly this JSON structure, no other text:
{
  "question_type": "behavioral|technical|situational|motivational|curveball",
  "framework": "STAR|SOAR|direct|technical_steps",
  "headline": "one-line coaching headline for the candidate",
  "structure": [
    { "label": "Opening", "guidance": "how to open the answer" },
    { "label": "Core", "guidance": "the main body of the answer" },
    { "label": "Close", "guidance": "how to land the answer" }
  ],
  "cv_hook": "specific experience from the candidate CV to reference",
  "target_duration_seconds": 90,
  "keywords_to_include": ["keyword1", "keyword2"],
  "things_to_avoid": ["pitfall1", "pitfall2"],
  "follow_up_questions": ["question the candidate could ask the interviewer"],
  "alert_type": null,
  "alert_message": null,
  "coaching_note": "brief private coaching note visible only to candidate"
}`;

  const start = Date.now();

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const latency_ms = Date.now() - start;
    console.log(`[generateCoaching] latency_ms=${latency_ms} session=${session.id}`);

    const raw = response.content[0]?.text || "";

    // Strip any accidental markdown code fences before parsing
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const suggestionData = JSON.parse(cleaned);

    return { suggestionData, latency_ms, error: null };
  } catch (err) {
    const latency_ms = Date.now() - start;
    console.error(`[generateCoaching] error after ${latency_ms}ms:`, err.message);
    return { suggestionData: null, latency_ms, error: err.message };
  }
}
