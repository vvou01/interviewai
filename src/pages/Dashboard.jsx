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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.full_name?.split(" ")[0] || "there"}</span>
          </h1>
          <p className="text-slate-500 mt-1">Ready for your next interview?</p>
        </div>
        <Link
          to={createPageUrl("NewSession")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25"
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
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm text-slate-400">Interviews This Month</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{used}</span>
            {limit !== Infinity && (
              <span className="text-sm text-slate-500 mb-1">/ {limit}</span>
            )}
          </div>
          {limit !== Infinity && (
            <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm text-slate-400">Total Sessions</span>
          </div>
          <span className="text-3xl font-bold text-white">{sessions.length}</span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Current Plan</span>
          </div>
          <span className="text-3xl font-bold text-white capitalize">{plan === "pro_plus" ? "Pro+" : plan}</span>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold text-lg">Recent Sessions</h2>
          <Link
            to={createPageUrl("History")}
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-1">No sessions yet</p>
            <p className="text-sm text-slate-600">Start your first interview session to get going.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {sessions.map((s) => (
              <Link
                key={s.id}
                to={createPageUrl(
                  s.status === "completed"
                    ? `SessionReport?id=${s.id}`
                    : s.status === "active"
                    ? `SessionActive?id=${s.id}`
                    : `NewSession?step=4&id=${s.id}`
                )}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 truncate">{s.job_title}</p>
                  <p className="text-sm text-slate-500">{s.company_name}</p>
                </div>
                <div className="hidden sm:block text-sm text-slate-500">
                  {s.created_date ? format(new Date(s.created_date), "MMM d, yyyy") : ""}
                </div>
                <StatusBadge status={s.status} />
                {s.overall_score && <ScoreBadge score={s.overall_score} size="sm" />}
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}