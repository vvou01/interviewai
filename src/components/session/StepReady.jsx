import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Copy, Check, MonitorPlay, Puzzle, ArrowRight } from "lucide-react";

export default function StepReady({ sessionId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 text-center max-w-lg mx-auto">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold">Session Ready!</h2>
        <p className="text-slate-400 mt-2">Your interview session has been created. Here's what to do next.</p>
      </div>

      {/* Session ID */}
      <div className="glass-card p-5">
        <p className="text-sm text-slate-500 mb-2">Session ID</p>
        <div className="flex items-center justify-center gap-3">
          <code className="text-lg font-mono text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-lg">
            {sessionId}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 text-left">
        <div className="glass-card p-4 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-400">1</div>
          <div>
            <p className="text-sm font-medium text-white">Open your Chrome extension</p>
            <p className="text-xs text-slate-500 mt-0.5">Click the InterviewAI icon in your browser toolbar</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-400">2</div>
          <div>
            <p className="text-sm font-medium text-white">Enter this Session ID</p>
            <p className="text-xs text-slate-500 mt-0.5">Paste it in the extension's session field</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-400">3</div>
          <div>
            <p className="text-sm font-medium text-white">Join your video call & click Start</p>
            <p className="text-xs text-slate-500 mt-0.5">AI coaching will appear in the floating overlay</p>
          </div>
        </div>
      </div>

      <Link
        to={createPageUrl(`SessionActive?id=${sessionId}`)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25"
      >
        <MonitorPlay className="w-4 h-4" /> View Live Session
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}