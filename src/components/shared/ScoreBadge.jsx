import React from "react";

export default function ScoreBadge({ score, size = "md" }) {
  const color =
    score >= 8 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    score >= 5 ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-red-600 bg-red-50 border-red-200";

  const sizeClasses = size === "lg" ? "text-2xl w-14 h-14" : size === "sm" ? "text-xs w-7 h-7" : "text-sm w-9 h-9";

  return (
    <div className={`${color} ${sizeClasses} rounded-xl border font-bold flex items-center justify-center`}>
      {score}
    </div>
  );
}