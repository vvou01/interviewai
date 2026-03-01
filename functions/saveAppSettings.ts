import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SETTINGS_ID = '__APP_SETTINGS__';
const HARD_CODED_ADMINS = ['deschepper.wj@gmail.com', 'vvouter1@gmail.com'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin' && !HARD_CODED_ADMINS.includes(user.email)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const settings = body?.settings;

    if (!settings || typeof settings !== 'object') {
      return Response.json({ error: 'settings object is required' }, { status: 400 });
    }

    const summary = JSON.stringify(settings);

    const existing = await base44.entities.DebriefReports.filter({ session_id: SETTINGS_ID });
    if (existing?.[0]) {
      await base44.entities.DebriefReports.update(existing[0].id, { summary });
    } else {
      await base44.entities.DebriefReports.create({ session_id: SETTINGS_ID, summary });
    }

    return Response.json({ success: true, settings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
