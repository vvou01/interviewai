import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id, interviewer_text } = body;

    if (!session_id || !interviewer_text) {
      return Response.json({ error: 'session_id and interviewer_text are required' }, { status: 400 });
    }

    // Get session and CV profile
    const sessions = await base44.entities.InterviewSessions.filter({ id: session_id, created_by: user.id });
    const session = sessions[0];
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    const cvProfiles = await base44.entities.CVProfiles.filter({ id: session.cv_profile_id, created_by: user.id });
    const cvProfile = cvProfiles[0];

    const prompt = `You are an expert interview coach providing REAL-TIME coaching to a job candidate during their interview.

CANDIDATE CV:
${cvProfile?.cv_text || 'Not provided'}

JOB: ${session.job_title} at ${session.company_name}
INTERVIEW TYPE: ${session.interview_type}
JOB DESCRIPTION: ${session.job_description || 'Not provided'}

INTERVIEWER JUST SAID: "${interviewer_text}"

Analyze if this is a question that requires coaching. If yes, provide structured coaching. If it's small talk or doesn't need coaching, return null for all fields.

Respond with JSON exactly matching this schema:
{
  "headline": "string or null - main coaching headline",
  "question_type": "behavioral|technical|situational|motivational|curveball or null",
  "framework": "STAR|SOAR|direct|technical_steps or null",
  "structure": [{"label": "string", "guidance": "string"}] or [],
  "cv_hook": "string or null - which specific CV experience to reference",
  "target_duration_seconds": number or null,
  "keywords_to_include": ["string"] or [],
  "things_to_avoid": ["string"] or [],
  "follow_up_questions": ["string"] or [],
  "alert_type": "warning|danger or null",
  "alert_message": "string or null",
  "coaching_note": "string or null"
}`;

    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const latency_ms = Date.now() - startTime;
    const content = message.content[0].text;

    let coaching;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      coaching = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    if (!coaching || !coaching.headline) {
      return Response.json({ coaching: null });
    }

    // Save suggestion
    const suggestion = await base44.entities.AISuggestions.create({
      session_id,
      trigger_text: interviewer_text,
      latency_ms,
      ...coaching,
    });

    return Response.json({ coaching: suggestion });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
