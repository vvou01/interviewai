import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Key, User, AlertTriangle, RefreshCw } from "lucide-react";
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

export default function Settings({ user }) {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(user?.api_token || "");

  useEffect(() => {
    if (user?.api_token) setToken(user.api_token);
  }, [user]);

  const generateToken = async () => {
    const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await base44.auth.updateMe({ api_token: newToken });
    setToken(newToken);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-lg">Account</h2>
        </div>
        <div>
          <Label className="text-slate-400 text-sm">Full Name</Label>
          <Input
            value={user?.full_name || ""}
            disabled
            className="mt-1.5 bg-white/[0.02] border-white/[0.06] text-slate-400"
          />
        </div>
        <div>
          <Label className="text-slate-400 text-sm">Email</Label>
          <Input
            value={user?.email || ""}
            disabled
            className="mt-1.5 bg-white/[0.02] border-white/[0.06] text-slate-400"
          />
        </div>
      </div>

      {/* API Token */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-lg">API Token</h2>
        </div>
        <p className="text-sm text-slate-500">
          Use this token to connect the Chrome extension to your account.
        </p>
        {token ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-indigo-300 font-mono truncate">
              {token}
            </code>
            <Button variant="ghost" size="icon" onClick={copyToken} className="flex-shrink-0 text-slate-400">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No API token generated yet.</p>
        )}
        <Button
          onClick={generateToken}
          variant="outline"
          className="bg-white/[0.04] border-white/[0.08] text-slate-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {token ? "Regenerate Token" : "Generate Token"}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="font-semibold text-lg text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Permanently delete your account and all associated data.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#1a2035] border-white/[0.1]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will permanently delete your account, all CV profiles, sessions, and reports. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-300">Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete Account</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}