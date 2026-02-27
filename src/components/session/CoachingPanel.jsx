import React from "react";
import { 
  Brain, Clock, MessageSquare, AlertTriangle, 
  Lightbulb, Tag, XCircle, HelpCircle 
} from "lucide-react";

export default function CoachingPanel({ suggestion, isBlurred }) {
  if (!suggestion) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm relative">
        {isBlurred && <BlurOverlay />}
        <div className="text-center">
          <Brain className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p>Waiting for interviewer...</p>
          <p className="text-xs text-slate-600 mt-1">AI coaching will appear when a question is detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative">
      {isBlurred && <BlurOverlay />}

      {/* Alert */}
      {suggestion.alert_message && (
        <div className={`p-3 rounded-xl flex items-start gap-3 ${
          suggestion.alert_type === "warning" ? "bg-amber-500/10 border border-amber-500/20" : "bg-red-500/10 border border-red-500/20"
        }`}>
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            suggestion.alert_type === "warning" ? "text-amber-400" : "text-red-400"
          }`} />
          <p className="text-sm text-slate-300">{suggestion.alert_message}</p>
        </div>
      )}

      {/* Question type & Framework */}
      <div className="flex items-center gap-2 flex-wrap">
        {suggestion.question_type && (
          <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20 capitalize">
            {suggestion.question_type}
          </span>
        )}
        {suggestion.framework && (
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
            {suggestion.framework}
          </span>
        )}
        {suggestion.target_duration_seconds && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-400 text-xs border border-white/[0.06]">
            <Clock className="w-3 h-3" /> Aim for {suggestion.target_duration_seconds}s
          </span>
        )}
      </div>

      {/* Headline */}
      {suggestion.headline && (
        <h3 className="text-lg font-semibold text-white leading-snug">{suggestion.headline}</h3>
      )}

      {/* Structure */}
      {suggestion.structure && suggestion.structure.length > 0 && (
        <div className="space-y-2">
          {suggestion.structure.map((item, i) => (
            <div key={i} className="glass-card p-3">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{item.label}</span>
              <p className="text-sm text-slate-300 mt-1">{item.guidance}</p>
            </div>
          ))}
        </div>
      )}

      {/* CV Hook */}
      {suggestion.cv_hook && (
        <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">From Your CV</span>
          </div>
          <p className="text-sm text-slate-300">{suggestion.cv_hook}</p>
        </div>
      )}

      {/* Keywords */}
      {suggestion.keywords_to_include && suggestion.keywords_to_include.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-400">Keywords to Include</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestion.keywords_to_include.map((kw, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Things to avoid */}
      {suggestion.things_to_avoid && suggestion.things_to_avoid.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400/80">Avoid</span>
          </div>
          <div className="space-y-1">
            {suggestion.things_to_avoid.map((item, i) => (
              <p key={i} className="text-xs text-red-300/70">• {item}</p>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up questions */}
      {suggestion.follow_up_questions && suggestion.follow_up_questions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-slate-400">Ask the Interviewer</span>
          </div>
          <div className="space-y-1.5">
            {suggestion.follow_up_questions.map((q, i) => (
              <p key={i} className="text-sm text-violet-300/80 italic">"{q}"</p>
            ))}
          </div>
        </div>
      )}

      {/* Coaching note */}
      {suggestion.coaching_note && (
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Coach Note</span>
          </div>
          <p className="text-xs text-slate-500">{suggestion.coaching_note}</p>
        </div>
      )}
    </div>
  );
}

function BlurOverlay() {
  return (
    <div className="absolute inset-0 backdrop-blur-md bg-[#0a0e1a]/60 z-10 flex items-center justify-center rounded-xl">
      <div className="text-center p-6">
        <Brain className="w-10 h-10 text-indigo-400/50 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">AI Coaching Locked</h3>
        <p className="text-sm text-slate-400 mb-4">Upgrade to Pro for real-time coaching</p>
        <a href="/Billing" className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium">
          Upgrade Now
        </a>
      </div>
    </div>
  );
}