import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Save, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-violet-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function Admin({ user }) {
  const { toast } = useToast();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [freePlanSessionLimit, setFreePlanSessionLimit] = useState(2);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["appSettings"],
    queryFn: () => base44.functions.invoke("getAppSettings"),
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (settings) {
      setMaintenanceMode(settings.maintenance_mode ?? false);
      setSignupsEnabled(settings.signups_enabled ?? true);
      setFreePlanSessionLimit(settings.free_plan_session_limit ?? 2);
    }
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: () =>
      base44.functions.invoke("saveAppSettings", {
        maintenance_mode: maintenanceMode,
        signups_enabled: signupsEnabled,
        free_plan_session_limit: Number(freePlanSessionLimit) || 2,
      }),
    onSuccess: () => {
      toast({ title: "Settings saved", description: "App settings have been updated." });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      toast({ title: "Save failed", description: err?.message || "Could not save settings.", variant: "destructive" });
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <div className="glass-card p-10">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
      </div>

      <div className="glass-card p-6 space-y-6">
        <h2 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-3">Feature Flags</h2>

        {isLoading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading settings...</div>
        ) : (
          <div className="space-y-5">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Maintenance Mode</p>
                <p className="text-sm text-slate-400 mt-0.5">Show a maintenance message to all users</p>
              </div>
              <Toggle value={maintenanceMode} onChange={setMaintenanceMode} />
            </div>

            {/* Signups Enabled */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Signups Enabled</p>
                <p className="text-sm text-slate-400 mt-0.5">Allow new users to register</p>
              </div>
              <Toggle value={signupsEnabled} onChange={setSignupsEnabled} />
            </div>

            {/* Free Plan Session Limit */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="font-medium text-slate-700">Free Plan Session Limit</Label>
                <p className="text-sm text-slate-400 mt-0.5">Max interviews per month for free users</p>
              </div>
              <Input
                type="number"
                min="0"
                value={freePlanSessionLimit}
                onChange={(e) => setFreePlanSessionLimit(e.target.value)}
                className="w-24 text-center"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending || isLoading}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saveMut.isPending ? "Saving…" : saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
