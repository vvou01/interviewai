import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SETTINGS_SENTINEL = '__APP_SETTINGS__';
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

    const freshUser = await base44.auth.me();
    const plan = freshUser?.plan || 'free';
    const used = freshUser?.interviews_used_this_month || 0;

    // Load dynamic free plan limit from app settings
    let freePlanLimit = 2;
    try {
      const settingsRecords = await base44.entities.DebriefReports.filter({ session_id: SETTINGS_SENTINEL });
      if (settingsRecords?.length > 0) {
        const s = JSON.parse(settingsRecords[0].summary || '{}');
        if (typeof s.free_plan_session_limit === 'number') freePlanLimit = s.free_plan_session_limit;
      }
    } catch { /* use default */ }

    const planLimits: Record<string, number> = {
      free: freePlanLimit,
      pro: Number.POSITIVE_INFINITY,
      pro_plus: Number.POSITIVE_INFINITY,
    };

    const limit = planLimits[plan] ?? freePlanLimit;

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
