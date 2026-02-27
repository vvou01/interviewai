import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Key, User, AlertTriangle, RefreshCw, Bell, Save } from "lucide-react";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-violet-600" />
        <h2 className="font-semibold text-lg text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Settings({ user }) {
  // Account
  const [displayName, setDisplayName] = useState(user?.full_name || "");
  const [nameSaved, setNameSaved] = useState(false);

  // Token
  const [token, setToken] = useState(user?.api_token || "");
  const [copied, setCopied] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // Notifications
  const [emailSummary, setEmailSummary] = useState(user?.notif_email_summary ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(user?.notif_weekly_digest ?? false);

  // Danger zone
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (user?.api_token) setToken(user.api_token);
    if (user?.full_name) setDisplayName(user.full_name);
  }, [user]);

  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const saveName = async () => {
    await base44.auth.updateMe({ full_name: displayName });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateToken = async () => {
    const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await base44.auth.updateMe({ api_token: newToken });
    setToken(newToken);
    setShowRegenConfirm(false);
  };

  const saveNotifications = async () => {
    await base44.auth.updateMe({ notif_email_summary: emailSummary, notif_weekly_digest: weeklyDigest });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    // Delete all user data then logout
    const sessions = await base44.entities.InterviewSessions.filter({ created_by: user?.email });
    for (const s of sessions) {
      await base44.entities.InterviewSessions.delete(s.id);
    }
    const cvs = await base44.entities.CVProfiles.filter({ created_by: user?.email });
    for (const cv of cvs) {
      await base44.entities.CVProfiles.delete(cv.id);
    }
    base44.auth.logout();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* Account Details */}
      <Section title="Account Details" icon={User}>
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {initials || "?"}
          </div>
          <div>
            <p className="font-medium text-slate-800">{displayName || "No name set"}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div>
          <Label className="text-slate-600 text-sm">Display Name</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="flex-1"
              placeholder="Your name"
            />
            <Button onClick={saveName} variant="outline" className="gap-1.5 flex-shrink-0">
              {nameSaved ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
              {nameSaved ? "Saved!" : "Save"}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-slate-600 text-sm">Email Address</Label>
          <Input value={user?.email || ""} disabled className="mt-1.5 bg-slate-50 text-slate-400 cursor-not-allowed" />
        </div>
      </Section>

      {/* Chrome Extension Token */}
      <Section title="Chrome Extension" icon={Key}>
        <p className="text-sm text-slate-500">
          Use this token to connect the InterviewAI Chrome extension to your account.
        </p>
        {token ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-violet-700 font-mono truncate">
              {token}
            </code>
            <Button variant="ghost" size="icon" onClick={copyToken} className="flex-shrink-0 text-slate-500">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No token generated yet.</p>
        )}

        {showRegenConfirm ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
            <p className="text-sm text-amber-800 font-medium">
              This will disconnect any active extension sessions. Continue?
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={generateToken} className="bg-amber-600 hover:bg-amber-700 text-white">
                Yes, Regenerate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowRegenConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => token ? setShowRegenConfirm(true) : generateToken()} variant="outline" className="text-slate-700 gap-2">
            <RefreshCw className="w-4 h-4" />
            {token ? "Regenerate Token" : "Generate Token"}
          </Button>
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <p className="text-sm text-slate-500">Choose what emails you receive from InterviewAI.</p>
        <div className="space-y-3">
          {[
            { label: "Email summary after each interview", value: emailSummary, set: setEmailSummary },
            { label: "Weekly progress digest", value: weeklyDigest, set: setWeeklyDigest },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm text-slate-700">{label}</span>
              <button
                onClick={() => set(v => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-violet-600" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
          ))}
        </div>
        <Button onClick={saveNotifications} variant="outline" size="sm" className="text-slate-700">
          Save Preferences
        </Button>
      </Section>

      {/* Danger Zone */}
      <div className="glass-card p-6 border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-lg text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>

        {deleteStep === 0 && (
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setDeleteStep(1)}
          >
            Delete Account
          </Button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-red-700 font-medium">Type <strong>DELETE</strong> to confirm:</p>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="border-red-200 focus:ring-red-300"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE"}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                Permanently Delete Account
              </Button>
              <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteConfirmText(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}