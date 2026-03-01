import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Save, Check, Users, BarChart3, Activity, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import ScoreBadge from "@/components/shared/ScoreBadge";

const TYPE_LABELS = {
  behavioral: "Behavioral",
  technical: "Technical",
  hr: "HR",
  final_round: "Final Round",
};

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-violet-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <span className="text-3xl font-bold text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

export default function Admin({ user }) {
  const { toast } = useToast();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [freePlanSessionLimit, setFreePlanSessionLimit] = useState(2);
  const [saved, setSaved] = useState(false);

  const { data: appSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["appSettings"],
    queryFn: () => base44.functions.invoke("getAppSettings"),
    enabled: user?.role === "admin",
  });

  const { data: adminStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => base44.functions.invoke("getAdminStats"),
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (appSettings) {
      setMaintenanceMode(appSettings.maintenance_mode ?? false);
      setSignupsEnabled(appSettings.signups_enabled ?? true);
      setFreePlanSessionLimit(appSettings.free_plan_session_limit ?? 2);
    }
  }, [appSettings]);

  const saveMut = useMutation({
    mutationFn: () =>
      base44.functions.invoke("saveAppSettings", {
        maintenance_mode: maintenanceMode,
        signups_enabled: signupsEnabled,
        free_plan_session_limit: Number(freePlanSessionLimit) || 2,
      }),
    onSuccess: () => {
      toast({ title: "Settings saved", description: "App settings have been updated." });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      toast({ title: "Save failed", description: err?.message || "Could not save settings.", variant: "destructive" });
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <div className="glass-card p-10">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const stats = adminStats?.stats;
  const recentSessions = adminStats?.recent_sessions ?? [];
  const users = adminStats?.users ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Sessions" value={stats?.total} color="bg-violet-100 text-violet-600" />
        <StatCard icon={Activity} label="Active" value={stats?.active} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={Check} label="Completed" value={stats?.completed} color="bg-blue-100 text-blue-600" />
        <StatCard icon={BarChart3} label="Avg Score" value={stats?.avg_score ? `${stats.avg_score}/10` : null} color="bg-amber-100 text-amber-600" />
      </div>

      {/* Session Overview */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-lg text-slate-800">Recent Sessions</h2>
          <p className="text-sm text-slate-400 mt-0.5">Last 20 sessions across all users</p>
        </div>
        {isLoadingStats ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading sessions...</div>
        ) : recentSessions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No sessions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Job Title</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800 truncate max-w-[140px]">{s.company_name}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[160px] hidden md:table-cell">{s.job_title}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{TYPE_LABELS[s.interview_type] || s.interview_type}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {s.overall_score ? <ScoreBadge score={s.overall_score} size="sm" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {s.created_date ? formatDistanceToNow(new Date(s.created_date), { addSuffix: true }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Activity */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-lg text-slate-800">User Activity</h2>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Top users by session count</p>
        </div>
        {isLoadingStats ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No user data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">User ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Sessions</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{u.id?.slice(0, 16)}…</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.session_count}</td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {u.last_active ? formatDistanceToNow(new Date(u.last_active), { addSuffix: true }) : "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feature Flags */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-3">Feature Flags</h2>

        {isLoadingSettings ? (
          <div className="py-6 text-center text-slate-400 text-sm">Loading settings...</div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Maintenance Mode</p>
                <p className="text-sm text-slate-400 mt-0.5">Show a maintenance message to all users</p>
              </div>
              <Toggle value={maintenanceMode} onChange={setMaintenanceMode} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Signups Enabled</p>
                <p className="text-sm text-slate-400 mt-0.5">Allow new users to register</p>
              </div>
              <Toggle value={signupsEnabled} onChange={setSignupsEnabled} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="font-medium text-slate-700">Free Plan Session Limit</Label>
                <p className="text-sm text-slate-400 mt-0.5">Max interviews per month for free users</p>
              </div>
              <Input
                type="number"
                min="0"
                value={freePlanSessionLimit}
                onChange={(e) => setFreePlanSessionLimit(e.target.value)}
                className="w-24 text-center"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || isLoadingSettings}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveMut.isPending ? "Saving…" : saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>

    </div>
  );
}
