import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Tag } from "lucide-react";

const typeLabels = {
  behavioral: "Behavioral",
  technical: "Technical",
  hr: "HR / Screening",
  final_round: "Final Round",
};

export default function StepReview({ form, cvProfileId }) {
  const { data: profiles = [] } = useQuery({
    queryKey: ["cvProfiles"],
    queryFn: () => base44.entities.CVProfiles.list(),
  });

  const cv = profiles.find((p) => p.id === cvProfileId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review & Confirm</h2>
        <p className="text-sm text-slate-500 mt-1">Make sure everything looks right before starting</p>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">{form.job_title}</h3>
            <p className="text-sm text-slate-400">{form.company_name}</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">{typeLabels[form.interview_type] || form.interview_type}</h3>
            <p className="text-sm text-slate-400">Interview Type</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">{cv?.name || "Selected CV"}</h3>
            <p className="text-sm text-slate-400 line-clamp-2 mt-1">{cv?.cv_text?.slice(0, 150)}...</p>
          </div>
        </div>

        {form.job_description && (
          <div className="glass-card p-5">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Job Description</h4>
            <p className="text-sm text-slate-300 line-clamp-6">{form.job_description}</p>
          </div>
        )}
      </div>
    </div>
  );
}