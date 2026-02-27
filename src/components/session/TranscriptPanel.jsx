import React, { useRef, useEffect } from "react";
import { User, Mic } from "lucide-react";

export default function TranscriptPanel({ entries }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries]);

  if (!entries || entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        <div className="text-center">
          <Mic className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>Waiting for transcript...</p>
          <p className="text-xs text-slate-400 mt-1">Speak or wait for the interviewer</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
      {entries.map((entry, i) => (
        <div key={entry.id || i} className={`flex gap-3 ${entry.speaker === "candidate" ? "flex-row-reverse" : ""}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
            entry.speaker === "interviewer" ? "bg-slate-100" : "bg-violet-100"
          }`}>
            <User className={`w-3.5 h-3.5 ${entry.speaker === "interviewer" ? "text-slate-500" : "text-violet-600"}`} />
          </div>
          <div className={`max-w-[80%] ${entry.speaker === "candidate" ? "text-right" : ""}`}>
            <div className={`inline-block px-3.5 py-2 rounded-2xl text-sm ${
              entry.speaker === "interviewer"
                ? "bg-slate-100 text-slate-700 rounded-tl-md"
                : "bg-violet-50 text-violet-900 border border-violet-100 rounded-tr-md"
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
  );
}