import React from "react";
import { Brain, Clock, MessageSquare, AlertTriangle, Lightbulb, Tag, XCircle, HelpCircle } from "lucide-react";

export default function CoachingPanel({ suggestion, isBlurred }) {
  if (!suggestion) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm relative">
        {isBlurred && <BlurOverlay />}
        <div className="text-center">
          <Brain className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>Waiting for interviewer...</p>
          <p className="text-xs text-slate-400 mt-1">AI coaching will appear when a question is detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative">
      {isBlurred && <BlurOverlay />}

      {suggestion.alert_message && (
        <div className={`p-3 rounded-xl flex items-start gap-3 ${
          suggestion.alert_type === "warning" ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"
        }`}>
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${suggestion.alert_type === "warning" ? "text-amber-500" : "text-red-500"}`} />
          <p className="text-sm text-slate-700">{suggestion.alert_message}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {suggestion.question_type && (
          <span className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 text-xs font-medium border border-violet-200 capitalize">{suggestion.question_type}</span>
        )}
        {suggestion.framework && (
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">{suggestion.framework}</span>
        )}
        {suggestion.target_duration_seconds && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs border border-slate-200">
            <Clock className="w-3 h-3" /> Aim for {suggestion.target_duration_seconds}s
          </span>
        )}
      </div>

      {suggestion.headline && (
        <h3 className="text-lg font-semibold text-slate-900 leading-snug">{suggestion.headline}</h3>
      )}

      {suggestion.structure && suggestion.structure.length > 0 && (
        <div className="space-y-2">
          {suggestion.structure.map((item, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">{item.label}</span>
              <p className="text-sm text-slate-700 mt-1">{item.guidance}</p>
            </div>
          ))}
        </div>
      )}

      {suggestion.cv_hook && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">From Your CV</span>
          </div>
          <p className="text-sm text-slate-700">{suggestion.cv_hook}</p>
        </div>
      )}

      {suggestion.keywords_to_include && suggestion.keywords_to_include.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-slate-500">Keywords to Include</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestion.keywords_to_include.map((kw, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs border border-violet-200">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {suggestion.things_to_avoid && suggestion.things_to_avoid.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-600">Avoid</span>
          </div>
          <div className="space-y-1">
            {suggestion.things_to_avoid.map((item, i) => (
              <p key={i} className="text-xs text-red-600">• {item}</p>
            ))}
          </div>
        </div>
      )}

      {suggestion.follow_up_questions && suggestion.follow_up_questions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-500">Ask the Interviewer</span>
          </div>
          <div className="space-y-1.5">
            {suggestion.follow_up_questions.map((q, i) => (
              <p key={i} className="text-sm text-indigo-700 italic">"{q}"</p>
            ))}
          </div>
        </div>
      )}

      {suggestion.coaching_note && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Coach Note</span>
          </div>
          <p className="text-xs text-slate-500">{suggestion.coaching_note}</p>
        </div>
      )}
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
        <a href="/Billing" className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium">
          Upgrade Now
        </a>
      </div>
    </div>
  );
}