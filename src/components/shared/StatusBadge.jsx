import React from "react";

const statusConfig = {
  setup: { label: "Setup", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  active: { label: "Active", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  completed: { label: "Completed", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  abandoned: { label: "Abandoned", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.setup;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}