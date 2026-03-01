import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SETTINGS_SENTINEL = '__APP_SETTINGS__';

const DEFAULTS = {
  maintenance_mode: false,
  signups_enabled: true,
  free_plan_session_limit: 2,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await base44.entities.DebriefReports.filter({ session_id: SETTINGS_SENTINEL });
    if (!records || records.length === 0) {
      return Response.json(DEFAULTS);
    }

    try {
      const settings = JSON.parse(records[0].summary || '{}');
      return Response.json({ ...DEFAULTS, ...settings });
    } catch {
      return Response.json(DEFAULTS);
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
