import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-100/60 blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-sm mb-8"
        >
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Interview Coaching
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-slate-900"
        >
          Your AI co-pilot for
          <br />
          <span className="gradient-text">job interviews</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Real-time answer coaching powered by AI.
          Only you can see it. Works with Google Meet, Zoom & Teams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to={createPageUrl("Dashboard")}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-base hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-200"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 rounded-xl text-slate-600 font-medium text-base bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
          >
            See How It Works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400"
        >
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-violet-400" />100% Private & Invisible</div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-violet-400" />Real-time AI Coaching</div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" />Setup in 2 Minutes</div>
        </motion.div>
      </div>
    </section>
  );
}