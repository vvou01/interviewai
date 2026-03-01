import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SETTINGS_SENTINEL = '__APP_SETTINGS__';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const settings = {
      maintenance_mode: Boolean(body.maintenance_mode),
      signups_enabled: Boolean(body.signups_enabled),
      free_plan_session_limit: Number(body.free_plan_session_limit) || 2,
    };

    const existing = await base44.entities.DebriefReports.filter({ session_id: SETTINGS_SENTINEL });
    if (existing && existing.length > 0) {
      await base44.entities.DebriefReports.update(existing[0].id, {
        summary: JSON.stringify(settings),
      });
    } else {
      await base44.entities.DebriefReports.create({
        session_id: SETTINGS_SENTINEL,
        summary: JSON.stringify(settings),
      });
    }

    return Response.json({ success: true, settings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
