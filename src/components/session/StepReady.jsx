import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Copy, Check, MonitorPlay, ArrowRight } from "lucide-react";

export default function StepReady({ sessionId }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(sessionId); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-8 text-center max-w-lg mx-auto">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Session Ready!</h2>
        <p className="text-slate-500 mt-2">Your interview session has been created. Here's what to do next.</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <p className="text-sm text-slate-500 mb-2">Session ID</p>
        <div className="flex items-center justify-center gap-3">
          <code className="text-lg font-mono text-violet-700 bg-violet-50 border border-violet-200 px-4 py-2 rounded-lg">{sessionId}</code>
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-3 text-left">
        {[
          { n: 1, title: "Open your Chrome extension", desc: "Click the InterviewAI icon in your browser toolbar" },
          { n: 2, title: "Enter this Session ID", desc: "Paste it in the extension's session field" },
          { n: 3, title: "Join your video call & click Start", desc: "AI coaching will appear in the floating overlay" },
        ].map((s) => (
          <div key={s.n} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-700">{s.n}</div>
            <div>
              <p className="text-sm font-medium text-slate-800">{s.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to={createPageUrl(`SessionActive?id=${sessionId}`)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-md shadow-violet-200">
        <MonitorPlay className="w-4 h-4" /> View Live Session <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}