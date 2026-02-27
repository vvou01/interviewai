import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, ArrowRight } from "lucide-react";

const TYPE_BADGES = {
  behavioral: { label: "Behavioral", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  technical:  { label: "Technical",  cls: "bg-purple-100 text-purple-700 border-purple-200" },
  hr:         { label: "HR Screening", cls: "bg-green-100 text-green-700 border-green-200" },
  final_round:{ label: "Final Round", cls: "bg-orange-100 text-orange-700 border-orange-200" },
};

function Section({ label, onEdit, children }) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

export default function StepReview({ form, cvProfile, atLimit, used, limit, onEdit, onConfirm, isCreating }) {
  const badge = TYPE_BADGES[form.interview_type] || TYPE_BADGES.behavioral;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Review your session setup</h2>
      <p className="text-sm text-slate-500 mb-6">Make sure everything looks right before we create your session.</p>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 px-5 mb-6">
        {/* CV Profile */}
        <Section label="CV Profile" onEdit={() => onEdit(1)}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{cvProfile?.name || "—"}</span>
            {cvProfile?.is_default && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200">Default</span>
            )}
          </div>
        </Section>

        {/* Role */}
        <Section label="Role" onEdit={() => onEdit(2)}>
          <p className="font-semibold text-slate-800">{form.job_title}</p>
          <p className="text-sm text-slate-500">{form.company_name}</p>
        </Section>

        {/* Interview Type */}
        <Section label="Interview Type" onEdit={() => onEdit(2)}>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
            {badge.label}
          </span>
        </Section>

        {/* Job Description */}
        <Section label="Job Description" onEdit={() => onEdit(2)}>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {form.job_description}
          </p>
        </Section>
      </div>

      {/* CTA */}
      {atLimit ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <p className="text-sm font-medium text-amber-800 mb-3">
            You've used {used}/{limit} free interviews this month — upgrade to continue.
          </p>
          <Link to={createPageUrl("Billing")}>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
              Upgrade Plan <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <Button
          onClick={onConfirm}
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 h-11 text-base"
        >
          {isCreating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating your session…</>
          ) : (
            <>Everything looks good — Confirm &amp; Create</>
          )}
        </Button>
      )}
    </div>
  );
}