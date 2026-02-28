import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id, speaker, text, timestamp_seconds } = body;

    if (!session_id || !text) {
      return Response.json({ error: 'session_id and text are required' }, { status: 400 });
    }

    // Save the already-transcribed entry (transcription happens client-side via Deepgram)
    await base44.entities.TranscriptEntries.create({
      session_id,
      speaker: speaker || 'unknown',
      text,
      timestamp_seconds: timestamp_seconds || 0,
      created_by: user.id,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
