import React from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

const TYPE_COLORS = {
  behavioral: "bg-blue-100 text-blue-700 border-blue-200",
  technical: "bg-purple-100 text-purple-700 border-purple-200",
  hr: "bg-emerald-100 text-emerald-700 border-emerald-200",
  final_round: "bg-orange-100 text-orange-700 border-orange-200",
};

function ScoreCircle({ score }) {
  const ring =
    score >= 8 ? "bg-emerald-500 shadow-emerald-100"
    : score >= 5 ? "bg-amber-500 shadow-amber-100"
    : "bg-red-500 shadow-red-100";

  return (
    <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg flex-shrink-0 ${ring}`}>
      <span className="text-2xl font-bold text-white leading-none">{score}</span>
      <span className="text-[10px] text-white/80 font-medium mt-0.5">/10</span>
    </div>
  );
}

export default function ReportHeader({ session, report, typeLabel }) {
  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <ScoreCircle score={report.overall_score} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{session?.job_title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-slate-500 font-medium">{session?.company_name}</span>
            {typeLabel && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TYPE_COLORS[session?.interview_type] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                {typeLabel}
              </span>
            )}
          </div>
          {session?.created_date && (
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(session.created_date), "d MMMM yyyy")}
            </div>
          )}
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-2 font-medium">Overall Performance</p>
          {report.summary && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{report.summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}