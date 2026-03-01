import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SETTINGS_ID = '__APP_SETTINGS__';
const DEFAULT_FREE_LIMIT = 2;

const ALLOWED_INTERVIEW_TYPES = new Set(['behavioral', 'technical', 'hr', 'final_round']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const cvProfileId = body?.cv_profile_id;
    const jobTitle = body?.job_title?.trim();
    const companyName = body?.company_name?.trim();
    const jobDescription = body?.job_description?.trim();
    const interviewType = body?.interview_type;

    if (!cvProfileId || !jobTitle || !companyName || !jobDescription || !interviewType) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!ALLOWED_INTERVIEW_TYPES.has(interviewType)) {
      return Response.json({ error: 'Invalid interview_type' }, { status: 400 });
    }

    const profiles = await base44.entities.CVProfiles.filter({ id: cvProfileId });
    const profile = profiles?.[0];

    if (!profile) {
      return Response.json({ error: 'Invalid cv_profile_id for current user' }, { status: 403 });
    }

    // Read free_plan_session_limit from app settings
    let freeLimit = DEFAULT_FREE_LIMIT;
    try {
      const settingsRecords = await base44.entities.DebriefReports.filter({ session_id: SETTINGS_ID });
      const settingsRecord = settingsRecords?.[0];
      if (settingsRecord?.summary) {
        const appSettings = JSON.parse(settingsRecord.summary);
        if (typeof appSettings.free_plan_session_limit === 'number') {
          freeLimit = appSettings.free_plan_session_limit;
        }
      }
    } catch {
      // use default
    }

    const PLAN_LIMITS: Record<string, number> = {
      free: freeLimit,
      pro: Number.POSITIVE_INFINITY,
      pro_plus: Number.POSITIVE_INFINITY,
    };

    const freshUser = await base44.auth.me();
    const plan = freshUser?.plan || 'free';
    const used = freshUser?.interviews_used_this_month || 0;
    const limit = PLAN_LIMITS[plan] ?? freeLimit;

    if (Number.isFinite(limit) && used >= limit) {
      return Response.json({ error: 'Plan interview limit reached' }, { status: 403 });
    }

    const session = await base44.entities.InterviewSessions.create({
      cv_profile_id: cvProfileId,
      job_title: jobTitle,
      company_name: companyName,
      job_description: jobDescription,
      interview_type: interviewType,
      status: 'setup',
      started_at: null,
    });

    return Response.json({ session });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
