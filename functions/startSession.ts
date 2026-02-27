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

    if (session.status === 'active') {
      return Response.json({ session, message: 'Session already active' });
    }

    const updated = await base44.entities.InterviewSessions.update(session_id, {
      status: 'active',
      started_at: new Date().toISOString(),
    });

    // Increment interviews_used_this_month on user
    const currentUsed = user.interviews_used_this_month || 0;
    await base44.auth.updateMe({ interviews_used_this_month: currentUsed + 1 });

    return Response.json({ session: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});