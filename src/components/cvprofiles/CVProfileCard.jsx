import React from "react";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function CVProfileCard({ profile, onEdit, onDelete }) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3 group glass-card-hover">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base truncate">{profile.name}</h3>
        </div>
        {profile.is_default && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
            Default
          </span>
        )}
      </div>

      {/* CV preview */}
      <p
        className="text-sm text-slate-400 leading-relaxed flex-1"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {profile.cv_text}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">
          {profile.created_date ? format(new Date(profile.created_date), "MMM d, yyyy") : ""}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(profile)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(profile)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}