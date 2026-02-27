import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Key, User, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings({ user }) {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(user?.api_token || "");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { if (user?.api_token) setToken(user.api_token); }, [user]);

  const generateToken = async () => {
    const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await base44.auth.updateMe({ api_token: newToken });
    setToken(newToken);
  };

  const copyToken = () => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete in dependency order: children before parents
      const sessions = await base44.entities.InterviewSessions.list();
      for (const s of sessions) {
        // 1. TranscriptEntries
        const transcripts = await base44.entities.TranscriptEntries.filter({ session_id: s.id });
        for (const t of transcripts) await base44.entities.TranscriptEntries.delete(t.id);
        // 2. AISuggestions
        const suggestions = await base44.entities.AISuggestions.filter({ session_id: s.id });
        for (const sg of suggestions) await base44.entities.AISuggestions.delete(sg.id);
        // 3. DebriefReports
        const reports = await base44.entities.DebriefReports.filter({ session_id: s.id });
        for (const r of reports) await base44.entities.DebriefReports.delete(r.id);
        // 4. The session itself
        await base44.entities.InterviewSessions.delete(s.id);
      }
      // 5. CVProfiles
      const cvProfiles = await base44.entities.CVProfiles.list();
      for (const p of cvProfiles) await base44.entities.CVProfiles.delete(p.id);
      // 6. Log out (account record deletion handled server-side by Base44)
      base44.auth.logout(window.location.href);
    } catch (err) {
      console.error("Error deleting account:", err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold text-lg text-slate-800">Account</h2>
        </div>
        <div>
          <Label className="text-slate-600 text-sm">Full Name</Label>
          <Input value={user?.full_name || ""} disabled className="mt-1.5 bg-slate-50 text-slate-500" />
        </div>
        <div>
          <Label className="text-slate-600 text-sm">Email</Label>
          <Input value={user?.email || ""} disabled className="mt-1.5 bg-slate-50 text-slate-500" />
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold text-lg text-slate-800">API Token</h2>
        </div>
        <p className="text-sm text-slate-500">Use this token to connect the Chrome extension to your account.</p>
        {token ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-violet-700 font-mono truncate">{token}</code>
            <Button variant="ghost" size="icon" onClick={copyToken} className="flex-shrink-0 text-slate-500">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No API token generated yet.</p>
        )}
        <Button onClick={generateToken} variant="outline" className="text-slate-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          {token ? "Regenerate Token" : "Generate Token"}
        </Button>
      </div>

      <div className="glass-card p-6 border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-lg text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all associated data.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete your account, all CV profiles, sessions, and reports. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}