import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id } = body;

    if (!session_id) return Response.json({ error: 'session_id is required' }, { status: 400 });

    // Get all data
    const [sessions, transcriptEntries] = await Promise.all([
      base44.entities.InterviewSessions.filter({ id: session_id }),
      base44.entities.TranscriptEntries.filter({ session_id }, 'timestamp_seconds'),
    ]);

    const session = sessions[0];
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    const cvProfiles = await base44.entities.CVProfiles.filter({ id: session.cv_profile_id });
    const cvProfile = cvProfiles[0];

    const transcriptText = transcriptEntries
      .map(e => `[${e.speaker.toUpperCase()}]: ${e.text}`)
      .join('\n');

    const prompt = `You are an expert interview coach generating a comprehensive post-interview debrief report.

CANDIDATE CV:
${cvProfile?.cv_text || 'Not provided'}

JOB: ${session.job_title} at ${session.company_name}
INTERVIEW TYPE: ${session.interview_type}
JOB DESCRIPTION: ${session.job_description || 'Not provided'}

FULL INTERVIEW TRANSCRIPT:
${transcriptText || 'No transcript available'}

Generate a detailed debrief report. Respond with JSON exactly matching this schema:
{
  "overall_score": number (1-10),
  "summary": "string - 2-3 paragraph comprehensive summary",
  "strongest_moments": ["string"] (3-5 items),
  "missed_opportunities": ["string"] (2-4 items),
  "questions_analysis": [{"question": "string", "answer_quality": "excellent|good|average|poor", "notes": "string"}],
  "action_items": ["string"] (3-5 specific action items for improvement),
  "follow_up_email_draft": "string - professional follow-up thank you email"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].text;
    let debrief;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      debrief = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    if (!debrief) return Response.json({ error: 'No debrief generated' }, { status: 500 });

    // Save report and update session score
    const [report] = await Promise.all([
      base44.entities.DebriefReports.create({ session_id, ...debrief }),
      base44.entities.InterviewSessions.update(session_id, { overall_score: debrief.overall_score }),
    ]);

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});