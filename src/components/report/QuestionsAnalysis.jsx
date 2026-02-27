import React, { useState } from "react";

const QUALITY_MAP = {
  strong:   { label: "Strong",   style: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  adequate: { label: "Adequate", style: "bg-blue-100 text-blue-700 border-blue-200" },
  weak:     { label: "Weak",     style: "bg-red-100 text-red-700 border-red-200" },
};

function resolveQuality(raw = "") {
  const l = raw.toLowerCase();
  if (l.includes("strong") || l.includes("excellent") || l.includes("good")) return "strong";
  if (l.includes("weak") || l.includes("poor")) return "weak";
  return "adequate";
}

export default function QuestionsAnalysis({ questions = [] }) {
  const [expanded, setExpanded] = useState({});

  if (!questions || questions.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-lg text-slate-800">Question by Question</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {questions.map((qa, i) => {
          const key = resolveQuality(qa.answer_quality);
          const { label, style } = QUALITY_MAP[key];
          const isLong = (qa.question || "").length > 100;
          const isExpanded = !!expanded[i];
          const displayQ = isLong && !isExpanded ? qa.question.slice(0, 100) + "…" : qa.question;

          return (
            <div key={i} className={`px-5 py-4 ${i % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}>
              <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                <p className="text-sm text-slate-700 flex-1 min-w-0">
                  {displayQ}
                  {isLong && (
                    <button
                      onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                      className="ml-1.5 text-violet-600 text-xs font-medium hover:underline"
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </p>
                <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style}`}>
                  {label}
                </span>
              </div>
              {qa.notes && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{qa.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}