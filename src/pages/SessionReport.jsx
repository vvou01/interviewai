import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, TrendingUp, TrendingDown, CheckCircle2, Copy, Check, Loader2, ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import ScoreBadge from "@/components/shared/ScoreBadge";

export default function SessionReport({ user }) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("id");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => { const s = await base44.entities.InterviewSessions.filter({ id: sessionId }); return s[0]; },
    enabled: !!sessionId,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["report", sessionId],
    queryFn: () => base44.entities.DebriefReports.filter({ session_id: sessionId }),
    enabled: !!sessionId,
    refetchInterval: (query) => (!query.state.data || query.state.data.length === 0) ? 5000 : false,
  });

  const report = reports[0];

  if (isLoading || !report) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Generating Your Report</h2>
        <p className="text-sm text-slate-500">Analyzing your interview performance...</p>
      </div>
    );
  }

  const copyEmail = () => { navigator.clipboard.writeText(report.follow_up_email_draft || ""); setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to={createPageUrl("History")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <ScoreBadge score={report.overall_score} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{session?.job_title}</h1>
          <p className="text-slate-500">{session?.company_name}</p>
          {session?.created_date && (
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(session.created_date), "MMMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold text-lg mb-3 text-slate-800">Summary</h2>
        <p className="text-slate-600 leading-relaxed">{report.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">Strongest Moments</h2>
          </div>
          <div className="space-y-2">
            {(report.strongest_moments || []).map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-slate-700">{m}</div>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-slate-800">Missed Opportunities</h2>
          </div>
          <div className="space-y-2">
            {(report.missed_opportunities || []).map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-slate-700">{m}</div>
            ))}
          </div>
        </div>
      </div>

      {report.questions_analysis && report.questions_analysis.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-lg text-slate-800">Questions Analysis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Question</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quality</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody>
                {report.questions_analysis.map((qa, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-sm text-slate-700">{qa.question}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        qa.answer_quality === "excellent" ? "bg-emerald-100 text-emerald-700" :
                        qa.answer_quality === "good" ? "bg-blue-100 text-blue-700" :
                        qa.answer_quality === "average" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{qa.answer_quality}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{qa.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report.action_items && report.action_items.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4 text-slate-800">Action Items</h2>
          <div className="space-y-2">
            {report.action_items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.follow_up_email_draft && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-600" />
              <h2 className="font-semibold text-lg text-slate-800">Follow-up Email Draft</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={copyEmail} className="text-slate-500">
              {copiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5">{copiedEmail ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
            {report.follow_up_email_draft}
          </div>
        </div>
      )}
    </div>
  );
}