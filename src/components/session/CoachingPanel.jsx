import React from "react";
import { Brain, Clock, MessageSquare, AlertTriangle, Lightbulb, Tag, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

const QUESTION_TYPE_STYLES = {
  behavioral: "bg-blue-100 text-blue-700 border-blue-200",
  technical: "bg-purple-100 text-purple-700 border-purple-200",
  situational: "bg-teal-100 text-teal-700 border-teal-200",
  motivational: "bg-green-100 text-green-700 border-green-200",
  curveball: "bg-orange-100 text-orange-700 border-orange-200",
};

const SAMPLE_SUGGESTION = {
  question_type: "behavioral",
  framework: "STAR",
  headline: "Lead with a concise story that shows ownership and measurable results.",
  structure: [
    { label: "Situation", guidance: "Set context in one short sentence." },
    { label: "Action", guidance: "Explain what *you* did and why." },
    { label: "Result", guidance: "Quantify impact and finish confidently." },
  ],
  cv_hook: "Reference your product launch project with 18% conversion lift.",
};

function timingBadgeClass(seconds) {
  if (seconds < 90) return "bg-green-100 text-green-700 border-green-200";
  if (seconds <= 150) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function alertVisual(type) {
  if (type === "warning") {
    return {
      wrapper: "bg-amber-50 border border-amber-200",
      icon: <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />,
    };
  }

  return {
    wrapper: "bg-red-50 border border-red-200",
    icon: <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />,
  };
}

export default function CoachingPanel({ suggestion, isBlurred }) {
  const isSample = isBlurred;
  const data = isSample ? SAMPLE_SUGGESTION : suggestion;

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm relative">
        <div className="text-center">
          <Brain className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>Waiting for interviewer...</p>
          <p className="text-xs text-slate-400 mt-1">AI coaching will appear when a question is detected</p>
        </div>
        {isBlurred && <BlurOverlay />}
      </div>
    );
  }

  const questionStyle = QUESTION_TYPE_STYLES[data.question_type] || "bg-slate-100 text-slate-700 border-slate-200";
  const alert = data.alert_type ? alertVisual(data.alert_type) : null;
  const structure = Array.isArray(data.structure) ? data.structure.slice(0, 3) : [];
  const keywords = Array.isArray(data.keywords_to_include) ? data.keywords_to_include : [];
  const avoid = Array.isArray(data.things_to_avoid) ? data.things_to_avoid : [];
  const followUps = Array.isArray(data.follow_up_questions) ? data.follow_up_questions : [];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative">
      {alert && data.alert_message && (
        <div className={`p-3 rounded-xl flex items-start gap-3 ${alert.wrapper}`}>
          {alert.icon}
          <p className="text-sm text-slate-700">{data.alert_message}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {data.question_type && (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${questionStyle}`}>{data.question_type}</span>
        )}
        {data.framework && (
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">{data.framework}</span>
        )}
        {!!data.target_duration_seconds && (
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${timingBadgeClass(data.target_duration_seconds)}`}>
            <Clock className="w-3 h-3" /> Aim for {data.target_duration_seconds}s
          </span>
        )}
      </div>

      {data.headline && <h3 className="text-xl font-bold text-slate-900 leading-snug">{data.headline}</h3>}

      {structure.length > 0 && (
        <div className="space-y-2">
          {structure.map((item, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">{item.label}</span>
              <p className="text-sm text-slate-700 mt-1">{item.guidance}</p>
            </div>
          ))}
        </div>
      )}

      {!!data.cv_hook?.trim() && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">From Your CV</span>
          </div>
          <p className="text-sm text-slate-700">{data.cv_hook}</p>
        </div>
      )}

      {keywords.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-slate-500">Keywords to Include</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs border border-green-200">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {avoid.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-600">Avoid</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {avoid.map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">{item}</span>
            ))}
          </div>
        </div>
      )}

      {followUps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-500">Ask the Interviewer</span>
          </div>
          <div className="space-y-1.5">
            {followUps.map((q, i) => (
              <p key={i} className="text-sm text-indigo-700 italic">→ {q}</p>
            ))}
          </div>
        </div>
      )}

      {!!data.coaching_note?.trim() && (
        <div className="rounded-xl bg-slate-100 border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Coach Note</span>
          </div>
          <p className="text-xs text-slate-600">{data.coaching_note}</p>
        </div>
      )}

      {isBlurred && <BlurOverlay />}
    </div>
  );
}

function BlurOverlay() {
  return (
    <div className="absolute inset-0 backdrop-blur-md bg-white/70 z-10 flex items-center justify-center rounded-xl">
      <div className="text-center p-6">
        <Brain className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-800 mb-1">AI Coaching Locked</h3>
        <p className="text-sm text-slate-500 mb-4">Upgrade to Pro for real-time coaching</p>
        <Button asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
          <a href={createPageUrl("Billing")}>Upgrade Now</a>
        </Button>
      </div>
    </div>
  );
}
