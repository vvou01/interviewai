import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    desc: "Try it out",
    features: [
      "2 interviews per month",
      "Transcript capture",
      "Basic debrief report",
      "1 CV profile",
    ],
    cta: "Get Started",
    style: "glass-card",
  },
  {
    name: "Pro",
    price: "€19",
    period: "/month",
    desc: "For active job seekers",
    popular: true,
    features: [
      "Unlimited interviews",
      "Full AI coaching (all 4 layers)",
      "Full debrief reports",
      "Up to 3 CV profiles",
      "Answer frameworks & CV hooks",
      "Smart follow-up questions",
    ],
    cta: "Start Pro",
    style: "gradient-border glow-indigo",
  },
  {
    name: "Pro+",
    price: "€35",
    period: "/month",
    desc: "Maximum advantage",
    features: [
      "Everything in Pro",
      "Unlimited CV profiles",
      "Salary negotiation mode",
      "Priority AI speed",
      "Advanced debrief analytics",
    ],
    cta: "Start Pro+",
    style: "glass-card",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Start free. Upgrade when you need the full power.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative ${plan.style} rounded-2xl p-8 ${plan.popular ? "md:-mt-4 md:mb-[-16px]" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={createPageUrl("Dashboard")}
                className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25"
                    : "glass-card glass-card-hover text-slate-200"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}