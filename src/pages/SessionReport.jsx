import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Briefcase, Calendar, TrendingUp, TrendingDown, CheckCircle2,
  Copy, Check, Loader2, ArrowLeft, Mail
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ScoreBadge from "@/components/shared/ScoreBadge";

export default function SessionReport({ user }) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("id");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const sessions = await base44.entities.InterviewSessions.filter({ id: sessionId });
      return sessions[0];
    },
    enabled: !!sessionId,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["report", sessionId],
    queryFn: () => base44.entities.DebriefReports.filter({ session_id: sessionId }),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return (!data || data.length === 0) ? 5000 : false;
    },
  });

  const report = reports[0];

  if (isLoading || !report) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Generating Your Report</h2>
        <p className="text-sm text-slate-500">Analyzing your interview performance... This may take a minute.</p>
      </div>
    );
  }

  const copyEmail = () => {
    navigator.clipboard.writeText(report.follow_up_email_draft || "");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link to={createPageUrl("History")} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      {/* Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <ScoreBadge score={report.overall_score} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{session?.job_title}</h1>
          <p className="text-slate-400">{session?.company_name}</p>
          {session?.created_date && (
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(session.created_date), "MMMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-lg mb-3">Summary</h2>
        <p className="text-slate-300 leading-relaxed">{report.summary}</p>
      </div>

      {/* Strengths & Missed Opp */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold">Strongest Moments</h2>
          </div>
          <div className="space-y-2">
            {(report.strongest_moments || []).map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 text-sm text-slate-300">
                {m}
              </div>
            ))}
            {(!report.strongest_moments || report.strongest_moments.length === 0) && (
              <p className="text-sm text-slate-500">No data available</p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold">Missed Opportunities</h2>
          </div>
          <div className="space-y-2">
            {(report.missed_opportunities || []).map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 text-sm text-slate-300">
                {m}
              </div>
            ))}
            {(!report.missed_opportunities || report.missed_opportunities.length === 0) && (
              <p className="text-sm text-slate-500">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Questions Analysis */}
      {report.questions_analysis && report.questions_analysis.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="font-semibold text-lg">Questions Analysis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Question</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quality</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody>
                {report.questions_analysis.map((qa, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="px-5 py-3 text-sm text-slate-300">{qa.question}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        qa.answer_quality === "excellent" ? "bg-emerald-500/10 text-emerald-400" :
                        qa.answer_quality === "good" ? "bg-blue-500/10 text-blue-400" :
                        qa.answer_quality === "average" ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {qa.answer_quality}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{qa.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Items */}
      {report.action_items && report.action_items.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4">Action Items</h2>
          <div className="space-y-2">
            {report.action_items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Email */}
      {report.follow_up_email_draft && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-lg">Follow-up Email Draft</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyEmail}
              className="text-slate-400 hover:text-white"
            >
              {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5">{copiedEmail ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {report.follow_up_email_draft}
          </div>
        </div>
      )}
    </div>
  );
}