import React from "react";

const statusConfig = {
  setup: { label: "Setup", color: "text-slate-600 bg-slate-100 border-slate-200" },
  active: { label: "Active", color: "text-blue-700 bg-blue-50 border-blue-200" },
  completed: { label: "Completed", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  abandoned: { label: "Abandoned", color: "text-red-600 bg-red-50 border-red-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.setup;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}