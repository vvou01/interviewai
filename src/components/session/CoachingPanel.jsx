import React from "react";
import { Brain, Clock, Tag, XCircle, HelpCircle, Lightbulb, AlertTriangle, Zap, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const TYPE_COLORS = {
  behavioral:  "bg-blue-100 text-blue-700 border-blue-200",
  technical:   "bg-purple-100 text-purple-700 border-purple-200",
  situational: "bg-teal-100 text-teal-700 border-teal-200",
  motivational:"bg-emerald-100 text-emerald-700 border-emerald-200",
  curveball:   "bg-orange-100 text-orange-700 border-orange-200",
};

const ALERT_ICONS = {
  timing:      <Clock className="w-4 h-4" />,
  topic:       <Target className="w-4 h-4" />,
  encouragement: <Zap className="w-4 h-4" />,
};

const SAMPLE_SUGGESTION = {
  question_type: "behavioral",
  framework: "STAR",
  headline: "Lead with impact — show measurable results",
  structure: [
    { label: "Situation", guidance: "Set the scene briefly — project context and your role" },
    { label: "Task", guidance: "Explain what you were responsible for achieving" },
    { label: "Action", guidance: "Walk through the key decisions and actions you took" },
    { label: "Result", guidance: "Lead with the outcome — quantify impact where possible" },
  ],
  cv_hook: "Reference your experience at Acme Corp leading the Q3 launch",
  keywords_to_include: ["ownership", "cross-functional", "stakeholders"],
  things_to_avoid: ["Vague answers", "Saying 'we' instead of 'I'"],
  target_duration_seconds: 90,
  follow_up_questions: ["What does success look like in the first 90 days?"],
  coaching_note: "Stay specific — the interviewer wants concrete examples",
};

const QUICK_TIPS = [
  "Listen fully before formulating your answer",
  "Lead with a clear headline sentence",
  "Use specific numbers to quantify impact",
  "End with what you learned or would do differently",
  "Pause briefly before answering to gather your thoughts",
  "Speak at a measured pace — clarity beats speed",
];

// Answer timing reference by question type
const PACING = [
  { label: "Behavioral", range: "60–90s", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { label: "Technical",  range: "90–120s", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { label: "Situational", range: "45–75s", color: "bg-teal-50 text-teal-700 border-teal-100" },
];

function TimingBadge({ seconds }) {
  if (!seconds) return null;
  const color = seconds < 90 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : seconds <= 150 ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${color}`}>
      <Clock className="w-3 h-3" /> Aim for {seconds}s
    </span>
  );
}

function SuggestionContent({ s }) {
  return (
    <div className="p-4 space-y-4">
      {/* Alert */}
      {s.alert_type && s.alert_message && (
        <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm ${
          s.alert_type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <span className="flex-shrink-0 mt-0.5">
            {ALERT_ICONS[s.alert_type] || <AlertTriangle className="w-4 h-4" />}
          </span>
          {s.alert_message}
        </div>
      )}

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {s.question_type && (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${TYPE_COLORS[s.question_type] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {s.question_type}
          </span>
        )}
        {s.framework && (
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
            {s.framework}
          </span>
        )}
        <TimingBadge seconds={s.target_duration_seconds} />
      </div>

      {/* Headline */}
      {s.headline && (
        <h3 className="text-base font-bold text-slate-900 leading-snug">{s.headline}</h3>
      )}

      {/* Structure */}
      {s.structure && s.structure.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">How to structure your answer</p>
          {s.structure.slice(0, 3).map((item, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">{item.label}</span>
              <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{item.guidance}</p>
            </div>
          ))}
        </div>
      )}

      {/* CV Hook */}
      {s.cv_hook && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Draw from your experience</span>
          </div>
          <p className="text-sm text-slate-700">{s.cv_hook}</p>
        </div>
      )}

      {/* Keywords */}
      {s.keywords_to_include && s.keywords_to_include.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Keywords to include</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {s.keywords_to_include.map((kw, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {/* Avoid */}
      {s.things_to_avoid && s.things_to_avoid.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-3 h-3 text-red-500" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avoid saying</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {s.things_to_avoid.map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">{item}</span>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up questions */}
      {s.follow_up_questions && s.follow_up_questions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-3 h-3 text-indigo-500" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Questions to ask them</span>
          </div>
          <div className="space-y-1.5">
            {s.follow_up_questions.map((q, i) => (
              <p key={i} className="text-sm text-indigo-700 italic">→ {q}</p>
            ))}
          </div>
        </div>
      )}

      {/* Coaching note */}
      {s.coaching_note && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">From your last answer:</p>
          <p className="text-xs text-slate-600 leading-relaxed">{s.coaching_note}</p>
        </div>
      )}
    </div>
  );
}

function WaitingPanel() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mx-auto mb-4 w-12 h-12">
            <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-40" />
            <div className="relative w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <p className="text-sm text-slate-400">Waiting for interviewer…</p>
          <p className="text-xs text-slate-300 mt-1">AI coaching will appear when a question is detected</p>
        </div>
      </div>
      <div className="border-t border-slate-100 p-4 space-y-2.5 flex-shrink-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">While you wait</p>
        {QUICK_TIPS.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-300" />
            <p className="text-xs text-slate-500 leading-relaxed">{tip}</p>
          </div>
        ))}
        <div className="mt-2 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Answer timing guide</p>
          <div className="flex gap-2">
            {PACING.map((p, i) => (
              <div key={i} className={`flex-1 text-center rounded-lg py-2 border ${p.color}`}>
                <p className="text-xs font-bold">{p.range}</p>
                <p className="text-[10px]">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachingFooter({ suggestion }) {
  if (!suggestion?.created_date) return null;
  const time = new Date(suggestion.created_date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-slate-300">Coaching updated at {time}</span>
      </div>
      <p className="text-[10px] text-slate-300 leading-relaxed">
        Keep listening — new coaching arrives when the next question is detected
      </p>
    </div>
  );
}

export default function CoachingPanel({ suggestion, isBlurred }) {
  if (isBlurred) {
    return (
      <div className="flex-1 relative overflow-hidden">
        {/* Blurred sample behind */}
        <div className="absolute inset-0 overflow-y-auto pointer-events-none select-none">
          <SuggestionContent s={SAMPLE_SUGGESTION} />
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-white/80 flex items-center justify-center z-10">
          <div className="text-center p-6 max-w-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Real-time coaching is a Pro feature</h3>
            <p className="text-sm text-slate-500 mb-5">Get AI coaching that appears instantly as the interviewer speaks.</p>
            <Link to={createPageUrl("Billing")}>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return <WaitingPanel />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <SuggestionContent s={suggestion} />
      </div>
      <CoachingFooter suggestion={suggestion} />
    </div>
  );
}
