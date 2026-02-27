import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Zap, ArrowRight, ArrowLeft, FileText, Puzzle,
  Key, Copy, Check, Rocket, RefreshCw
} from "lucide-react";

const onboardSteps = [
  { icon: Zap, title: "Welcome to InterviewAI" },
  { icon: FileText, title: "Create Your CV Profile" },
  { icon: Puzzle, title: "Install Chrome Extension" },
  { icon: Key, title: "Connect Extension" },
  { icon: Rocket, title: "You're Ready!" },
];

export default function Onboarding({ user }) {
  const [step, setStep] = useState(0);
  const [cvForm, setCvForm] = useState({ name: "", cv_text: "" });
  const [token, setToken] = useState(user?.api_token || "");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createCVMut = useMutation({
    mutationFn: (data) => base44.entities.CVProfiles.create({ ...data, is_default: true }),
    onSuccess: () => setStep(2),
  });

  const generateToken = async () => {
    const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await base44.auth.updateMe({ api_token: newToken });
    setToken(newToken);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishOnboarding = async () => {
    await base44.auth.updateMe({ onboarding_completed: true });
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {onboardSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? "w-8 bg-indigo-500" : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="glass-card p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Welcome to InterviewAI</h2>
                <p className="text-slate-400 mt-2 leading-relaxed">
                  Your AI co-pilot for job interviews. Get real-time coaching, answer frameworks, and post-interview reports.
                </p>
              </div>
              <div className="space-y-3 text-left">
                {["Upload your CV for personalized coaching", "AI listens to your interview in real-time", "Get a full debrief report after every session"].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">{i + 1}</div>
                    {t}
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(1)} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600">
                Let's Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1: CV */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold">Create Your CV Profile</h2>
                <p className="text-sm text-slate-400 mt-1">This helps the AI personalize coaching to your experience</p>
              </div>
              <div>
                <Label className="text-slate-400 text-sm">Profile Name</Label>
                <Input
                  value={cvForm.name}
                  onChange={(e) => setCvForm({ ...cvForm, name: e.target.value })}
                  placeholder="e.g., My Main CV"
                  className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-sm">CV Text</Label>
                <Textarea
                  value={cvForm.cv_text}
                  onChange={(e) => setCvForm({ ...cvForm, cv_text: e.target.value })}
                  placeholder="Paste your full CV/resume text here..."
                  className="mt-1.5 min-h-[160px] bg-white/[0.04] border-white/[0.08] text-white"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)} className="text-slate-400">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={() => createCVMut.mutate(cvForm)}
                  disabled={!cvForm.name || !cvForm.cv_text || createCVMut.isPending}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600"
                >
                  Save & Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <button onClick={() => setStep(2)} className="text-xs text-slate-600 hover:text-slate-400 w-full text-center">
                Skip for now
              </button>
            </div>
          )}

          {/* Step 2: Chrome Extension */}
          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
                <Puzzle className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Install Chrome Extension</h2>
                <p className="text-sm text-slate-400 mt-2">
                  The extension captures audio from your video call and displays the coaching overlay.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full bg-white/[0.04] border-white/[0.08] text-slate-200"
                onClick={() => window.open("https://chrome.google.com/webstore", "_blank")}
              >
                <Puzzle className="w-4 h-4 mr-2" /> Install Extension (Chrome Web Store)
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={() => { if (!token) generateToken(); setStep(3); }} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: API Token */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold">Connect Extension</h2>
                <p className="text-sm text-slate-400 mt-1">Copy your API token and paste it in the extension</p>
              </div>
              {token ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-indigo-300 font-mono truncate">
                    {token}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copyToken} className="text-slate-400 flex-shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <Button onClick={generateToken} className="w-full bg-white/[0.06]">
                  <RefreshCw className="w-4 h-4 mr-2" /> Generate API Token
                </Button>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-400">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">You're All Set!</h2>
                <p className="text-slate-400 mt-2">Create your first interview session and ace that interview.</p>
              </div>
              <Button onClick={finishOnboarding} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}