import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, ArrowRight } from "lucide-react";

export default function UpgradeBanner({ message }) {
  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/[0.06] to-violet-500/[0.06] border-indigo-500/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <p className="text-sm text-slate-300">
          {message || "Upgrade to Pro for unlimited AI coaching during your interviews."}
        </p>
      </div>
      <Link
        to={createPageUrl("Billing")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-colors flex-shrink-0"
      >
        Upgrade <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}