import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Sparkles, CreditCard, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const planLimits = { free: 2, pro: Infinity, pro_plus: Infinity };

const plans = [
  { id: "free", name: "Free", price: "€0", period: "forever", features: ["2 interviews/month", "Transcript capture only", "Basic debrief report", "1 CV profile"] },
  { id: "pro", name: "Pro", price: "€19", period: "/month", popular: true, features: ["Unlimited interviews", "Full AI coaching (4 layers)", "Full debrief reports", "Up to 3 CV profiles", "Answer frameworks & CV hooks"] },
  { id: "pro_plus", name: "Pro+", price: "€35", period: "/month", features: ["Everything in Pro", "Unlimited CV profiles", "Salary negotiation mode", "Priority AI speed"] },
];

export default function Billing({ user }) {
  const plan = user?.plan || "free";
  const used = user?.interviews_used_this_month || 0;
  const limit = planLimits[plan];
  const { toast } = useToast();

  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const alreadyOnWaitlist = !!user?.waitlist_signup;

  const handlePlanClick = (p) => {
    setTargetPlan(p);
    setWaitlistOpen(true);
  };

  const handleWaitlistSignup = async () => {
    if (alreadyOnWaitlist) { setWaitlistOpen(false); return; }
    setIsSigningUp(true);
    try {
      await base44.auth.updateMe({ waitlist_signup: true });
      setWaitlistOpen(false);
      toast({ title: "You're on the waitlist!", description: "We'll email you as soon as billing goes live." });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Billing</h1>

      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-violet-600" />
              <h2 className="font-semibold text-lg text-slate-800">Current Plan</h2>
            </div>
            <p className="text-2xl font-bold text-slate-900 capitalize mt-2">{plan === "pro_plus" ? "Pro+" : plan}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Usage this month</p>
            <p className="text-lg font-semibold text-slate-800 mt-1">{used} {limit !== Infinity && `/ ${limit}`}</p>
            {limit !== Infinity && (
              <div className="mt-2 w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${Math.min((used / limit) * 100, 100)}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {alreadyOnWaitlist && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />
          <p className="text-sm text-slate-700">You're on the waitlist! We'll email you when paid plans launch.</p>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-lg mb-4 text-slate-800">{plan === "free" ? "Upgrade Your Plan" : "All Plans"}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isCurrent = p.id === plan;
            return (
              <div key={p.id} className={`glass-card p-6 relative ${p.popular ? "border-violet-300 shadow-md shadow-violet-100 ring-1 ring-violet-200" : ""} ${isCurrent ? "ring-1 ring-violet-300" : ""}`}>
                {p.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-semibold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Popular
                  </div>
                )}
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <div className="mt-3 mb-5">
                  <span className="text-3xl font-bold text-slate-900">{p.price}</span>
                  <span className="text-sm text-slate-400 ml-1">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="text-center py-2.5 rounded-lg bg-slate-100 text-sm text-slate-500 font-medium">Current Plan</div>
                ) : (
                  <Button
                    onClick={() => handlePlanClick(p)}
                    className={`w-full ${p.popular ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                  >
                    {p.id === "free" ? "Downgrade" : alreadyOnWaitlist ? "On Waitlist ✓" : "Upgrade"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-violet-600" />
              </div>
              <DialogTitle>Payment Coming Soon</DialogTitle>
            </div>
            <DialogDescription>
              {alreadyOnWaitlist
                ? "You're already on the waitlist! We'll email you as soon as billing goes live."
                : `We're launching paid plans soon. Join the waitlist for ${targetPlan?.name} and we'll email you the moment it's ready.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWaitlistOpen(false)}>Close</Button>
            {!alreadyOnWaitlist && (
              <Button
                onClick={handleWaitlistSignup}
                disabled={isSigningUp}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {isSigningUp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing up...</> : "Join Waitlist"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
