import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const INTERVIEW_TYPES = [
  { value: "behavioral", label: "Behavioral", desc: "Focus on past experiences" },
  { value: "technical", label: "Technical", desc: "Focus on skills and knowledge" },
  { value: "hr", label: "HR Screening", desc: "Culture fit and basics" },
  { value: "final_round", label: "Final Round", desc: "Senior stakeholders" },
];

export default function StepJobDetails({ form, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Tell us about the role</h2>
      <p className="text-sm text-slate-500 mb-6">We'll tailor your coaching to this specific position.</p>

      <div className="space-y-5">
        {/* Job Title */}
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Job Title <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.job_title}
            onChange={(e) => onChange("job_title", e.target.value)}
            placeholder="e.g. Senior Product Manager"
            className="mt-1.5"
          />
        </div>

        {/* Company Name */}
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            placeholder="e.g. Spotify"
            className="mt-1.5"
          />
        </div>

        {/* Interview Type */}
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Interview Type <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {INTERVIEW_TYPES.map((t) => {
              const selected = form.interview_type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onChange("interview_type", t.value)}
                  className={`text-left px-3.5 py-3 rounded-xl border-2 transition-all ${
                    selected
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <div className={`text-sm font-semibold ${selected ? "text-violet-900" : "text-slate-800"}`}>{t.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Job Description */}
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Job Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={form.job_description}
            onChange={(e) => onChange("job_description", e.target.value)}
            placeholder={"Paste the full job description from LinkedIn, company website etc..."}
            rows={10}
            className="mt-1.5 resize-none text-sm leading-relaxed"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            The more detail you add, the more relevant your coaching will be.
          </p>
        </div>
      </div>
    </div>
  );
}