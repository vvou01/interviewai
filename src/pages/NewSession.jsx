import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import StepSelectCV from "@/components/session/StepSelectCV";
import StepJobDetails from "@/components/session/StepJobDetails";
import StepReview from "@/components/session/StepReview";
import StepReady from "@/components/session/StepReady";

const steps = ["CV Profile", "Job Details", "Review", "Ready"];

export default function NewSession({ user }) {
  const params = new URLSearchParams(window.location.search);
  const preStep = parseInt(params.get("step")) || 1;
  const preId = params.get("id");

  const [step, setStep] = useState(preId ? preStep : 1);
  const [cvProfileId, setCvProfileId] = useState("");
  const [sessionId, setSessionId] = useState(preId || "");
  const [form, setForm] = useState({
    job_title: "",
    company_name: "",
    job_description: "",
    interview_type: "behavioral",
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const session = await base44.entities.InterviewSessions.create({
        cv_profile_id: cvProfileId,
        ...form,
        status: "setup",
      });
      return session;
    },
    onSuccess: (session) => {
      setSessionId(session.id);
      setStep(4);
    },
  });

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const canNext =
    step === 1 ? !!cvProfileId :
    step === 2 ? form.job_title && form.company_name && form.interview_type :
    true;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${i + 1 <= step ? "text-indigo-400" : "text-slate-600"}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i + 1 < step ? "bg-indigo-500/20" : i + 1 === step ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-white/[0.04]"
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px ${i + 1 < step ? "bg-indigo-500/30" : "bg-white/[0.06]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="glass-card p-6 md:p-8">
        {step === 1 && <StepSelectCV selectedId={cvProfileId} onSelect={setCvProfileId} />}
        {step === 2 && <StepJobDetails form={form} onChange={handleChange} />}
        {step === 3 && <StepReview form={form} cvProfileId={cvProfileId} />}
        {step === 4 && <StepReady sessionId={sessionId} />}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="text-slate-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="bg-gradient-to-r from-indigo-500 to-violet-600"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="bg-gradient-to-r from-indigo-500 to-violet-600"
            >
              {createMut.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <>Create Session <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}