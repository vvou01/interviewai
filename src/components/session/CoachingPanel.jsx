import React from "react";
import {
  AlertTriangle,
  Brain,
  Clock3,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Tag,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

const QUESTION_TYPE_COLORS = {
  behavioral: "bg-blue-100 text-blue-700 border-blue-200",
  technical: "bg-purple-100 text-purple-700 border-purple-200",
  situational: "bg-teal-100 text-teal-700 border-teal-200",
  motivational: "bg-green-100 text-green-700 border-green-200",
  curveball: "bg-orange-100 text-orange-700 border-orange-200",
};

const SAMPLE_SUGGESTION = {
  question_type: "behavioral",
  framework: "STAR",
  headline: "Lead with a specific project example that shows ownership",
  structure: [
    {
      label: "Situation",
      guidance: "Set the scene briefly — 1-2 sentences",
    },
    {
      label: "Action",
      guidance: "Focus 60% of your answer here — what YOU specifically did",
    },
    {
      label: "Result",
      guidance: "Quantify the outcome if possible",
    },
  ],
  cv_hook: "Your experience at [Company] is perfect for this question",
  keywords_to_include: ["ownership", "initiative", "stakeholder", "outcome"],
  things_to_avoid: ["blaming others", "vague outcomes"],
  target_duration_seconds: 90,
  follow_up_questions: ["What does success look like in the first 90 days?"],
  coaching_note: null,
  alert_type: null,
  alert_message: null,
};

function typeColor(questionType) {
  return QUESTION_TYPE_COLORS[questionType] || "bg-slate-100 text-slate-700 border-slate-200";
}

function alertStyles(alertType) {
  if (alertType === "warning") {
    return {
      wrapper: "bg-amber-50 border-amber-200",
      icon: "text-amber-500",
    };
  }

  return {
    wrapper: "bg-red-50 border-red-200",
    icon: "text-red-500",
  };
}

function timingColor(seconds) {
  if (seconds < 90) return "bg-green-100 text-green-700 border-green-200";
  if (seconds <= 150) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function BadgeRow({ suggestion }) {
  const seconds = suggestion?.target_duration_seconds;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!!suggestion?.question_type && (
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${typeColor(
            suggestion.question_type
          )}`}
        >
          {suggestion.question_type}
        </span>
      )}

      {!!suggestion?.framework && (
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          {suggestion.framework}
        </span>
      )}

      {!!seconds && (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${timingColor(seconds)}`}>
          <Clock3 className="w-3 h-3" />
          Aim for {seconds}s
        </span>
      )}
    </div>
  );
}

function StructureBlock({ structure }) {
  const items = asArray(structure).slice(0, 3);
  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">{item.label}</span>
          <p className="text-sm text-slate-700 mt-1">{item.guidance}</p>
        </div>
      ))}
    </div>
  );
}

function AlertBanner({ suggestion }) {
  if (!suggestion?.alert_type || !suggestion?.alert_message) return null;

  const styles = alertStyles(suggestion.alert_type);
  return (
    <div className={`p-3 rounded-xl border flex items-start gap-3 ${styles.wrapper}`}>
      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.icon}`} />
      <p className="text-sm text-slate-700">{suggestion.alert_message}</p>
    </div>
  );
}

function CvHook({ text }) {
  if (!text || !String(text).trim()) return null;

  return (
    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">From Your CV</span>
      </div>
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
}

function KeywordChips({ values }) {
  const items = asArray(values);
  if (!items.length) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Tag className="w-3.5 h-3.5 text-green-600" />
        <span className="text-xs font-semibold text-slate-500">Keywords to Include</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span key={`${item}-${idx}`} className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs border border-green-200">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AvoidChips({ values }) {
  const items = asArray(values);
  if (!items.length) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <XCircle className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-semibold text-red-600">Things to avoid</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span key={`${item}-${idx}`} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function FollowUps({ values }) {
  const items = asArray(values);
  if (!items.length) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-xs font-semibold text-slate-500">Follow-up questions</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <p key={`${item}-${idx}`} className="text-sm text-indigo-700 italic">
            → {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function CoachNote({ text }) {
  if (!text || !String(text).trim()) return null;

  return (
    <div className="rounded-xl bg-slate-100 border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <MessageSquare className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-semibold text-slate-500 uppercase">Coaching note</span>
      </div>
      <p className="text-xs text-slate-600">{text}</p>
    </div>
  );
}

function BlurOverlay() {
  return (
    <div className="absolute inset-0 backdrop-blur-md bg-white/70 z-10 flex items-center justify-center rounded-xl">
      <div className="text-center p-6">
        <Brain className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-800 mb-1">AI Coaching Locked</h3>
        <p className="text-sm text-slate-500 mb-4">Upgrade to Pro for real-time coaching.</p>
        <Button asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
          <a href={createPageUrl("Billing")}>Upgrade Now</a>
        </Button>
      </div>
    </div>
  );
}

function WaitingState({ isBlurred }) {
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm relative px-6">
      <div className="text-center max-w-xs">
        <Brain className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>Waiting for interviewer…</p>
        <p className="text-xs text-slate-400 mt-1">AI coaching appears when a question is detected.</p>
      </div>
      {isBlurred && <BlurOverlay />}
    </div>
  );
}

export default function CoachingPanel({ suggestion, isBlurred }) {
  const content = isBlurred ? SAMPLE_SUGGESTION : suggestion;

  if (!content) return <WaitingState isBlurred={isBlurred} />;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative">
      <AlertBanner suggestion={content} />
      <BadgeRow suggestion={content} />

      {!!content.headline && <h3 className="text-xl font-bold text-slate-900 leading-snug">{content.headline}</h3>}

      <StructureBlock structure={content.structure} />
      <CvHook text={content.cv_hook} />
      <KeywordChips values={content.keywords_to_include} />
      <AvoidChips values={content.things_to_avoid} />
      <FollowUps values={content.follow_up_questions} />
      <CoachNote text={content.coaching_note} />

      {isBlurred && <BlurOverlay />}
    </div>
  );
}
