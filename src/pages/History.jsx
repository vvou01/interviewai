import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInMinutes } from "date-fns";
import { Briefcase, Search, ArrowRight, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/shared/StatusBadge";
import ScoreBadge from "@/components/shared/ScoreBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_TABS = ["all", "completed", "active", "setup", "abandoned"];
const PAGE_SIZE = 20;

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

const EMPTY_MESSAGES = {
  all: "No interviews yet",
  completed: "No completed interviews yet",
  active: "No active sessions",
  setup: "No sessions in setup",
  abandoned: "No abandoned sessions",
};

function duration(s) {
  if (!s.started_at || !s.ended_at) return null;
  const mins = differenceInMinutes(new Date(s.ended_at), new Date(s.started_at));
  return mins > 0 ? `${mins} min` : null;
}

export default function History({ user }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["history-sessions", user?.id],
    queryFn: () => base44.entities.InterviewSessions.filter({ created_by: user?.id }, "-created_date"),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InterviewSessions.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history-sessions"] }),
  });

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (activeTab !== "all") list = list.filter(s => s.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.company_name?.toLowerCase().includes(q) ||
        s.job_title?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === "newest") return new Date(b.created_date) - new Date(a.created_date);
      if (sort === "oldest") return new Date(a.created_date) - new Date(b.created_date);
      if (sort === "highest") return (b.overall_score || 0) - (a.overall_score || 0);
      if (sort === "lowest") return (a.overall_score || 0) - (b.overall_score || 0);
      return 0;
    });
    return list;
  }, [sessions, activeTab, search, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (tab) => { setActiveTab(tab); setPage(1); };
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interview History</h1>
          <p className="text-sm text-slate-400 mt-0.5">{sessions.length} interview{sessions.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tab filters */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 overflow-x-auto flex-shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search company or job title..."
            className="pl-9 bg-white"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-300"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest score</option>
          <option value="lowest">Lowest score</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{EMPTY_MESSAGES[activeTab] || "No sessions found"}</p>
          {activeTab !== "all" && (
            <p className="text-sm text-slate-400 mt-1">Try changing the filter above.</p>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {paginated.map((s, i) => {
              const isCompleted = s.status === "completed";
              const isSetupOrActive = s.status === "setup" || s.status === "active";
              const dur = duration(s);

              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}
                >
                  {/* Date */}
                  <div className="hidden sm:block w-24 flex-shrink-0 text-sm text-slate-400">
                    {s.created_date ? format(new Date(s.created_date), "d MMM yyyy") : "—"}
                  </div>

                  {/* Company + Title */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{s.company_name}</p>
                    <p className="text-sm text-slate-500 truncate">{s.job_title}</p>
                  </div>

                  {/* Type badge */}
                  <span className={`hidden md:inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${TYPE_COLORS[s.interview_type] || "bg-slate-100 text-slate-600"}`}>
                    {TYPE_LABELS[s.interview_type] || s.interview_type}
                  </span>

                  {/* Duration */}
                  {dur && <span className="hidden lg:block text-xs text-slate-400 flex-shrink-0">{dur}</span>}

                  {/* Score */}
                  {s.overall_score ? <ScoreBadge score={s.overall_score} size="sm" /> : <div className="w-10" />}

                  {/* Status */}
                  <StatusBadge status={s.status} />

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCompleted && (
                      <Link to={createPageUrl(`SessionReport?id=${s.id}`)} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                        View Report <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {isSetupOrActive && (
                      <Link to={createPageUrl(s.status === "active" ? `SessionActive?id=${s.id}` : `NewSession?id=${s.id}`)} className="text-xs text-slate-600 hover:text-slate-800 font-medium">
                        Continue
                      </Link>
                    )}
                    {s.status === "abandoned" && (
                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}