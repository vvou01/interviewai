import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import StepSelectCV from "@/components/session/StepSelectCV";
import StepJobDetails from "@/components/session/StepJobDetails";
import StepReview from "@/components/session/StepReview";
import StepReady from "@/components/session/StepReady";
import UpgradeBanner from "@/components/shared/UpgradeBanner";

const steps = ["CV Profile", "Job Details", "Review", "Ready"];
const planLimits = { free: 2, pro: Infinity, pro_plus: Infinity };

export default function NewSession({ user }) {
  const params = new URLSearchParams(window.location.search);
  const preId = params.get("id");
  const preStep = parseInt(params.get("step")) || 1;
  const navigate = useNavigate();

  const [step, setStep] = useState(preId ? preStep : 1);
  const [cvProfileId, setCvProfileId] = useState("");
  const [sessionId, setSessionId] = useState(preId || "");
  const [form, setForm] = useState({ job_title: "", company_name: "", job_description: "", interview_type: "behavioral" });

  const plan = user?.plan || "free";
  const used = user?.interviews_used_this_month || 0;
  const limit = planLimits[plan];
  const isAtLimit = limit !== Infinity && used >= limit;

  const createMut = useMutation({
    mutationFn: async () => base44.entities.InterviewSessions.create({ cv_profile_id: cvProfileId, ...form, status: "setup" }),
    onSuccess: (session) => { setSessionId(session.id); setStep(4); },
  });

  const handleCreate = () => {
    if (isAtLimit) {
      navigate(createPageUrl("Billing"));
      return;
    }
    createMut.mutate();
  };

  const handleChange = (field, value) => setForm({ ...form, [field]: value });
  const canNext = step === 1 ? !!cvProfileId : step === 2 ? !!(form.job_title && form.company_name && form.interview_type) : true;

  return (
    <div className="max-w-2xl mx-auto">
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${i + 1 <= step ? "text-violet-600" : "text-slate-400"}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${
                    i + 1 < step ? "bg-violet-100 border-violet-200 text-violet-700" :
                    i + 1 === step ? "bg-violet-600 border-violet-600 text-white" :
                    "bg-white border-slate-200 text-slate-400"
                  }`}>{i + 1}</div>
                  <span className="text-sm font-medium hidden sm:block">{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-px ${i + 1 < step ? "bg-violet-200" : "bg-slate-200"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {isAtLimit && step === 3 && (
        <div className="mb-4">
          <UpgradeBanner message={`You've used ${used}/${limit} interviews this month. Upgrade to Pro for unlimited interviews.`} />
        </div>
      )}

      <div className="glass-card p-6 md:p-8">
        {step === 1 && <StepSelectCV selectedId={cvProfileId} onSelect={setCvProfileId} />}
        {step === 2 && <StepJobDetails form={form} onChange={handleChange} />}
        {step === 3 && <StepReview form={form} cvProfileId={cvProfileId} />}
        {step === 4 && <StepReady sessionId={sessionId} />}
      </div>

      {step < 4 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1} className="text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="bg-gradient-to-r from-violet-600 to-purple-600">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={createMut.isPending || isAtLimit} className="bg-gradient-to-r from-violet-600 to-purple-600">
              {createMut.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> :
               isAtLimit ? "Limit Reached — Upgrade" :
               <>Create Session <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
