import React, { useMemo, useRef, useEffect } from "react";
import { Mic, UserRound } from "lucide-react";

function speakerLabel(speaker) {
  return speaker === "interviewer" ? "Interviewer" : "You";
}

function bubbleClasses(speaker) {
  if (speaker === "interviewer") {
    return "bg-slate-100 text-slate-700 rounded-tl-md";
  }

  return "bg-blue-50 text-blue-900 border border-blue-100 rounded-tr-md";
}

function avatarClasses(speaker) {
  if (speaker === "interviewer") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-blue-100 text-blue-600";
}

function formatTimestamp(seconds = 0) {
  const total = Number.isFinite(seconds) ? seconds : 0;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function countWords(text = "") {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function EmptyState({ isActive }) {
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm px-6">
      <div className="text-center max-w-xs">
        <Mic className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="font-medium text-slate-500">Waiting for transcript…</p>
        <p className="text-xs text-slate-400 mt-1">
          {isActive
            ? "Listening live — speak or wait for the interviewer."
            : "Transcript will appear when this session becomes active."}
        </p>
      </div>
    </div>
  );
}

function EntryRow({ entry, index }) {
  const isCandidate = entry.speaker === "candidate";

  return (
    <div key={entry.id || index} className={`flex gap-3 ${isCandidate ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${avatarClasses(
          entry.speaker
        )}`}
      >
        <UserRound className="w-3.5 h-3.5" />
      </div>

      <div className={`max-w-[80%] ${isCandidate ? "text-right" : ""}`}>
        <div className={`inline-block px-3.5 py-2 rounded-2xl text-sm ${bubbleClasses(entry.speaker)}`}>
          {entry.text}
        </div>

        <p className="text-[10px] text-slate-400 mt-1 px-1">
          {speakerLabel(entry.speaker)} · {formatTimestamp(entry.timestamp_seconds || 0)}
        </p>
      </div>
    </div>
  );
}

export default function TranscriptPanel({ entries = [], isActive = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries]);

  const totalWordCount = useMemo(() => {
    return entries.reduce((acc, entry) => acc + countWords(entry.text), 0);
  }, [entries]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          {isActive ? "Session active" : "Session inactive"}
        </div>
        <span className="text-slate-400">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <EmptyState isActive={isActive} />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {entries.map((entry, index) => (
            <EntryRow key={entry.id || index} entry={entry} index={index} />
          ))}
        </div>
      )}

      <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>Word count</span>
        <span className="font-medium text-slate-700">{totalWordCount}</span>
      </div>
    </div>
  );
}
