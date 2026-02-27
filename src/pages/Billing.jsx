import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Sparkles, CreditCard, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const planLimits = { free: 2, pro: Infinity, pro_plus: Infinity };

const PLAN_BADGE = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-blue-100 text-blue-700",
  pro_plus: "bg-purple-100 text-purple-700",
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "€0",
    period: "forever",
    features: [
      "2 interviews/month",
      "Transcript capture only",
      "Basic debrief report",
      "1 CV profile",
      "No live coaching",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "€19",
    period: "/month",
    popular: true,
    features: [
      "Unlimited interviews",
      "Live AI coaching (all 4 layers)",
      "Full debrief reports",
      "Up to 3 CV profiles",
      "Answer frameworks & CV hooks",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    price: "€35",
    period: "/month",
    features: [
      "Everything in Pro",
      "Unlimited CV profiles",
      "Salary negotiation mode",
      "Priority AI speed",
    ],
  },
];

const PLAN_FEATURES = {
  free: ["2 interviews/month", "Transcript capture only", "Basic debrief report", "1 CV profile"],
  pro: ["Unlimited interviews", "Live AI coaching (all 4 layers)", "Full debrief reports", "Up to 3 CV profiles"],
  pro_plus: ["Everything in Pro", "Unlimited CV profiles", "Salary negotiation mode", "Priority AI speed"],
};

export default function Billing({ user }) {
  const [waitlistModal, setWaitlistModal] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  const plan = user?.plan || "free";
  const used = user?.interviews_used_this_month || 0;
  const limit = planLimits[plan];
  const usagePercent = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);
  const planLabel = plan === "pro_plus" ? "Pro+" : plan.charAt(0).toUpperCase() + plan.slice(1);

  const joinWaitlist = async () => {
    await base44.auth.updateMe({ waitlist_signup: true });
    setWaitlistDone(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Billing</h1>

      {/* Waitlist banner */}
      {user?.waitlist_signup && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            You're on the waitlist! We'll email you when billing goes live.
          </p>
        </div>
      )}

      {/* Current plan card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-violet-600" />
              <h2 className="font-semibold text-lg text-slate-800">Current Plan</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{planLabel}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${PLAN_BADGE[plan]}`}>
                {planLabel}
              </span>
            </div>
            <ul className="mt-4 space-y-1.5">
              {(PLAN_FEATURES[plan] || []).map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-[160px]">
            <p className="text-sm text-slate-500 mb-1">Usage this month</p>
            <p className="text-xl font-bold text-slate-800">
              {used}{limit !== Infinity ? ` / ${limit}` : " used"}
            </p>
            {limit !== Infinity && (
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePercent >= 100 ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-purple-500"}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
            <div className="mt-4">
              {plan === "free" ? (
                <Button
                  onClick={() => setWaitlistModal(true)}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white w-full"
                >
                  Upgrade to Pro
                </Button>
              ) : (
                <Button variant="outline" className="w-full text-slate-700">
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing table */}
      <div>
        <h2 className="font-semibold text-lg mb-4 text-slate-800">All Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isCurrent = p.id === plan;
            return (
              <div
                key={p.id}
                className={`glass-card p-6 relative ${
                  p.popular ? "border-violet-300 shadow-md shadow-violet-100 ring-1 ring-violet-200" : ""
                } ${isCurrent ? "ring-1 ring-violet-300" : ""}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-semibold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Most Popular
                  </div>
                )}
                <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                <div className="mt-2 mb-5">
                  <span className="text-3xl font-bold text-slate-900">{p.price}</span>
                  <span className="text-sm text-slate-400 ml-1">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="text-center py-2.5 rounded-lg bg-slate-100 text-sm text-slate-500 font-medium">
                    Current Plan
                  </div>
                ) : p.id === "free" ? (
                  <Button variant="outline" className="w-full text-slate-600">
                    Downgrade
                  </Button>
                ) : (
                  <Button
                    onClick={() => setWaitlistModal(true)}
                    className={`w-full ${p.popular ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Waitlist modal */}
      {waitlistModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
            <button onClick={() => setWaitlistModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            {waitlistDone ? (
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">You're on the list!</h3>
                <p className="text-slate-500 text-sm">We'll email you at <strong>{user?.email}</strong> when paid plans go live.</p>
                <Button onClick={() => setWaitlistModal(false)} className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white">
                  Done
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Paid plans coming soon</h3>
                <p className="text-slate-500 text-sm mb-6">
                  We're launching paid plans shortly. Join the waitlist and we'll notify you as soon as billing goes live — with a special early-bird discount.
                </p>
                <Button onClick={joinWaitlist} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white">
                  Join Waitlist
                </Button>
                <button onClick={() => setWaitlistModal(false)} className="mt-3 text-sm text-slate-400 hover:text-slate-600 w-full">
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}