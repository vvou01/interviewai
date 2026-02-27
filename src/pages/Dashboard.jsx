import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowRight, Briefcase, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import ScoreBadge from "@/components/shared/ScoreBadge";
import UpgradeBanner from "@/components/shared/UpgradeBanner";

const planLimits = { free: 2, pro: Infinity, pro_plus: Infinity };

export default function Dashboard({ user }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.InterviewSessions.list("-created_date", 5),
  });

  const plan = user?.plan || "free";
  const used = user?.interviews_used_this_month || 0;
  const limit = planLimits[plan];
  const usagePercent = limit === Infinity ? 0 : (used / limit) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome back, <span className="gradient-text">{user?.full_name?.split(" ")[0] || "there"}</span>
          </h1>
          <p className="text-slate-500 mt-1">Ready for your next interview?</p>
        </div>
        <Link
          to={createPageUrl("NewSession")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-md shadow-violet-200"
        >
          <Plus className="w-4 h-4" /> New Interview
        </Link>
      </div>

      {plan === "free" && (
        <UpgradeBanner message="You're on the Free plan — upgrade to Pro for real-time AI coaching during interviews." />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-sm text-slate-500">Interviews This Month</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{used}</span>
            {limit !== Infinity && <span className="text-sm text-slate-400 mb-1">/ {limit}</span>}
          </div>
          {limit !== Infinity && (
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-slate-500">Total Sessions</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">{sessions.length}</span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm text-slate-500">Current Plan</span>
          </div>
          <span className="text-3xl font-bold text-slate-900 capitalize">{plan === "pro_plus" ? "Pro+" : plan}</span>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
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
            <p className="text-slate-500 mb-1">No sessions yet</p>
            <p className="text-sm text-slate-400">Start your first interview session to get going.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {sessions.map((s) => (
              <Link
                key={s.id}
                to={createPageUrl(
                  s.status === "completed" ? `SessionReport?id=${s.id}` :
                  s.status === "active" ? `SessionActive?id=${s.id}` :
                  `NewSession?step=4&id=${s.id}`
                )}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{s.job_title}</p>
                  <p className="text-sm text-slate-400">{s.company_name}</p>
                </div>
                <div className="hidden sm:block text-sm text-slate-400">
                  {s.created_date ? format(new Date(s.created_date), "MMM d, yyyy") : ""}
                </div>
                <StatusBadge status={s.status} />
                {s.overall_score && <ScoreBadge score={s.overall_score} size="sm" />}
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}