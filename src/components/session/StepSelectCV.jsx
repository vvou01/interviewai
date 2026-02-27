import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { FileText, Check, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StepSelectCV({ selectedId, onSelect }) {
  const { user } = useAuth();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["cvProfiles", user?.id],
    queryFn: () => base44.entities.CVProfiles.filter({ user_id: user?.id }, "-created_date"),
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="text-slate-400 py-8 text-center">Loading CV profiles...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Select CV Profile</h2>
        <p className="text-sm text-slate-500 mt-1">Choose which CV to use for coaching context</p>
      </div>
      {profiles.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-3">No CV profiles yet</p>
          <Link to={createPageUrl("CVProfiles")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-100 text-violet-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Create CV Profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`bg-white border rounded-2xl p-5 text-left flex items-start gap-4 transition-all ${
                selectedId === p.id ? "border-violet-400 bg-violet-50 shadow-sm" : "border-slate-200 hover:border-violet-200 hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedId === p.id ? "bg-violet-100" : "bg-slate-100"}`}>
                {selectedId === p.id ? <Check className="w-5 h-5 text-violet-600" /> : <FileText className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-800">{p.name}</h3>
                  {p.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">Default</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.cv_text}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
