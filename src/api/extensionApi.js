/**
 * extensionApi.js
 *
 * Client-side SDK wrappers for every HTTP endpoint the Chrome extension needs.
 * These functions accept a user's api_token and a session ID, and call the
 * underlying Base44 entity API directly using the token for auth.
 *
 * The Chrome extension stores the user's api_token (copied from Settings page)
 * and calls these functions. Each one mirrors the contract defined in
 * src/api/functions/ which should be deployed as Base44 backend Actions.
 *
 * Usage (from Chrome extension content script / background):
 *   import { startSession, postTranscript, endSession, getReport, getLatestSuggestion } from './extensionApi';
 *   const ctx = await startSession(apiToken, sessionId);
 *   const { suggestion } = await postTranscript(apiToken, sessionId, { speaker: 'interviewer', text, timestamp_seconds });
 */

import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";

/**
 * Build a one-shot base44 client authenticated with the user's api_token.
 * The extension token is the user's personal api_token, not the session JWT.
 */
function buildClient(apiToken) {
  return createClient({
    appId: appParams.appId,
    token: apiToken,
    functionsVersion: appParams.functionsVersion,
    serverUrl: "",
    requiresAuth: true,
    appBaseUrl: appParams.appBaseUrl,
  });
}

/**
 * POST /sessions/{id}/start
 *
 * Activates the session and returns the context the extension needs
 * to start coaching (cv_text, job_title, user_plan, etc.)
 *
 * @param {string} apiToken  – user's api_token from Settings
 * @param {string} sessionId – the session ID shown on the Ready screen
 * @returns {{ session_id, job_title, company_name, job_description, interview_type, cv_text, user_plan }}
 */
export async function startSession(apiToken, sessionId) {
  const client = buildClient(apiToken);

  // Verify token → get user
  const user = await client.auth.me();
  if (!user) throw new Error("Invalid API token");

  // Verify session ownership
  const sessions = await client.entities.InterviewSessions.filter({ id: sessionId, user_id: user.id });
  const session = sessions[0];
  if (!session) throw new Error("Session not found or access denied");

  // Activate
  const now = new Date().toISOString();
  await client.entities.InterviewSessions.update(sessionId, {
    status: "active",
    started_at: now,
  });

  // Fetch CV
  let cvText = "";
  if (session.cv_profile_id) {
    const cvProfiles = await client.entities.CVProfiles.filter({ id: session.cv_profile_id });
    cvText = cvProfiles[0]?.cv_text || "";
  }

  return {
    session_id: sessionId,
    job_title: session.job_title,
    company_name: session.company_name,
    job_description: session.job_description,
    interview_type: session.interview_type,
    cv_text: cvText,
    user_plan: user.plan || "free",
  };
}

/**
 * POST /sessions/{id}/transcript
 *
 * Stores a transcript chunk. When speaker is "interviewer" and the user is on
 * a paid plan, an AI suggestion is generated and returned.
 *
 * @param {string} apiToken
 * @param {string} sessionId
 * @param {{ speaker: "interviewer"|"candidate", text: string, timestamp_seconds: number }} entry
 * @returns {{ suggestion: object|null, reason?: string }}
 */
export async function postTranscript(apiToken, sessionId, entry) {
  const client = buildClient(apiToken);

  const user = await client.auth.me();
  if (!user) throw new Error("Invalid API token");

  // Verify ownership
  const sessions = await client.entities.InterviewSessions.filter({ id: sessionId, user_id: user.id });
  if (!sessions[0]) throw new Error("Session not found or access denied");

  // Store entry
  await client.entities.TranscriptEntries.create({
    session_id: sessionId,
    speaker: entry.speaker,
    text: entry.text,
    timestamp_seconds: entry.timestamp_seconds || 0,
  });

  // Only suggestions for interviewer turns on paid plans
  if (entry.speaker !== "interviewer") return { suggestion: null };
  if ((user.plan || "free") === "free") return { suggestion: null, reason: "upgrade_required" };

  // Poll for the latest suggestion (generated server-side by the backend function)
  // The backend function sessionTranscript.js handles LLM generation.
  // The extension can also poll getLatestSuggestion() for updates.
  const latest = await client.entities.AISuggestions.filter(
    { session_id: sessionId },
    "-created_date",
    1
  );
  return { suggestion: latest[0] || null };
}

/**
 * POST /sessions/{id}/end
 *
 * Marks the session completed and triggers debrief generation.
 *
 * @param {string} apiToken
 * @param {string} sessionId
 * @returns {{ success: boolean }}
 */
export async function endSession(apiToken, sessionId) {
  const client = buildClient(apiToken);

  const user = await client.auth.me();
  if (!user) throw new Error("Invalid API token");

  const sessions = await client.entities.InterviewSessions.filter({ id: sessionId, user_id: user.id });
  if (!sessions[0]) throw new Error("Session not found or access denied");

  await client.entities.InterviewSessions.update(sessionId, {
    status: "completed",
    ended_at: new Date().toISOString(),
  });

  // Increment usage counter
  const currentUsed = user.interviews_used_this_month || 0;
  await client.auth.updateMe({ interviews_used_this_month: currentUsed + 1 });

  // Debrief generation is handled by the sessionEnd backend function.
  // The web app's SessionReport page will poll until the report appears.
  return { success: true };
}

/**
 * GET /sessions/{id}/report
 *
 * Polls for the debrief report. Returns { status: "pending" } until ready.
 *
 * @param {string} apiToken
 * @param {string} sessionId
 * @returns {{ status: "ready"|"pending", report?: object }}
 */
export async function getReport(apiToken, sessionId) {
  const client = buildClient(apiToken);

  const user = await client.auth.me();
  if (!user) throw new Error("Invalid API token");

  const sessions = await client.entities.InterviewSessions.filter({ id: sessionId, user_id: user.id });
  if (!sessions[0]) throw new Error("Session not found or access denied");

  const reports = await client.entities.DebriefReports.filter({ session_id: sessionId });
  if (!reports[0]) return { status: "pending" };
  return { status: "ready", report: reports[0] };
}

/**
 * GET /sessions/{id}/suggestions/latest
 *
 * Returns the most recent AISuggestion. Poll this at ~2s intervals
 * during an active session to update the coaching overlay.
 *
 * @param {string} apiToken
 * @param {string} sessionId
 * @returns {{ suggestion: object|null }}
 */
export async function getLatestSuggestion(apiToken, sessionId) {
  const client = buildClient(apiToken);

  const user = await client.auth.me();
  if (!user) throw new Error("Invalid API token");

  const sessions = await client.entities.InterviewSessions.filter({ id: sessionId, user_id: user.id });
  if (!sessions[0]) throw new Error("Session not found or access denied");

  const suggestions = await client.entities.AISuggestions.filter(
    { session_id: sessionId },
    "-created_date",
    1
  );
  return { suggestion: suggestions[0] || null };
}
