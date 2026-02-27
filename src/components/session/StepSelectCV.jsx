import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Check, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StepSelectCV({ selectedId, onSelect }) {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["cvProfiles"],
    queryFn: () => base44.entities.CVProfiles.list("-created_date"),
  });

  if (isLoading) return <div className="text-slate-500 py-8 text-center">Loading CV profiles...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Select CV Profile</h2>
        <p className="text-sm text-slate-500 mt-1">Choose which CV to use for coaching context</p>
      </div>

      {profiles.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-3">No CV profiles yet</p>
          <Link
            to={createPageUrl("CVProfiles")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Create CV Profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`glass-card p-5 text-left flex items-start gap-4 transition-all ${
                selectedId === p.id
                  ? "border-indigo-500/40 bg-indigo-500/[0.06]"
                  : "glass-card-hover"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedId === p.id ? "bg-indigo-500/20" : "bg-white/[0.06]"
              }`}>
                {selectedId === p.id ? (
                  <Check className="w-5 h-5 text-indigo-400" />
                ) : (
                  <FileText className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{p.name}</h3>
                  {p.is_default && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Default
                    </span>
                  )}
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