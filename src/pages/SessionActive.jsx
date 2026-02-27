import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Square, AlertTriangle, Radio } from "lucide-react";
import TranscriptPanel from "@/components/session/TranscriptPanel";
import CoachingPanel from "@/components/session/CoachingPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SessionActive({ user }) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("id");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [elapsed, setElapsed] = useState(0);

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const sessions = await base44.entities.InterviewSessions.filter({ id: sessionId });
      return sessions[0];
    },
    enabled: !!sessionId,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["transcript", sessionId],
    queryFn: () => base44.entities.TranscriptEntries.filter({ session_id: sessionId }, "created_date"),
    enabled: !!sessionId,
    refetchInterval: 3000,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions", sessionId],
    queryFn: () => base44.entities.AISuggestions.filter({ session_id: sessionId }, "-created_date", 1),
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const latestSuggestion = suggestions[0] || null;
  const plan = user?.plan || "free";
  const isBlurred = plan === "free";

  // Timer
  useEffect(() => {
    if (!session?.started_at) return;
    const start = new Date(session.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.started_at]);

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleEnd = async () => {
    await base44.entities.InterviewSessions.update(sessionId, {
      status: "completed",
      ended_at: new Date().toISOString(),
    });
    navigate(createPageUrl(`SessionReport?id=${sessionId}`));
  };

  if (!session) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading session...</div>;
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-4 md:-m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="h-14 bg-[#0d1220] border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">LIVE</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <Briefcase className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">{session.job_title}</span>
          <span className="text-sm text-slate-500">at {session.company_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatElapsed(elapsed)}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
                <Square className="w-3.5 h-3.5 mr-1.5" /> End Session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1a2035] border-white/[0.1]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">End Interview Session?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will stop live coaching and generate your debrief report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-300">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEnd} className="bg-red-500 hover:bg-red-600">End Session</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Transcript */}
        <div className="lg:w-[60%] flex flex-col border-r border-white/[0.04] h-1/2 lg:h-full">
          <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
            <h3 className="text-sm font-medium text-slate-400">Live Transcript</h3>
          </div>
          <TranscriptPanel entries={entries} />
        </div>

        {/* Coaching */}
        <div className="lg:w-[40%] flex flex-col h-1/2 lg:h-full">
          <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
            <h3 className="text-sm font-medium text-slate-400">AI Coaching</h3>
          </div>
          <CoachingPanel suggestion={latestSuggestion} isBlurred={isBlurred} />
        </div>
      </div>
    </div>
  );
}