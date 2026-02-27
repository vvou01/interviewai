import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowRight, Briefcase, TrendingUp, Award, X, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import ScoreBadge from "@/components/shared/ScoreBadge";
import { Button } from "@/components/ui/button";

const planLimits = { free: 2, pro: Infinity, pro_plus: Infinity };

const TYPE_LABELS = {
  behavioral: "Behavioral",
  technical: "Technical",
  hr: "HR",
  final_round: "Final Round",
};

const TYPE_COLORS = {
  behavioral: "bg-blue-100 text-blue-700",
  technical: "bg-purple-100 text-purple-700",
  hr: "bg-emerald-100 text-emerald-700",
  final_round: "bg-orange-100 text-orange-700",
};

function getGreeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}`;
}

export default function Dashboard({ user }) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions-dashboard", user?.email],
    queryFn: () => base44.entities.InterviewSessions.filter(
      {},
      "-created_date",
      5
    ),
    enabled: !!user?.email,
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ["sessions-all", user?.email],
    queryFn: () => base44.entities.InterviewSessions.filter({}),
    enabled: !!user?.email,
  });

  const plan = user?.plan || "free";
  const used = user?.interviews_used_this_month || 0;
  const limit = planLimits[plan];
  const atLimit = plan === "free" && used >= limit;
  const usagePercent = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);

  const stats = useMemo(() => {
    const completed = allSessions.filter(s => s.status === "completed" && s.overall_score);
    const scores = completed.map(s => s.overall_score);
    return {
      total: allSessions.length,
      avg: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null,
      best: scores.length ? Math.max(...scores) : null,
    };
  }, [allSessions]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            <span className="gradient-text">{getGreeting(user?.full_name?.split(" ")[0] || "there")}</span>
          </h1>
          <p className="text-slate-500 mt-1">Ready for your next interview?</p>
        </div>

        {atLimit ? (
          <Link to={createPageUrl("Billing")}>
            <Button className="bg-slate-200 text-slate-500 hover:bg-slate-300 cursor-pointer">
              Interview Limit Reached
            </Button>
          </Link>
        ) : (
          <Link to={createPageUrl("NewSession")}>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-violet-200 gap-2 px-6">
              <Plus className="w-4 h-4" /> Start New Interview
            </Button>
          </Link>
        )}
      </div>

      {/* Upgrade banner */}
      {plan === "free" && !bannerDismissed && (
        <div className="relative rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white flex items-center gap-4">
          <Zap className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Unlock unlimited interviews + live AI coaching</p>
            <p className="text-sm text-white/80 mt-0.5">Upgrade to Pro to get real-time suggestions while you answer.</p>
          </div>
          <Link to={createPageUrl("Billing")}>
            <Button size="sm" className="bg-white text-violet-700 hover:bg-white/90 font-semibold flex-shrink-0">
              Upgrade to Pro
            </Button>
          </Link>
          <button onClick={() => setBannerDismissed(true)} className="absolute top-3 right-3 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Usage meter */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </div>
            <span className="font-medium text-slate-700">Interviews This Month</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {used}{limit !== Infinity ? ` of ${limit}` : " used"}
          </span>
        </div>
        {limit !== Infinity && (
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-purple-500"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">Resets on the 1st of each month</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Total Interviews</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Average Score</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">{stats.avg ?? "—"}</span>
          {stats.avg && <span className="text-sm text-slate-400">/10</span>}
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">Best Score</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">{stats.best ?? "—"}</span>
          {stats.best && <span className="text-sm text-slate-400">/10</span>}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-lg text-slate-800">Recent Sessions</h2>
          <Link to={createPageUrl("History")} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No interviews yet — start your first one!</p>
            <Link to={createPageUrl("NewSession")}>
              <Button size="sm" className="mt-3 bg-violet-600 hover:bg-violet-700 text-white">Start Interview</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{s.company_name}</p>
                  <p className="text-sm text-slate-500 truncate">{s.job_title}</p>
                </div>
                <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[s.interview_type] || "bg-slate-100 text-slate-600"}`}>
                  {TYPE_LABELS[s.interview_type] || s.interview_type}
                </span>
                <span className="hidden md:block text-xs text-slate-400">
                  {s.created_date ? formatDistanceToNow(new Date(s.created_date), { addSuffix: true }) : ""}
                </span>
                <StatusBadge status={s.status} />
                {s.overall_score && <ScoreBadge score={s.overall_score} size="sm" />}
                <div className="flex-shrink-0">
                  {s.status === "completed" ? (
                    <Link to={createPageUrl(`SessionReport?id=${s.id}`)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                      View Report
                    </Link>
                  ) : s.status === "setup" || s.status === "active" ? (
                    <Link to={createPageUrl(s.status === "active" ? `SessionActive?id=${s.id}` : `NewSession?id=${s.id}`)} className="text-xs text-slate-600 hover:text-slate-800 font-medium">
                      Continue
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}