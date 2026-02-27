import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Check, ExternalLink } from "lucide-react";

export default function StepReady({ sessionId }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-center py-4">
      {/* Animated checkmark */}
      <div className={`transition-all duration-700 ease-out ${visible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-200">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">Your session is ready</h2>
      <p className="text-slate-500 mb-8">
        Activate the Chrome extension to start receiving live coaching during your interview.
      </p>

      {/* Session ID box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Session ID</p>
        <div className="flex items-center justify-center gap-3">
          <span className="font-mono text-lg font-bold text-slate-800 tracking-wider break-all">
            {sessionId}
          </span>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Link to={createPageUrl(`SessionActive?id=${sessionId}`)}>
          <Button className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-6">
            <ExternalLink className="w-4 h-4 mr-2" /> View Live Session
          </Button>
        </Link>
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="outline" className="w-full sm:w-auto text-slate-600 px-6">
            I'll start later
          </Button>
        </Link>
      </div>

      {/* Extension reminder */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
        Don't have the extension yet?{" "}
        <a href="#" className="text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1">
          Install it here <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}