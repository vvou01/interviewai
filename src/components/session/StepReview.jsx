import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Tag } from "lucide-react";

const typeLabels = { behavioral: "Behavioral", technical: "Technical", hr: "HR / Screening", final_round: "Final Round" };

export default function StepReview({ form, cvProfileId }) {
  const { data: profiles = [] } = useQuery({ queryKey: ["cvProfiles"], queryFn: () => base44.entities.CVProfiles.list() });
  const cv = profiles.find((p) => p.id === cvProfileId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Review & Confirm</h2>
        <p className="text-sm text-slate-500 mt-1">Make sure everything looks right before starting</p>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0"><Briefcase className="w-5 h-5 text-violet-600" /></div>
          <div>
            <h3 className="font-medium text-slate-800">{form.job_title}</h3>
            <p className="text-sm text-slate-500">{form.company_name}</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0"><Tag className="w-5 h-5 text-purple-600" /></div>
          <div>
            <h3 className="font-medium text-slate-800">{typeLabels[form.interview_type] || form.interview_type}</h3>
            <p className="text-sm text-slate-500">Interview Type</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h3 className="font-medium text-slate-800">{cv?.name || "Selected CV"}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">{cv?.cv_text?.slice(0, 150)}...</p>
          </div>
        </div>
        {form.job_description && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Job Description</h4>
            <p className="text-sm text-slate-700 line-clamp-6">{form.job_description}</p>
          </div>
        )}
      </div>
    </div>
  );
}