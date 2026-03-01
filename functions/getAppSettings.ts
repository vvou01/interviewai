import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SETTINGS_ID = '__APP_SETTINGS__';

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

    const records = await base44.entities.DebriefReports.filter({ session_id: SETTINGS_ID });
    const record = records?.[0];

    let settings = { ...DEFAULTS };
    if (record?.summary) {
      try {
        const parsed = JSON.parse(record.summary);
        settings = { ...DEFAULTS, ...parsed };
      } catch {
        // malformed JSON — fall back to defaults
      }
    }

    return Response.json({ settings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
