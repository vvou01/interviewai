import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INTERVIEW_TYPES = [
  { value: "behavioral", label: "Behavioral", desc: "Focus on past experiences" },
  { value: "technical", label: "Technical", desc: "Focus on skills and knowledge" },
  { value: "hr", label: "HR Screening", desc: "Culture fit and basics" },
  { value: "final_round", label: "Final Round", desc: "Senior stakeholders" },
];

export default function StepJobDetails({ form, onChange, showValidation = false }) {
  const [touched, setTouched] = useState({});
  const errors = {
    job_title: !form.job_title.trim(),
    company_name: !form.company_name.trim(),
    job_description: !form.job_description.trim(),
    interview_type: !form.interview_type,
  };
  const shouldShow = (field) => errors[field] && (showValidation || touched[field]);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Tell us about the role</h2>
      <p className="text-sm text-slate-500 mb-6">We'll tailor your coaching to this specific position.</p>

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Job Title <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.job_title}
            onChange={(e) => onChange("job_title", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, job_title: true }))}
            placeholder="e.g. Senior Product Manager"
            className="mt-1.5"
          />
          {shouldShow("job_title") && <p className="text-xs text-red-500 mt-1.5">Job title is required.</p>}
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, company_name: true }))}
            placeholder="e.g. Spotify"
            className="mt-1.5"
          />
          {shouldShow("company_name") && <p className="text-xs text-red-500 mt-1.5">Company name is required.</p>}
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">
            Interview Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.interview_type}
            onValueChange={(value) => {
              onChange("interview_type", value);
              setTouched((t) => ({ ...t, interview_type: true }));
            }}
          >
            <SelectTrigger className="mt-1.5 h-11">
              <SelectValue placeholder="Select interview type" />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {shouldShow("interview_type") && <p className="text-xs text-red-500 mt-1.5">Interview type is required.</p>}
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">
            Job Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={form.job_description}
            onChange={(e) => onChange("job_description", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, job_description: true }))}
            placeholder={"Paste the full job description from LinkedIn, company website etc..."}
            rows={10}
            className="mt-1.5 resize-none text-sm leading-relaxed"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            The more detail you add, the more relevant your coaching will be.
          </p>
          {shouldShow("job_description") && (
            <p className="text-xs text-red-500 mt-1.5">Job description is required.</p>
          )}
        </div>
      </div>
    </div>
  );
}
