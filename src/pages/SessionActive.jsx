import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Square, Copy, Check, ExternalLink, ArrowRight } from "lucide-react";
import TranscriptPanel from "@/components/session/TranscriptPanel";
import CoachingPanel from "@/components/session/CoachingPanel";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function SessionActive({ user }) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("id");
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [entries, setEntries] = useState([]);
  const [latestSuggestion, setLatestSuggestion] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(document.visibilityState !== "hidden");

  const transcriptIntervalRef = useRef(null);
  const coachingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    const onVisibilityChange = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Load session once
  useEffect(() => {
    if (!sessionId || !user?.email) return;
    base44.entities.InterviewSessions.filter({ id: sessionId })
      .then((res) => {
        if (!res || res.length === 0) { setNotFound(true); return; }
        setSession(res[0]);
        sessionRef.current = res[0];
      });
  }, [sessionId, user?.email]);

  // Timer
  useEffect(() => {
    if (!session?.started_at || session.status !== "active") return;
    const start = new Date(session.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [session?.started_at, session?.status]);

  // Polling — respects visibilityState
  const pollTranscript = useCallback(async () => {
    if (!isVisible || sessionRef.current?.status !== "active") return;
    const data = await base44.entities.TranscriptEntries.filter(
      { session_id: sessionId },
      "timestamp_seconds"
    );
    setEntries(data);
  }, [sessionId, user?.email, isVisible]);

  const pollCoaching = useCallback(async () => {
    if (!isVisible || sessionRef.current?.status !== "active") return;
    const data = await base44.entities.AISuggestions.filter(
      { session_id: sessionId },
      "-created_date",
      1
    );
    if (data && data.length > 0) setLatestSuggestion(data[0]);
  }, [sessionId, user?.email, isVisible]);

  const pollSession = useCallback(async () => {
    if (!isVisible || !user?.email) return;
    const res = await base44.entities.InterviewSessions.filter({ id: sessionId });
    if (res && res.length > 0) {
      setSession(res[0]);
      sessionRef.current = res[0];
    }
  }, [sessionId, user?.email, isVisible]);

  useEffect(() => {
    if (!session || session.status !== "active") return;

    pollTranscript();
    pollCoaching();

    transcriptIntervalRef.current = setInterval(pollTranscript, 3000);
    coachingIntervalRef.current = setInterval(pollCoaching, 2000);
    const sessionPollInterval = setInterval(pollSession, 5000);

    return () => {
      clearInterval(transcriptIntervalRef.current);
      clearInterval(coachingIntervalRef.current);
      clearInterval(sessionPollInterval);
    };
  }, [session?.status, isVisible]);

  useEffect(() => {
    if (session?.status === "completed") {
      clearInterval(transcriptIntervalRef.current);
      clearInterval(coachingIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    }
  }, [session?.status]);

  const handleEnd = async () => {
    setIsEnding(true);
    try {
      await base44.functions.invoke("endSession", { session_id: sessionId });
      setTimeout(() => navigate(createPageUrl(`SessionReport?id=${sessionId}`)), 2000);
    } catch (err) {
      console.error("[InterviewAI] Failed to end session:", err);
      setIsEnding(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBlurred = (user?.plan || "free") === "free";
  const isActive = session?.status === "active";
  const isSetup = session?.status === "setup";
  const isCompleted = session?.status === "completed";

  // ── Render states ──────────────────────────────────────────────

  if (!sessionId || notFound) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <div className="glass-card p-10">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Session not found</h2>
          <p className="text-slate-500 mb-6 text-sm">This session doesn't exist or doesn't belong to you.</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading session...</div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 z-40">
      {/* ── Top Bar ── */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        {/* Left: job info */}
        <div className="flex items-center gap-2 min-w-0">
          {isActive && (
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
          <span className="font-bold text-slate-900 truncate">{session.job_title}</span>
          <span className="text-slate-400 text-sm hidden sm:inline">at</span>
          <span className="font-bold text-slate-900 truncate hidden sm:inline">{session.company_name}</span>
        </div>

        {/* Center: timer */}
        <div className="font-mono text-xl font-bold text-slate-700 tabular-nums">
          {isActive ? formatTime(elapsed) : "00:00"}
        </div>

        {/* Right: end button */}
        <div className="flex-shrink-0">
          {isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400">
                  <Square className="w-3.5 h-3.5 mr-1.5" /> End Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End this interview session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your debrief report will be generated automatically.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEnd}
                    disabled={isEnding}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isEnding ? "Ending…" : "End Session"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isCompleted && (
            <Link to={createPageUrl(`SessionReport?id=${sessionId}`)}>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600">
                View Report <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Status banners ── */}
      {isSetup && (
        <SetupBanner sessionId={sessionId} copied={copied} onCopy={handleCopy} />
      )}
      {isCompleted && (
        <div className="bg-slate-800 text-white text-sm py-2 px-4 text-center flex-shrink-0">
          Session ended — <Link to={createPageUrl(`SessionReport?id=${sessionId}`)} className="underline font-medium">View your report →</Link>
        </div>
      )}
      {isEnding && (
        <div className="bg-violet-600 text-white text-sm py-2 px-4 text-center flex-shrink-0 animate-pulse">
          Generating your debrief report…
        </div>
      )}

      {/* ── Two-panel layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Transcript 60% */}
        <div className="w-[60%] flex flex-col border-r border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Live Transcript</h3>
          </div>
          <TranscriptPanel entries={entries} isActive={isActive} />
        </div>

        {/* Right: Coaching 40% */}
        <div className="w-[40%] flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-700">AI Coaching</h3>
          </div>
          <CoachingPanel suggestion={latestSuggestion} isBlurred={isBlurred} />
        </div>
      </div>
    </div>
  );
}

function SetupBanner({ sessionId, copied, onCopy }) {
  return (
    <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-4">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-semibold text-amber-800 mb-1">Session ready — activate the Chrome extension to begin</p>
        <p className="text-xs text-amber-700 mb-3">Enter this session ID in the extension to start live coaching</p>
        <div className="inline-flex items-center gap-3 bg-white border border-amber-200 rounded-xl px-4 py-2 shadow-sm">
          <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">{sessionId}</span>
          <button
            onClick={() => onCopy(sessionId)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
              copied ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <div className="mt-3">
          <a href="#" className="text-xs text-amber-700 underline inline-flex items-center gap-1">
            Don't have the extension yet? Install it here <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
