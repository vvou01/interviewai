import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap } from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">
              Interview<span className="text-violet-600">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-900 transition">How It Works</a>
            <a href="#pricing" className="hover:text-slate-900 transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Dashboard")} className="text-sm text-slate-600 hover:text-slate-900 transition px-4 py-2">
              Sign In
            </Link>
            <Link to={createPageUrl("Dashboard")} className="text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-sm shadow-violet-200">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <HowItWorks />
      <PricingSection />
      <FAQSection />

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm text-slate-700">InterviewAI</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 InterviewAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}