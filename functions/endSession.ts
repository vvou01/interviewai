import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id } = body;

    if (!session_id) return Response.json({ error: 'session_id is required' }, { status: 400 });

    const sessions = await base44.entities.InterviewSessions.filter({ id: session_id });
    const session = sessions[0];
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    // Mark session as completed
    const updated = await base44.entities.InterviewSessions.update(session_id, {
      status: 'completed',
      ended_at: new Date().toISOString(),
    });

    // Trigger debrief generation asynchronously
    base44.functions.invoke('generateDebrief', { session_id }).catch(() => {});

    return Response.json({ session: updated, message: 'Session ended. Debrief is being generated.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});