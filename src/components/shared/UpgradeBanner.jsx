import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, ArrowRight } from "lucide-react";

export default function UpgradeBanner({ message }) {
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-violet-600" />
        </div>
        <p className="text-sm text-slate-700">
          {message || "Upgrade to Pro for unlimited AI coaching during your interviews."}
        </p>
      </div>
      <Link
        to={createPageUrl("Billing")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors flex-shrink-0"
      >
        Upgrade <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}