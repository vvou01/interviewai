import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Zap, User, ChevronDown, LayoutDashboard, History, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";

export default function Landing() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user-landing"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFAQClick = (e) => {
    e.preventDefault();
    const el = document.getElementById("faq");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#faq";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo — links to "/" */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">
              Interview<span className="text-violet-600">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-900 transition">How It Works</a>
            <a href="#pricing" className="hover:text-slate-900 transition">Pricing</a>
            <a href="#faq" onClick={handleFAQClick} className="hover:text-slate-900 transition">FAQ</a>
          </div>

          {/* Auth controls — smart: logged-in vs guest */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                <div className="w-7 h-7 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <span className="hidden sm:inline font-medium">
                  {currentUser.full_name?.split(" ")[0] || currentUser.email}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800 truncate">{currentUser.full_name || "User"}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <Link
                    to={createPageUrl("Dashboard")}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" /> Go to Dashboard
                  </Link>
                  <Link
                    to={createPageUrl("History")}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <History className="w-4 h-4 text-slate-400" /> My Sessions
                  </Link>
                  <button
                    onClick={() => { setDropdownOpen(false); base44.auth.logout(); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Dashboard")} className="text-sm text-slate-600 hover:text-slate-900 transition px-4 py-2">
                Sign In
              </Link>
              <Link to={createPageUrl("Dashboard")} className="text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-sm shadow-violet-200">
                Get Started
              </Link>
            </div>
          )}
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
