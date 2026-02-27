import React from "react";

export default function ReportSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className="glass-card p-6">
      <h2 className="font-semibold text-lg text-slate-800 mb-3">Interview Summary</h2>
      <p className="text-slate-600 leading-relaxed">{summary}</p>
    </div>
  );
}