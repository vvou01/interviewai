import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import CVProfileForm from "@/components/cvprofiles/CVProfileForm";
import CVProfileCard from "@/components/cvprofiles/CVProfileCard";
import DeleteConfirmDialog from "@/components/cvprofiles/DeleteConfirmDialog";

const planLimits = { free: 1, pro: 3, pro_plus: Infinity };

const tooltipMsg = {
  free: "Upgrade to Pro for up to 3 profiles",
  pro: "Upgrade to Pro+ for unlimited profiles",
  pro_plus: null,
};

export default function CVProfiles({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // profile object
  const [deleteTarget, setDeleteTarget] = useState(null); // profile object
  const [showTooltip, setShowTooltip] = useState(false);
  const qc = useQueryClient();

  const plan = user?.plan || "free";
  const limit = planLimits[plan];

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["cvProfiles"],
    queryFn: () => base44.entities.CVProfiles.filter({ created_by: user?.email }, "-created_date"),
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ["activeSessions"],
    queryFn: () => base44.entities.InterviewSessions.filter({ status: "active" }),
  });

  const canCreate = limit === Infinity || profiles.length < limit;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cvProfiles"] });

  const saveMut = useMutation({
    mutationFn: async ({ id, data }) => {
      // If set as default, clear others first
      if (data.is_default) {
        for (const p of profiles) {
          if (p.is_default && p.id !== id) {
            await base44.entities.CVProfiles.update(p.id, { is_default: false });
          }
        }
      }
      if (id) {
        return base44.entities.CVProfiles.update(id, data);
      } else {
        return base44.entities.CVProfiles.create(data);
      }
    },
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: async (profile) => {
      await base44.entities.CVProfiles.delete(profile.id);
      // Auto-assign default if this was default and others exist
      if (profile.is_default) {
        const remaining = profiles.filter(p => p.id !== profile.id);
        if (remaining.length > 0) {
          // oldest = last in "-created_date" list, so last element
          const oldest = [...remaining].sort((a, b) => new Date(a.created_date) - new Date(b.created_date))[0];
          await base44.entities.CVProfiles.update(oldest.id, { is_default: true });
        }
      }
    },
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const handleAddClick = () => {
    if (!canCreate) { setShowTooltip(true); setTimeout(() => setShowTooltip(false), 2500); return; }
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (profile) => { setEditing(profile); setShowForm(true); };

  const handleDeleteRequest = (profile) => setDeleteTarget(profile);

  const getActiveSessionWarning = (profile) => {
    return activeSessions.some(s => s.cv_profile_id === profile.id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CV Profiles</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the CVs you use for interview sessions</p>
        </div>
        <div className="relative flex-shrink-0">
          <Button
            onClick={handleAddClick}
            className={`${canCreate ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"}`}
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Profile
          </Button>
          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-slate-800 text-white text-xs rounded-xl px-3 py-2 z-10 shadow-lg">
              {tooltipMsg[plan]}
              <div className="absolute right-4 -top-1 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Plan usage */}
      {limit !== Infinity && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${i < profiles.length ? "bg-violet-500" : "bg-slate-200"}`} />
            ))}
          </div>
          <span className="text-xs text-slate-400">{profiles.length} / {limit} profiles</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && profiles.length === 0 && !showForm && (
        <div className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No CV profiles yet</h3>
          <p className="text-sm text-slate-400 mb-6">Add your first CV to get personalized coaching during interviews.</p>
          <Button onClick={handleAddClick} className="bg-gradient-to-r from-violet-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" /> Add Your First CV
          </Button>
        </div>
      )}

      {/* Profile grid */}
      {profiles.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <CVProfileCard
              key={p.id}
              profile={p}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && <div className="text-center py-12 text-slate-400 text-sm">Loading profiles...</div>}

      {/* Form modal */}
      {showForm && (
        <CVProfileForm
          profile={editing}
          isSaving={saveMut.isPending}
          onSave={(data) => saveMut.mutate({ id: editing?.id, data })}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          profile={deleteTarget}
          hasActiveSession={getActiveSessionWarning(deleteTarget)}
          isDeleting={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}