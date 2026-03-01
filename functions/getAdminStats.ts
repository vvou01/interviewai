import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Backend functions are not user-scoped — returns ALL sessions across all users
    const allSessions = await base44.entities.InterviewSessions.filter({});

    const total = allSessions.length;
    const active = allSessions.filter((s: any) => s.status === 'active').length;
    const completed = allSessions.filter((s: any) => s.status === 'completed').length;
    const scores = allSessions.filter((s: any) => s.overall_score).map((s: any) => s.overall_score);
    const avgScore = scores.length
      ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
      : null;

    const recentSessions = [...allSessions]
      .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, 20)
      .map((s: any) => ({
        id: s.id,
        company_name: s.company_name,
        job_title: s.job_title,
        interview_type: s.interview_type,
        status: s.status,
        overall_score: s.overall_score,
        created_date: s.created_date,
        created_by: s.created_by,
      }));

    const userMap: Record<string, { session_count: number; last_active: string }> = {};
    for (const s of allSessions as any[]) {
      const uid = s.created_by;
      if (!uid) continue;
      if (!userMap[uid]) userMap[uid] = { session_count: 0, last_active: s.created_date };
      userMap[uid].session_count++;
      if (new Date(s.created_date) > new Date(userMap[uid].last_active)) {
        userMap[uid].last_active = s.created_date;
      }
    }
    const users = Object.entries(userMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.session_count - a.session_count)
      .slice(0, 10);

    return Response.json({
      stats: { total, active, completed, avg_score: avgScore },
      recent_sessions: recentSessions,
      users,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
