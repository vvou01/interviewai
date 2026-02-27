import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepSelectCV from "@/components/session/StepSelectCV";
import StepJobDetails from "@/components/session/StepJobDetails";
import StepReview from "@/components/session/StepReview";
import StepReady from "@/components/session/StepReady";

const STEPS = ["CV Profile", "Job Details", "Review", "Ready"];

const planLimits = { free: 2, pro: Infinity, pro_plus: Infinity };

export default function NewSession({ user }) {
  const [step, setStep] = useState(1);
  const [cvProfileId, setCvProfileId] = useState("");
  const [cvProfile, setCvProfile] = useState(null);
  const [form, setForm] = useState({
    job_title: "",
    company_name: "",
    job_description: "",
    interview_type: "behavioral",
  });
  const [sessionId, setSessionId] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Dirty tracking for unload prompt
  useEffect(() => {
    const hasData = cvProfileId || form.job_title || form.company_name || form.job_description;
    setIsDirty(!!hasData && step < 4);
  }, [cvProfileId, form, step]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have an unsaved session setup — continue?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const plan = user?.plan || "free";
  const used = user?.interviews_used_this_month || 0;
  const limit = planLimits[plan];
  const atLimit = limit !== Infinity && used >= limit;

  const createMut = useMutation({
    mutationFn: () =>
      base44.entities.InterviewSessions.create({
        cv_profile_id: cvProfileId,
        ...form,
        status: "setup",
      }),
    onSuccess: (session) => {
      setSessionId(session.id);
      setStep(4);
    },
  });

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleBack = () => {
    if (step === 1) {
      window.location.href = createPageUrl("Dashboard");
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleNext = () => setStep((s) => s + 1);

  const isStep1Valid = !!cvProfileId;
  const isStep2Valid =
    form.job_title.trim() &&
    form.company_name.trim() &&
    form.job_description.trim() &&
    form.interview_type;

  const canNext =
    step === 1 ? isStep1Valid :
    step === 2 ? isStep2Valid :
    true;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i + 1 < step
                      ? "bg-violet-600 border-violet-600 text-white"
                      : i + 1 === step
                      ? "bg-white border-violet-600 text-violet-600"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}>
                    {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    i + 1 === step ? "text-violet-700" : i + 1 < step ? "text-violet-500" : "text-slate-400"
                  }`}>{s}</span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${i + 1 < step ? "bg-violet-400" : "bg-slate-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="glass-card p-6 md:p-8">
        {step === 1 && (
          <StepSelectCV
            selectedId={cvProfileId}
            onSelect={(id, profile) => { setCvProfileId(id); setCvProfile(profile); }}
            user={user}
          />
        )}
        {step === 2 && <StepJobDetails form={form} onChange={handleChange} />}
        {step === 3 && (
          <StepReview
            form={form}
            cvProfile={cvProfile}
            atLimit={atLimit}
            used={used}
            limit={limit}
            onEdit={setStep}
            onConfirm={() => createMut.mutate()}
            isCreating={createMut.isPending}
          />
        )}
        {step === 4 && <StepReady sessionId={sessionId} />}
      </div>

      {/* Bottom navigation */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={handleBack} className="text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {step === 1 ? "Dashboard" : "Back"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canNext}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40"
          >
            Next <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex items-center justify-start mt-6">
          <Button variant="ghost" onClick={handleBack} className="text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        </div>
      )}
    </div>
  );
}