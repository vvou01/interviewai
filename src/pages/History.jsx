import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Briefcase, ArrowRight } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ScoreBadge from "@/components/shared/ScoreBadge";

const filters = ["all", "completed", "abandoned"];
const typeLabels = { behavioral: "Behavioral", technical: "Technical", hr: "HR", final_round: "Final Round" };

export default function History({ user }) {
  const [filter, setFilter] = useState("all");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => base44.entities.InterviewSessions.list("-created_date"),
  });

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Session History</h1>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No sessions found</p>
          <p className="text-sm text-slate-400">{filter !== "all" ? "Try a different filter." : "Start your first interview session."}</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Job Title</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-500">{s.created_date ? format(new Date(s.created_date), "MMM d, yyyy") : "-"}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">{s.company_name}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{s.job_title}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{typeLabels[s.interview_type] || s.interview_type}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">{s.overall_score ? <ScoreBadge score={s.overall_score} size="sm" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3">
                      {s.status === "completed" && (
                        <Link to={createPageUrl(`SessionReport?id=${s.id}`)} className="text-violet-600 hover:text-violet-700 text-sm flex items-center gap-1">
                          Report <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}