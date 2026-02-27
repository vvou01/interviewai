import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const interviewTypes = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "hr", label: "HR / Screening" },
  { value: "final_round", label: "Final Round" },
];

export default function StepJobDetails({ form, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Job Details</h2>
        <p className="text-sm text-slate-500 mt-1">Tell us about the position you're interviewing for</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-600 text-sm">Job Title</Label>
          <Input
            value={form.job_title}
            onChange={(e) => onChange("job_title", e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900"
          />
        </div>
        <div>
          <Label className="text-slate-600 text-sm">Company Name</Label>
          <Input
            value={form.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            placeholder="e.g., Google"
            className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900"
          />
        </div>
      </div>

      <div>
        <Label className="text-slate-600 text-sm">Interview Type</Label>
        <Select value={form.interview_type} onValueChange={(v) => onChange("interview_type", v)}>
          <SelectTrigger className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {interviewTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-slate-600 text-sm">Job Description</Label>
        <Textarea
          value={form.job_description}
          onChange={(e) => onChange("job_description", e.target.value)}
          placeholder="Paste the full job description here..."
          className="mt-1.5 min-h-[180px] bg-slate-50 border-slate-200 text-slate-900"
        />
      </div>
    </div>
  );
}
