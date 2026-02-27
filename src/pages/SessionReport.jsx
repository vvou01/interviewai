import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import ReportHeader from "@/components/report/ReportHeader";
import ReportSummary from "@/components/report/ReportSummary";
import StrongestMoments from "@/components/report/StrongestMoments";
import MissedOpportunities from "@/components/report/MissedOpportunities";
import QuestionsAnalysis from "@/components/report/QuestionsAnalysis";
import ActionItems from "@/components/report/ActionItems";
import FollowUpEmail from "@/components/report/FollowUpEmail";

const TYPE_LABELS = {
  behavioral: "Behavioral",
  technical: "Technical",
  hr: "HR Screening",
  final_round: "Final Round",
};

export default function SessionReport({ user }) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("id");
  const [waitedLong, setWaitedLong] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Security: fetch only sessions owned by this user
  const { data: session, isLoading: sessionLoading, isFetched: sessionFetched } = useQuery({
    queryKey: ["session", sessionId, user?.id],
    queryFn: async () => {
      const results = await base44.entities.InterviewSessions.filter({
        id: sessionId,
        created_by: user?.id,
      });
      return results[0] || null;
    },
    enabled: !!sessionId && !!user?.id,
  });

  const {
    data: reports = [],
    isError,
  } = useQuery({
    queryKey: ["report", sessionId, retryKey],
    queryFn: () => base44.entities.DebriefReports.filter({ session_id: sessionId }),
    enabled: !!sessionId && sessionFetched && !!session,
    refetchInterval: (query) => {
      const hasData = query.state.data && query.state.data.length > 0;
      return hasData ? false : 5000;
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setWaitedLong(true), 120000);
    return () => clearTimeout(timer);
  }, []);

  const report = reports[0];

  const handleExport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const company = session?.company_name || "Company";
    const jobTitle = session?.job_title || "Interview";
    let y = 20;

    const addLine = (text, size = 10, bold = false) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text || "", 170);
      doc.text(lines, 20, y);
      y += lines.length * (size * 0.45) + 4;
      if (y > 270) { doc.addPage(); y = 20; }
    };

    addLine(`${jobTitle} — ${company}`, 18, true);
    addLine(`Score: ${report.overall_score}/10  |  ${session?.created_date ? format(new Date(session.created_date), "d MMMM yyyy") : ""}`, 11);
    y += 4;
    addLine("Interview Summary", 14, true);
    addLine(report.summary || "", 10);
    y += 4;

    if (report.strongest_moments?.length) {
      addLine("What Went Well", 14, true);
      report.strongest_moments.forEach(m => addLine(`✓ ${m}`));
      y += 4;
    }

    if (report.missed_opportunities?.length) {
      addLine("Areas to Improve", 14, true);
      report.missed_opportunities.forEach(m => addLine(`⚠ ${m}`));
      y += 4;
    }

    if (report.action_items?.length) {
      addLine("Action Items", 14, true);
      report.action_items.forEach(item => addLine(`• ${item}`));
      y += 4;
    }

    if (report.questions_analysis?.length) {
      addLine("Question by Question", 14, true);
      report.questions_analysis.forEach((qa, index) => {
        addLine(`${index + 1}. ${qa.question || "Question"}`);
        addLine(`Answer Quality: ${qa.answer_quality || "Adequate"}`);
        if (qa.notes) addLine(`Notes: ${qa.notes}`);
        y += 2;
      });
    }

    if (report.follow_up_email_draft) {
      addLine("Follow-Up Email Draft", 14, true);
      addLine(report.follow_up_email_draft);
    }

    const filename = `${company}-${jobTitle}-Interview-Report.pdf`
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-_.]/g, "");
    doc.save(filename);
  };

  // Not found / unauthorised
  if (!sessionLoading && session === null) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card p-10">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Report not found</h2>
        <p className="text-sm text-slate-500 mb-6">This report doesn't exist or doesn't belong to you.</p>
        <Link to={createPageUrl("History")}>
          <Button variant="outline">← Back to History</Button>
        </Link>
      </div>
    );
  }

  // Loading / generating state
  if (!report) {
    return (
      <div className="max-w-xl mx-auto">
        <Link
          to={createPageUrl("History")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>

        {isError ? (
          <div className="glass-card p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-6">We couldn't load your report. Please try again.</p>
            <Button onClick={() => setRetryKey(k => k + 1)} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-40" />
              <div className="relative w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Generating your debrief...</h2>
            <p className="text-sm text-slate-500 mb-1">This usually takes 20–30 seconds</p>
            <p className="text-xs text-slate-400">Claude is analysing your interview transcript...</p>
            {waitedLong && (
              <div className="mt-5 inline-block px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-600 font-medium">Taking longer than usual... still working</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Ready state
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to={createPageUrl("History")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      <ReportHeader
        session={session}
        report={report}
        typeLabel={TYPE_LABELS[session?.interview_type] || session?.interview_type}
      />
      <ReportSummary summary={report.summary} />
      <div className="grid md:grid-cols-2 gap-4">
        <StrongestMoments items={report.strongest_moments} />
        <MissedOpportunities items={report.missed_opportunities} />
      </div>
      <QuestionsAnalysis questions={report.questions_analysis} />
      <ActionItems items={report.action_items} sessionId={sessionId} />
      {report.follow_up_email_draft && (
        <FollowUpEmail draft={report.follow_up_email_draft} />
      )}

      <div className="flex justify-end pb-6">
        <Button onClick={handleExport} variant="outline" className="gap-2 text-slate-600">
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>
    </div>
  );
}
