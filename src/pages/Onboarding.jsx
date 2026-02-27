import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowRight, ArrowLeft, Mic, Lightbulb, ClipboardList,
  Puzzle, Key, Copy, Check, CheckCircle2, RefreshCw
} from "lucide-react";

const STEPS = [
  { label: "Welcome" },
  { label: "CV Profile" },
  { label: "Extension" },
  { label: "Connect" },
  { label: "Ready" },
];

export default function Onboarding({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 2 state
  const [cvForm, setCvForm] = useState({ name: "My CV", cv_text: "" });
  const [cvSkipped, setCvSkipped] = useState(false);
  const [cvProfileName, setCvProfileName] = useState(null);

  // Step 3 state
  const [extensionSkipped, setExtensionSkipped] = useState(false);

  // Step 4 state
  const [token, setToken] = useState(user?.api_token || "");
  const [copied, setCopied] = useState(false);
  const [connectSkipped, setConnectSkipped] = useState(false);

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.onboarding_completed) {
      navigate(createPageUrl("Dashboard"));
    }
  }, [user]);

  // Auto-generate token when reaching step 3
  useEffect(() => {
    if (step === 3 && !token) {
      generateToken();
    }
  }, [step]);

  const createCVMut = useMutation({
    mutationFn: (data) => base44.entities.CVProfiles.create({ ...data, is_default: true }),
    onSuccess: (created) => {
      setCvProfileName(created?.name || cvForm.name);
      setStep(2);
    },
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
    await base44.auth.updateMe({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    navigate(createPageUrl("NewSession"));
  };

  const handleSkipCV = () => {
    setCvSkipped(true);
    setCvProfileName(null);
    setStep(2);
  };

  const cvValid = cvForm.name.trim().length > 0 && cvForm.cv_text.trim().length >= 200;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 pt-10">
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                style={{ width: i < step ? "100%" : i === step ? "60%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
          </p>
          <p className="text-xs text-slate-400">InterviewAI</p>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* STEP 1 — WELCOME */}
        {step === 0 && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto shadow-md shadow-violet-200">
              <span className="text-3xl">👋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome to InterviewAI, {user?.full_name?.split(" ")[0] || "there"}!
              </h1>
              <p className="text-slate-500 mt-2">Your AI co-pilot for job interviews</p>
            </div>

            <div className="space-y-3 text-left bg-slate-50 rounded-xl p-4">
              {[
                { icon: Mic, text: "Listens to both sides of your interview", color: "text-violet-600 bg-violet-100" },
                { icon: Lightbulb, text: "Suggests answers in real-time, only you see them", color: "text-amber-600 bg-amber-100" },
                { icon: ClipboardList, text: "Generates a full debrief after every session", color: "text-emerald-600 bg-emerald-100" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-slate-700">{text}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400">⏱ Setup takes about 2 minutes</p>

            <Button
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2 py-6 text-base"
            >
              Let's Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2 — CV PROFILE */}
        {step === 1 && (
          <div className="p-8 space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">First, let's set up your CV</h2>
              <p className="text-sm text-slate-500 mt-1">
                We use this to give you personalised coaching based on your actual experience
              </p>
            </div>

            <div>
              <Label className="text-slate-600 text-sm">Profile Name</Label>
              <Input
                value={cvForm.name}
                onChange={e => setCvForm({ ...cvForm, name: e.target.value })}
                className="mt-1.5"
                placeholder="My CV"
              />
            </div>

            <div>
              <Label className="text-slate-600 text-sm">CV / Resume Text</Label>
              <Textarea
                value={cvForm.cv_text}
                onChange={e => setCvForm({ ...cvForm, cv_text: e.target.value })}
                placeholder="Paste your full CV or resume here. The more detail, the better your coaching will be..."
                className="mt-1.5"
                rows={15}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${cvForm.cv_text.length < 200 ? "text-slate-400" : "text-emerald-600"}`}>
                  {cvForm.cv_text.length} characters {cvForm.cv_text.length < 200 && `(${200 - cvForm.cv_text.length} more needed)`}
                </span>
                {cvForm.cv_text.length >= 200 && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Good to go
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)} className="text-slate-500 gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => createCVMut.mutate(cvForm)}
                disabled={!cvValid || createCVMut.isPending}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2"
              >
                {createCVMut.isPending ? "Saving..." : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
            <button onClick={handleSkipCV} className="text-xs text-slate-400 hover:text-slate-600 w-full text-center pt-1">
              Skip for now — I'll add my CV later
            </button>
          </div>
        )}

        {/* STEP 3 — INSTALL EXTENSION */}
        {step === 2 && (
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Puzzle className="w-7 h-7 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Install the Chrome Extension</h2>
              <p className="text-sm text-slate-500 mt-1">
                The extension listens to your interview and shows coaching on your screen
              </p>
            </div>

            {/* Browser mockup placeholder */}
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2 mb-3 text-xs text-slate-400">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="flex-1 text-center">meet.google.com</span>
                <div className="w-5 h-5 rounded bg-violet-100 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-violet-700">AI</span>
                </div>
              </div>
              <div className="bg-violet-600 text-white text-xs rounded-xl p-3 max-w-[200px] mx-auto text-left shadow-lg">
                <p className="font-semibold mb-1">💡 Use STAR framework</p>
                <p className="opacity-80 text-[10px]">Situation → Task → Action → Result</p>
              </div>
              <p className="text-xs text-slate-400 mt-3">Coaching overlay (only visible to you)</p>
            </div>

            <div className="space-y-3">
              {[
                "Click the button below to open the Chrome Web Store",
                "Click 'Add to Chrome'",
                "Pin the extension to your toolbar (click the puzzle piece icon)",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-700">{step}</p>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open("#", "_blank")}
            >
              <Puzzle className="w-4 h-4" /> Open Chrome Web Store
            </Button>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-500 gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => { setExtensionSkipped(false); setStep(3); }}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2"
              >
                I've installed it ✓
              </Button>
            </div>
            <button
              onClick={() => { setExtensionSkipped(true); setStep(3); }}
              className="text-xs text-slate-400 hover:text-slate-600 w-full text-center pt-1"
            >
              Skip — I'll install later
            </button>
          </div>
        )}

        {/* STEP 4 — CONNECT EXTENSION */}
        {step === 3 && (
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Key className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Connect the extension to your account</h2>
              <p className="text-sm text-slate-500 mt-1">
                Copy your token and paste it into the extension popup
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Click the InterviewAI icon in your Chrome toolbar",
                "Click 'Connect Account'",
                "Paste your token below into the popup",
              ].map((inst, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-700">{inst}</p>
                </div>
              ))}
            </div>

            {token ? (
              <div>
                <Label className="text-slate-600 text-sm mb-1.5 block">Your API Token</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-violet-700 font-mono truncate">
                    {token}
                  </code>
                  <Button variant="outline" onClick={copyToken} className="flex-shrink-0 gap-1.5">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={generateToken} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" /> Generate Token
              </Button>
            )}

            <p className="text-xs text-slate-400 text-center">
              Can't find the extension icon? Click the puzzle piece 🧩 in your Chrome toolbar
            </p>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-500 gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => { setConnectSkipped(false); setStep(4); }}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2"
              >
                I've connected it ✓
              </Button>
            </div>
            <button
              onClick={() => { setConnectSkipped(true); setStep(4); }}
              className="text-xs text-slate-400 hover:text-slate-600 w-full text-center pt-1"
            >
              Skip — I'll connect later
            </button>
          </div>
        )}

        {/* STEP 5 — READY */}
        {step === 4 && (
          <div className="p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-40" />
              <div className="relative w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">You're all set! 🎉</h2>
              <p className="text-slate-500 mt-2">InterviewAI is ready to coach you</p>
            </div>

            {/* Setup summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-left">
              {[
                {
                  label: "CV Profile",
                  done: !cvSkipped,
                  value: cvSkipped ? "Not set up yet" : (cvProfileName || cvForm.name),
                },
                {
                  label: "Extension",
                  done: !extensionSkipped,
                  value: extensionSkipped ? "Install later" : "Installed",
                },
                {
                  label: "Extension connected",
                  done: !connectSkipped,
                  value: connectSkipped ? "Connect later" : "Connected",
                },
              ].map(({ label, done, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-medium flex items-center gap-1.5 ${done ? "text-emerald-600" : "text-slate-400"}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : null}
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={finishOnboarding}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2 py-6 text-base"
            >
              Create My First Interview <ArrowRight className="w-4 h-4" />
            </Button>

            <button
              onClick={async () => {
                await base44.auth.updateMe({
                  onboarding_completed: true,
                  onboarding_completed_at: new Date().toISOString(),
                });
                navigate(createPageUrl("Dashboard"));
              }}
              className="text-sm text-slate-400 hover:text-slate-600 block w-full text-center"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}