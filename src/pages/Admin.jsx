import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, ShieldAlert, Users, BarChart3, SlidersHorizontal } from "lucide-react";

import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HARD_CODED_ADMINS = ["deschepper.wj@gmail.com", "vvouter1@gmail.com"];
const PRO_PRICE = 29;
const PRO_PLUS_PRICE = 79;

const formatDate = (value) => {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy");
};

const durationText = (session) => {
  if (session?.started_at && session?.ended_at) {
    const seconds = Math.max(0, Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 1000));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  if (typeof session?.duration_seconds === "number") {
    const seconds = Math.max(0, Math.round(session.duration_seconds));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return "—";
};

const wordsInEntry = (text = "") => text.trim().split(/\s+/).filter(Boolean).length;

export default function Admin({ user }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [featureFlags, setFeatureFlags] = useState(() => {
    const cached = localStorage.getItem("admin_feature_flags");
    return cached
      ? JSON.parse(cached)
      : { maintenanceMode: false, signupEnabled: true, freeSessionLimit: 2 };
  });

  const isAdmin = user?.role === "admin" || HARD_CODED_ADMINS.includes(user?.email || "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    if (userId) setSelectedUserId(userId);
  }, []);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const userEntity = base44.entities.Users || base44.entities.User;
      if (!userEntity?.filter) return [];
      return userEntity.filter({}, "-created_date");
    },
    enabled: isAdmin,
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: () => base44.entities.InterviewSessions.filter({}, "-created_date"),
    enabled: isAdmin,
  });

  const { data: transcriptEntries = [], isLoading: loadingTranscripts } = useQuery({
    queryKey: ["admin-transcript-entries"],
    queryFn: () => base44.entities.TranscriptEntries.filter({}),
    enabled: isAdmin,
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }) => {
      const userEntity = base44.entities.Users || base44.entities.User;
      if (!userEntity?.update) {
        throw new Error("User entity not available in this app.");
      }
      return userEntity.update(userId, { plan });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.full_name || u.name || "").toLowerCase();
      return email.includes(q) || name.includes(q);
    });
  }, [users, search]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const statusOk = statusFilter === "all" || s.status === statusFilter;
      const userOk = !selectedUserId || s.created_by === selectedUserId || s.created_by?.id === selectedUserId;
      return statusOk && userOk;
    });
  }, [sessions, statusFilter, selectedUserId]);

  const sessionStats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = new Date(startToday);
    startWeek.setDate(startWeek.getDate() - 7);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: sessions.length,
      today: sessions.filter((s) => new Date(s.created_date) >= startToday).length,
      week: sessions.filter((s) => new Date(s.created_date) >= startWeek).length,
      month: sessions.filter((s) => new Date(s.created_date) >= startMonth).length,
    };
  }, [sessions]);

  const platformStats = useMemo(() => {
    const freeUsers = users.filter((u) => !u.plan || u.plan === "free").length;
    const proUsers = users.filter((u) => u.plan === "pro").length;
    const proPlusUsers = users.filter((u) => u.plan === "pro_plus").length;
    const totalWords = transcriptEntries.reduce((sum, entry) => sum + wordsInEntry(entry.text), 0);

    return {
      totalUsers: users.length,
      freeUsers,
      proUsers,
      proPlusUsers,
      transcriptCount: transcriptEntries.length,
      totalWords,
      revenueEstimate: proUsers * PRO_PRICE + proPlusUsers * PRO_PLUS_PRICE,
    };
  }, [users, transcriptEntries]);

  const setFlag = (key, value) => {
    const next = { ...featureFlags, [key]: value };
    setFeatureFlags(next);
    localStorage.setItem("admin_feature_flags", JSON.stringify(next));
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h1 className="text-lg font-semibold text-red-700">Access denied</h1>
            <p className="text-sm text-red-600 mt-1">This page is available to admins only.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 mt-1">Manage users, sessions, platform metrics, and feature flags.</p>
      </div>

      <section className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-violet-600" /> User Management</h2>
          <p className="text-sm text-slate-500">Total users: <span className="font-semibold text-slate-800">{users.length}</span></p>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Search by email or name..."
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Total Sessions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">Loading users...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No users found.</TableCell></TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const userSessionCount = sessions.filter((s) => s.created_by === u.id || s.created_by?.id === u.id).length;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-slate-700">{u.email || "—"}</TableCell>
                      <TableCell>{u.full_name || u.name || "—"}</TableCell>
                      <TableCell className="capitalize">{(u.plan || "free").replace("_", " ")}</TableCell>
                      <TableCell>{formatDate(u.created_date)}</TableCell>
                      <TableCell>{formatDate(u.last_active || u.updated_date)}</TableCell>
                      <TableCell>{userSessionCount}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => updatePlanMutation.mutate({ userId: u.id, plan: "pro" })}>Promote Pro</Button>
                        <Button size="sm" variant="outline" onClick={() => updatePlanMutation.mutate({ userId: u.id, plan: "pro_plus" })}>Promote Pro+</Button>
                        <Button size="sm" variant="outline" onClick={() => updatePlanMutation.mutate({ userId: u.id, plan: "free" })}>Downgrade Free</Button>
                        <Link to={`${createPageUrl("Admin")}?userId=${u.id}#session-overview`}>
                          <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white" onClick={() => setSelectedUserId(u.id)}>View Sessions</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section id="session-overview" className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-violet-600" /> Session Overview</h2>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="setup">Setup</option>
            </select>
            {selectedUserId && (
              <Button size="sm" variant="outline" onClick={() => setSelectedUserId("")}>Clear User Filter</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            ["Total sessions", sessionStats.total],
            ["Today", sessionStats.today],
            ["This week", sessionStats.week],
            ["This month", sessionStats.month],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-400">{label}</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingSessions ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">Loading sessions...</TableCell></TableRow>
              ) : filteredSessions.slice(0, 25).map((s) => {
                const owner = users.find((u) => u.id === s.created_by || u.id === s.created_by?.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell>{owner?.email || "Unknown"}</TableCell>
                    <TableCell className="capitalize">{s.status || "—"}</TableCell>
                    <TableCell>{durationText(s)}</TableCell>
                    <TableCell>{formatDate(s.created_date)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="glass-card p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-violet-600" /> Platform Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400 uppercase">Total users</p><p className="text-xl font-semibold text-slate-900">{platformStats.totalUsers}</p><p className="text-sm text-slate-500 mt-1">Free {platformStats.freeUsers} / Pro {platformStats.proUsers} / Pro+ {platformStats.proPlusUsers}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400 uppercase">Transcript entries</p><p className="text-xl font-semibold text-slate-900">{loadingTranscripts ? "…" : platformStats.transcriptCount}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400 uppercase">Total words transcribed</p><p className="text-xl font-semibold text-slate-900">{loadingTranscripts ? "…" : platformStats.totalWords.toLocaleString()}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400 uppercase">Revenue estimate / month</p><p className="text-xl font-semibold text-slate-900">${platformStats.revenueEstimate.toLocaleString()}</p><p className="text-sm text-slate-500 mt-1">Assumes ${PRO_PRICE}/Pro and ${PRO_PLUS_PRICE}/Pro+</p></div>
        </div>
      </section>

      <section className="glass-card p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-violet-600" /> Feature Flags</h2>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Maintenance mode</p>
              <p className="text-sm text-slate-500">When enabled, non-admin users should be blocked from the app.</p>
            </div>
            <Switch checked={featureFlags.maintenanceMode} onCheckedChange={(value) => setFlag("maintenanceMode", value)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">New user signups enabled</p>
              <p className="text-sm text-slate-500">Toggle onboarding availability for new users.</p>
            </div>
            <Switch checked={featureFlags.signupEnabled} onCheckedChange={(value) => setFlag("signupEnabled", value)} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800">Free plan session limit</p>
              <p className="text-sm text-slate-500">Editable cap for free plan monthly sessions.</p>
            </div>
            <Input
              type="number"
              min={0}
              className="w-24"
              value={featureFlags.freeSessionLimit}
              onChange={(e) => setFlag("freeSessionLimit", Number(e.target.value || 0))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
