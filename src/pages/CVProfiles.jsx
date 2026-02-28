import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
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
  const [actionError, setActionError] = useState("");
  const qc = useQueryClient();

  const plan = user?.plan || "free";
  const limit = planLimits[plan];
  const ownerId = user?.id;

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["cvProfiles", ownerId],
    queryFn: async () => {
      // DEBUG: log user object to check what fields Base44 auth.me() returns
      console.log("[CV DEBUG] user object from auth.me():", user);
      console.log("[CV DEBUG] ownerId (user?.id):", ownerId);
      console.log("[CV DEBUG] user?.email:", user?.email);

      // Fetch all profiles (no created_by filter) so we can inspect the raw shape
      const all = await base44.entities.CVProfiles.filter({}, "-created_date");
      console.log("[CV DEBUG] Raw profiles from filter({}):", all);
      if (all.length > 0) {
        console.log(
          "[CV DEBUG] Sample created_by value:",
          all[0]?.created_by,
          "| type:",
          typeof all[0]?.created_by,
        );
        console.log(
          "[CV DEBUG] Does created_by === user?.id?",
          all[0]?.created_by === ownerId,
          "| Does created_by === user?.email?",
          all[0]?.created_by === user?.email,
        );
      }

      // Client-side guard: return only this user's profiles while we
      // determine the exact field format Base44 stores in created_by.
      // Once confirmed, replace with server-side filter.
      return all.filter(
        (p) =>
          p.created_by === ownerId ||
          p.created_by === user?.email ||
          p.created_by?.id === ownerId ||
          p.created_by?.email === user?.email,
      );
    },
    // Use !!user (not !!ownerId) so the query runs even if user?.id is undefined
    enabled: !!user,
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ["activeSessions", ownerId],
    queryFn: () => base44.entities.InterviewSessions.filter({ status: "active", created_by: ownerId }),
    enabled: !!ownerId,
  });

  const canCreate = limit === Infinity || profiles.length < limit;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cvProfiles"] });

  const saveMut = useMutation({
    mutationFn: async (formData) => {
      console.log("[CV DEBUG] mutationFn entered", formData)
      if (!user) throw new Error("Not logged in");

      if (formData.id) {
        await base44.entities.CVProfiles.update(formData.id, {
          name: formData.name,
          cv_text: formData.cv_text,
          is_default: formData.is_default ?? false,
        });
      } else {
        console.log("[CV DEBUG] about to call CVProfiles.create")
        await base44.entities.CVProfiles.create({
          name: formData.name,
          cv_text: formData.cv_text,
          is_default: formData.is_default ?? false,
        });
        console.log("[CV DEBUG] create returned")
      }
    },
    onSuccess: () => {
      console.log("[CV DEBUG] onSuccess fired")
      setActionError("");
      qc.invalidateQueries({ queryKey: ["cvProfiles"] });
      setShowForm(false);
      setEditing(null);
    },
    onError: (err) => {
      console.error("[CV DEBUG] onError fired:", err)
      console.error("[CV DEBUG] err stringify:", JSON.stringify(err))
      console.error("[CV] Save FAILED:", err);
      console.error("[CV] Error details:", JSON.stringify(err));
      setActionError(err?.message || "Failed to save. Please try again.");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (profile) => {
      if (!user) throw new Error("Unable to verify profile owner");
      const ownedProfile = await base44.entities.CVProfiles.filter({ id: profile.id });
      if (!ownedProfile?.length) {
        throw new Error("You can only delete your own CV profiles.");
      }

      await base44.entities.CVProfiles.delete(profile.id);
      // Auto-assign default if this was default and others exist.
      // Fetch fresh profiles after deletion rather than using the stale closure.
      if (profile.is_default) {
        const remaining = await base44.entities.CVProfiles.filter({ created_by: user?.id }, "-created_date");
        if (remaining.length > 0) {
          const oldest = [...remaining].sort((a, b) => new Date(a.created_date) - new Date(b.created_date))[0];
          await base44.entities.CVProfiles.update(oldest.id, { is_default: true });
        }
      }
    },
    onSuccess: () => { setActionError(""); invalidate(); setDeleteTarget(null); },
    onError: (err) => { console.error("[CVProfiles] Delete error:", err); setActionError(err?.message || "Unable to delete CV profile."); },
  });

  const handleAddClick = () => {
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
            disabled={!canCreate}
            onMouseEnter={() => !canCreate && setShowTooltip(true)}
            onMouseLeave={() => !canCreate && setShowTooltip(false)}
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
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{actionError}</div>
      )}

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
          onSave={(data) => saveMut.mutate({ ...data, id: editing?.id })}
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
