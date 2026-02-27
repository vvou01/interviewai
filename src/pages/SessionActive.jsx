import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Square, Radio, Copy, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import TranscriptPanel from "@/components/session/TranscriptPanel";
import CoachingPanel from "@/components/session/CoachingPanel";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SessionActive({ user }) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("id");
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [isVisible, setIsVisible] = useState(document.visibilityState === "visible");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onVisibilityChange = () => setIsVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["session", sessionId, user?.id],
    queryFn: async () => {
      const s = await base44.entities.InterviewSessions.filter({ id: sessionId, created_by: user?.id });
      return s[0] || null;
    },
    enabled: !!sessionId && !!user?.id,
  });

  const isActive = session?.status === "active";
  const isSetup = session?.status === "setup";
  const isCompleted = session?.status === "completed";

  const { data: entries = [] } = useQuery({
    queryKey: ["transcript", sessionId, user?.id],
    queryFn: () => base44.entities.TranscriptEntries.filter({ session_id: sessionId, user_id: user?.id }, "created_date"),
    enabled: !!sessionId && !!user?.id,
    refetchInterval: () => (isActive && isVisible ? 3000 : false),
    refetchOnWindowFocus: false,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions", sessionId, user?.id],
    queryFn: () => base44.entities.AISuggestions.filter({ session_id: sessionId, user_id: user?.id }, "-created_date", 1),
    enabled: !!sessionId && !!user?.id,
    refetchInterval: () => (isActive && isVisible ? 2000 : false),
    refetchOnWindowFocus: false,
  });

  const latestSuggestion = suggestions[0] || null;
  const isBlurred = (user?.plan || "free") === "free";

  useEffect(() => {
    if (!session?.started_at || !isActive) {
      setElapsed(0);
      return;
    }

    const start = new Date(session.started_at).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.started_at, isActive]);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleEnd = async () => {
    const response = await base44.functions.invoke("endSession", { session_id: sessionId });
    if (response?.error || response?.data?.error) return;
    navigate(createPageUrl(`SessionReport?id=${sessionId}`));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!sessionId) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Missing session ID.</p>
          <Link to={createPageUrl("Dashboard")}><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  if (!isLoadingSession && !session) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Session not found</h2>
          <p className="text-sm text-slate-500 mb-5">This session does not exist or is not available for your account.</p>
          <Link to={createPageUrl("Dashboard")}><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoadingSession || !session) {
    return <div className="h-screen flex items-center justify-center text-slate-400">Loading session...</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${isActive ? "text-red-500 animate-pulse" : "text-slate-300"}`} />
            <span className={`text-xs font-medium ${isActive ? "text-red-500" : "text-slate-400"}`}>{isActive ? "LIVE" : session.status.toUpperCase()}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <Briefcase className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-800 truncate">{session.job_title}</span>
          <span className="text-sm text-slate-400 truncate">at {session.company_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatElapsed(elapsed)}</span>
          </div>
          {isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                  <Square className="w-3.5 h-3.5 mr-1.5" /> End Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Interview Session?</AlertDialogTitle>
                  <AlertDialogDescription>This will stop live coaching and generate your debrief report.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEnd} className="bg-red-500 hover:bg-red-600">End Session</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="pt-14 flex-1 flex flex-col overflow-hidden bg-slate-50">
        {isSetup && (
          <div className="mx-4 mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-violet-800">Session is in setup mode</p>
              <p className="text-xs text-violet-700 mt-1">Install and activate the extension to begin. Timer will start once session becomes active.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-violet-200 bg-white text-xs font-mono text-violet-800">
                {sessionId} {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href="#" className="text-xs text-violet-700 inline-flex items-center gap-1">Install extension <ExternalLink className="w-3 h-3" /></a>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-emerald-800">This session has ended. Live polling is stopped.</p>
            <Link to={createPageUrl(`SessionReport?id=${sessionId}`)}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">View Report</Button>
            </Link>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden mt-4">
          <div className="lg:w-[60%] flex flex-col border-r border-slate-200 h-1/2 lg:h-full bg-white">
            <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-medium text-slate-500">Live Transcript</h3>
            </div>
            <TranscriptPanel entries={entries} isActive={isActive} />
          </div>
          <div className="lg:w-[40%] flex flex-col h-1/2 lg:h-full bg-white">
            <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-medium text-slate-500">AI Coaching</h3>
            </div>
            <CoachingPanel suggestion={latestSuggestion} isBlurred={isBlurred} />
          </div>
        </div>
      </div>
    </div>
  );
}
