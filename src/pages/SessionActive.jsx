import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Square, Radio } from "lucide-react";
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

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => { const s = await base44.entities.InterviewSessions.filter({ id: sessionId, user_id: user?.id }); return s[0]; },
    enabled: !!sessionId,
  });

  // Activate session when it loads in "setup" state
  const activateMut = useMutation({
    mutationFn: () => base44.entities.InterviewSessions.update(sessionId, {
      status: "active",
      started_at: new Date().toISOString(),
    }),
    onSuccess: () => refetchSession(),
  });

  useEffect(() => {
    if (session && session.status === "setup") {
      activateMut.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.status]);

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
  const isBlurred = (user?.plan || "free") === "free";

  useEffect(() => {
    if (!session?.started_at) return;
    const start = new Date(session.started_at).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [session?.started_at]);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleEnd = async () => {
    await base44.entities.InterviewSessions.update(sessionId, { status: "completed", ended_at: new Date().toISOString() });
    navigate(createPageUrl(`SessionReport?id=${sessionId}`));
  };

  if (!session) return <div className="flex items-center justify-center h-64 text-slate-400">Loading session...</div>;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-4 md:-m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="text-xs text-red-500 font-medium">LIVE</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <Briefcase className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-800">{session.job_title}</span>
          <span className="text-sm text-slate-400">at {session.company_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatElapsed(elapsed)}</span>
          </div>
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
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
        <div className="lg:w-[60%] flex flex-col border-r border-slate-200 h-1/2 lg:h-full bg-white">
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-sm font-medium text-slate-500">Live Transcript</h3>
          </div>
          <TranscriptPanel entries={entries} />
        </div>
        <div className="lg:w-[40%] flex flex-col h-1/2 lg:h-full bg-white">
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-sm font-medium text-slate-500">AI Coaching</h3>
          </div>
          <CoachingPanel suggestion={latestSuggestion} isBlurred={isBlurred} />
        </div>
      </div>
    </div>
  );
}
