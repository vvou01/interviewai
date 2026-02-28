import React, { useRef, useEffect, useState, useMemo } from "react";
import { Mic, ChevronDown } from "lucide-react";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function TranscriptPanel({ entries, isActive }) {
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(atBottom);
    setShowScrollBtn(!atBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    setAutoScroll(true);
    setShowScrollBtn(false);
  };

  const wordCount = useMemo(
    () => entries.reduce((acc, e) => acc + (e.text?.split(/\s+/).length || 0), 0),
    [entries]
  );

  if (!entries || entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
          <span className="text-xs text-slate-500">{isActive ? "Listening live" : "Session not active"}</span>
        </div>
        {isActive && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto mb-4 w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-slate-100 animate-ping opacity-40" />
                <div className="relative w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-slate-300" />
                </div>
              </div>
              <p className="text-sm text-slate-400">Waiting for the conversation to begin…</p>
            </div>
          </div>
        )}
        {!isActive && <div className="flex-1" />}
        <div className="px-4 py-2 border-t border-slate-100 flex-shrink-0">
          <span className="text-[11px] text-slate-400">0 words transcribed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
        <span className="text-xs text-slate-500">{isActive ? "Listening live" : "Session not active"}</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
      >
        {entries.map((entry, i) => {
          const isInterviewer = entry.speaker === "interviewer";
          return (
            <div key={entry.id || i} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isInterviewer
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
                }`}>
                  {isInterviewer ? "Interviewer" : "You"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatTime(entry.timestamp_seconds || 0)}
                </span>
              </div>
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isInterviewer
                  ? "bg-slate-50 text-slate-700 rounded-tl-md"
                  : "bg-blue-50 text-blue-900 border border-blue-100 rounded-tr-md"
              }`}>
                {entry.text}
              </div>
            </div>
          );
        })}
      </div>
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-12 right-4 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      )}
      <div className="px-4 py-2 border-t border-slate-100 flex-shrink-0">
        <span className="text-[11px] text-slate-400">{wordCount} words transcribed</span>
      </div>
    </div>
  );
}
