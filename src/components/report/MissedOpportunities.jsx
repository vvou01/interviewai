import React from "react";
import { AlertTriangle } from "lucide-react";

export default function MissedOpportunities({ items = [] }) {
  return (
    <div className="glass-card p-6 border-l-4 border-l-amber-400">
      <h2 className="font-semibold text-lg text-slate-800 mb-4">Areas to Improve</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No missed opportunities recorded.</p>
      ) : (
        <div className="space-y-2">
          {items.map((m, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{m}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}