import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Copy, CheckCheck, Puzzle } from "lucide-react";

const steps = ["Welcome", "Create CV", "Install Extension", "Connect Extension", "Ready"];

export default function Onboarding({ user }) {
  const navigate = useNavigate();
  const firstName = useMemo(() => {
    const fullName = user?.full_name || user?.name || "there";
    return fullName.split(" ")[0];
  }, [user]);

  const [step, setStep] = useState(1);
  const [cvForm, setCvForm] = useState({ name: "My CV", cv_text: "" });
  const [cvError, setCvError] = useState("");
  const [cvSkipped, setCvSkipped] = useState(false);
  const [createdCVName, setCreatedCVName] = useState("");

  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);

  const [token] = useState(user?.api_token || "");
  const [copied, setCopied] = useState(false);

  const saveCVMutation = useMutation({
    mutationFn: async () => {
      const textLength = cvForm.cv_text.trim().length;
      if (textLength < 200) {
        throw new Error("CV text must be at least 200 characters.");
      }
      if (!cvForm.name.trim()) {
        throw new Error("Profile name is required.");
      }

      return base44.entities.CVProfiles.create({
        name: cvForm.name.trim(),
        cv_text: cvForm.cv_text,
        is_default: true,
        created_by: user?.id,
      });
    },
    onSuccess: () => {
      setCvSkipped(false);
      setCreatedCVName(cvForm.name.trim());
      setCvError("");
      setStep(3);
    },
    onError: (error) => {
      setCvError(error?.message || "Failed to save CV profile.");
    },
  });

  const completeOnboarding = async (targetPage) => {
    await base44.auth.updateMe({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    navigate(createPageUrl(targetPage));
  };

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all duration-300"
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>
          <div className="mt-3 text-sm text-slate-600 font-medium">Step {step} of 5 — {steps[step - 1]}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-6 text-center">
              <h1 className="text-3xl font-bold text-slate-900">Welcome to InterviewAI, {firstName}! 👋</h1>
              <p className="text-slate-600">Your AI co-pilot for job interviews</p>

              <div className="grid gap-3 text-left max-w-xl mx-auto">
                <div className="rounded-xl bg-slate-50 p-4">🎤 Listens to both sides of your interview</div>
                <div className="rounded-xl bg-slate-50 p-4">💡 Suggests answers in real-time, only you see them</div>
                <div className="rounded-xl bg-slate-50 p-4">📋 Generates a full debrief after every session</div>
              </div>

              <p className="text-sm text-slate-500">Setup takes about 2 minutes</p>
              <Button onClick={() => setStep(2)} className="w-full md:w-auto">Let&apos;s Get Started <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">First, let&apos;s set up your CV</h2>
                <p className="text-slate-600 mt-1">We use this to give you personalised coaching based on your actual experience</p>
              </div>

              <div>
                <Label>Profile name</Label>
                <Input
                  value={cvForm.name}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>CV text</Label>
                <Textarea
                  rows={15}
                  value={cvForm.cv_text}
                  onChange={(e) => {
                    setCvError("");
                    setCvForm((prev) => ({ ...prev, cv_text: e.target.value }));
                  }}
                  placeholder="Paste your full CV or resume here. The more detail, the better your coaching will be..."
                  className="mt-1"
                />
                <div className="text-xs text-slate-500 mt-1">{cvForm.cv_text.length} characters</div>
                {cvError && <div className="text-sm text-red-600 mt-2">{cvError}</div>}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={() => saveCVMutation.mutate()} disabled={saveCVMutation.isPending} className="sm:ml-auto">
                  Save & Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <button
                onClick={() => {
                  setCvSkipped(true);
                  setCreatedCVName("");
                  setCvError("");
                  setStep(3);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-slate-900">Install the Chrome Extension</h2>
              <p className="text-slate-600">The extension listens to your interview and shows coaching on your screen</p>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                <Puzzle className="w-8 h-8 mx-auto mb-2" /> Browser overlay preview placeholder
              </div>

              <ol className="list-decimal pl-5 text-slate-700 space-y-2">
                <li>Click the button below to open the Chrome Web Store</li>
                <li>Click &quot;Add to Chrome&quot;</li>
                <li>Pin the extension to your toolbar (click the puzzle piece icon)</li>
              </ol>

              <Button variant="outline" asChild>
                <a href="#">Open Chrome Web Store</a>
              </Button>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button
                  onClick={() => {
                    setExtensionInstalled(true);
                    setStep(4);
                  }}
                >
                  I&apos;ve installed it ✓
                </Button>
              </div>
              <button
                onClick={() => {
                  setExtensionInstalled(false);
                  setStep(4);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Skip — I&apos;ll install later
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-slate-900">Connect the extension to your account</h2>
              <p className="text-slate-600">Copy your token and paste it into the extension popup</p>

              <ol className="list-decimal pl-5 text-slate-700 space-y-2">
                <li>Click the InterviewAI icon in your Chrome toolbar</li>
                <li>Click &quot;Connect Account&quot;</li>
                <li>Paste your token below into the popup</li>
              </ol>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
                <code className="flex-1 font-mono text-sm md:text-base text-slate-800 break-all">{token || "No API token found"}</code>
                <Button variant="outline" onClick={handleCopy} disabled={!token}>
                  {copied ? "Copied!" : (<><Copy className="w-4 h-4 mr-1" /> Copy</>)}
                </Button>
              </div>

              <p className="text-sm text-slate-500">Can&apos;t find the extension icon? Click the puzzle piece 🧩 in Chrome toolbar</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button
                  onClick={() => {
                    setExtensionConnected(true);
                    setStep(5);
                  }}
                >
                  I&apos;ve connected it ✓
                </Button>
              </div>

              <button
                onClick={() => {
                  setExtensionConnected(false);
                  setStep(5);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Skip — I&apos;ll connect later
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                <CheckCheck className="w-9 h-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">You&apos;re all set! 🎉</h2>
                <p className="text-slate-600 mt-2">InterviewAI is ready to coach you</p>
              </div>

              <div className="text-left rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between"><span>CV Profile</span><span className="font-medium">{cvSkipped ? "Not set up yet" : `${createdCVName || "My CV"} ✓`}</span></div>
                <div className="flex items-center justify-between"><span>Extension</span><span className="font-medium">{extensionInstalled ? "Installed ✓" : "Install later"}</span></div>
                <div className="flex items-center justify-between"><span>Connected</span><span className="font-medium">{extensionConnected ? "Connected ✓" : "Connect later"}</span></div>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={() => completeOnboarding("NewSession")} className="w-full">
                  Create My First Interview <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button onClick={() => completeOnboarding("Dashboard")} className="text-sm text-slate-500 hover:text-slate-700">
                  Go to Dashboard
                </button>
                <Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
