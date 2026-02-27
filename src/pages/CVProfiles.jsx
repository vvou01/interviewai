import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Star, Trash2, Pencil, X, Check } from "lucide-react";
import UpgradeBanner from "@/components/shared/UpgradeBanner";

const planLimits = { free: 1, pro: 3, pro_plus: Infinity };

export default function CVProfiles({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", cv_text: "", is_default: false });
  const qc = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["cvProfiles"],
    queryFn: () => base44.entities.CVProfiles.list("-created_date"),
  });

  const plan = user?.plan || "free";
  const limit = planLimits[plan];
  const canCreate = profiles.length < limit;

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.CVProfiles.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cvProfiles"] }); resetForm(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CVProfiles.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cvProfiles"] }); resetForm(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.CVProfiles.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cvProfiles"] }),
  });
  const setDefaultMut = useMutation({
    mutationFn: async (id) => {
      for (const p of profiles) {
        if (p.is_default) await base44.entities.CVProfiles.update(p.id, { is_default: false });
      }
      await base44.entities.CVProfiles.update(id, { is_default: true });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cvProfiles"] }),
  });

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ name: "", cv_text: "", is_default: false }); };
  const handleEdit = (profile) => { setEditing(profile.id); setForm({ name: profile.name, cv_text: profile.cv_text, is_default: profile.is_default }); setShowForm(true); };
  const handleSubmit = () => { editing ? updateMut.mutate({ id: editing, data: form }) : createMut.mutate(form); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CV Profiles</h1>
          <p className="text-sm text-slate-500 mt-1">{profiles.length}{limit !== Infinity ? ` / ${limit}` : ""} profiles</p>
        </div>
        {canCreate && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Profile
          </Button>
        )}
      </div>

      {!canCreate && !showForm && (
        <UpgradeBanner message={`You've reached the ${limit} CV profile limit. Upgrade to add more.`} />
      )}

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{editing ? "Edit" : "New"} CV Profile</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <Label className="text-slate-600 text-sm">Profile Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Software Engineer CV" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-slate-600 text-sm">CV Text</Label>
            <Textarea value={form.cv_text} onChange={(e) => setForm({ ...form, cv_text: e.target.value })} placeholder="Paste your full CV text here..." className="mt-1.5 min-h-[200px]" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded" />
            <label className="text-sm text-slate-600">Set as default profile</label>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={!form.name || !form.cv_text} className="bg-gradient-to-r from-violet-600 to-purple-600">
              <Check className="w-4 h-4 mr-2" /> {editing ? "Save Changes" : "Create Profile"}
            </Button>
            <Button variant="ghost" onClick={resetForm} className="text-slate-500">Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : profiles.length === 0 && !showForm ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No CV profiles yet</p>
          <p className="text-sm text-slate-400">Create your first profile to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="glass-card p-5 flex items-start gap-4 glass-card-hover group">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-800">{p.name}</h3>
                  {p.is_default && (
                    <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-xs font-medium border border-violet-200">Default</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{p.cv_text}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!p.is_default && (
                  <button onClick={() => setDefaultMut.mutate(p.id)} className="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500" title="Set as default">
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMut.mutate(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}