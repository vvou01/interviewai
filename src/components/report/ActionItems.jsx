import React, { useState, useEffect } from "react";

export default function ActionItems({ items = [], sessionId }) {
  const storageKey = `action-items-${sessionId}`;
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, [sessionId]);

  const toggle = (i) => {
    const next = { ...checked, [i]: !checked[i] };
    setChecked(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <div className="glass-card p-6">
      <h2 className="font-semibold text-lg text-slate-800 mb-4">Your Action Items</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No action items generated.</p>
      ) : (
        <>
          <div className="space-y-1">
            {items.map((item, i) => (
              <label
                key={i}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!!checked[i]}
                  onChange={() => toggle(i)}
                  className="mt-0.5 w-4 h-4 rounded accent-violet-600 cursor-pointer flex-shrink-0"
                />
                <p className={`text-sm transition-all ${checked[i] ? "line-through text-slate-400" : "text-slate-700"}`}>
                  {item}
                </p>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 pl-1">
            {Object.values(checked).filter(Boolean).length} of {items.length} completed
          </p>
        </>
      )}
    </div>
  );
}