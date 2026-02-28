import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StepSelectCV({ selectedId, onSelect, user }) {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["cvProfiles", user?.id],
    queryFn: async () => {
      const all = await base44.entities.CVProfiles.filter({}, "-created_date");
      return all.filter(
        (p) =>
          p.created_by === user?.id ||
          p.created_by === user?.email ||
          p.created_by?.id === user?.id ||
          p.created_by?.email === user?.email,
      );
    },
    // Mirror CVProfiles.jsx: enable on !!user so query fires even if user?.id is undefined
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">Loading your CV profiles...</div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Which CV are you interviewing with?</h2>
      <p className="text-sm text-slate-500 mb-6">Select the CV profile you want coaching to be based on.</p>

      {profiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">You need a CV profile first</h3>
          <p className="text-sm text-slate-400 mb-6">Create a CV profile to get personalized coaching during your interviews.</p>
          <Link to={createPageUrl("CVProfiles")}>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" /> Create a CV Profile
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            {profiles.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id, p)}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all group ${
                    isSelected
                      ? "border-violet-500 bg-violet-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-violet-200 hover:shadow-sm"
                  }`}
                >
                  {/* Checkmark overlay */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2 pr-8">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-violet-200" : "bg-slate-100"}`}>
                      <FileText className={`w-4 h-4 ${isSelected ? "text-violet-700" : "text-slate-400"}`} />
                    </div>
                    <span className={`font-semibold text-sm truncate ${isSelected ? "text-violet-900" : "text-slate-800"}`}>
                      {p.name}
                    </span>
                  </div>

                  {p.is_default && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200 mb-1.5">
                      Default
                    </span>
                  )}

                  <p
                    className="text-xs text-slate-400 leading-relaxed"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.cv_text}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 text-center">
            <Link
              to={createPageUrl("CVProfiles")}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create a new profile
            </Link>
          </div>
        </>
      )}
    </div>
  );
}