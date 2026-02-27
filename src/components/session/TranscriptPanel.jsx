import React, { useRef, useEffect, useMemo } from "react";
import { User, Mic } from "lucide-react";

export default function TranscriptPanel({ entries = [], isActive }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries]);

  const wordCount = useMemo(
    () => entries.reduce((acc, entry) => acc + (entry?.text?.trim()?.split(/\s+/)?.filter(Boolean)?.length || 0), 0),
    [entries]
  );

  if (!entries.length) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          {isActive ? "Listening live" : "Session not active"}
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          <div className="text-center">
            <Mic className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Waiting for transcript...</p>
            <p className="text-xs text-slate-400 mt-1">Speak or wait for the interviewer</p>
          </div>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500">Word count: 0</div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-500">
        <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
        {isActive ? "Listening live" : "Session not active"}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {entries.map((entry, i) => (
          <div key={entry.id || i} className={`flex gap-3 ${entry.speaker === "candidate" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
              entry.speaker === "interviewer" ? "bg-slate-100" : "bg-blue-100"
            }`}>
              <User className={`w-3.5 h-3.5 ${entry.speaker === "interviewer" ? "text-slate-500" : "text-blue-600"}`} />
            </div>
            <div className={`max-w-[80%] ${entry.speaker === "candidate" ? "text-right" : ""}`}>
              <div className={`inline-block px-3.5 py-2 rounded-2xl text-sm ${
                entry.speaker === "interviewer"
                  ? "bg-slate-100 text-slate-700 rounded-tl-md"
                  : "bg-blue-50 text-blue-900 border border-blue-100 rounded-tr-md"
              }`}>
                {entry.text}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 px-1">
                {entry.speaker === "interviewer" ? "Interviewer" : "You"} · {formatTime(entry.timestamp_seconds || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500">Word count: {wordCount}</div>
    </div>
  );
}
