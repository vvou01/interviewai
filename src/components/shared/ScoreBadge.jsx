import React from "react";

export default function ScoreBadge({ score, size = "md" }) {
  const color =
    score >= 8 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    score >= 5 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    "text-red-400 bg-red-500/10 border-red-500/20";

  const sizeClasses = size === "lg"
    ? "text-2xl w-14 h-14"
    : size === "sm"
    ? "text-xs w-7 h-7"
    : "text-sm w-9 h-9";

  return (
    <div className={`${color} ${sizeClasses} rounded-xl border font-bold flex items-center justify-center`}>
      {score}
    </div>
  );
}