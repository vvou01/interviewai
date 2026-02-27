import React, { useState } from "react";
import { Copy, Check, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FollowUpEmail({ draft }) {
  const [text, setText] = useState(draft);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => setEditing(false);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-lg text-slate-800">Follow-Up Email Draft</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-slate-500 gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Email"}
          </Button>
          {editing ? (
            <Button size="sm" onClick={handleSave} className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 text-slate-600">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-3">Personalise before sending</p>

      {editing ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full min-h-[200px] p-4 text-sm text-slate-700 bg-slate-50 border border-violet-300 rounded-xl font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
          {text}
        </div>
      )}
    </div>
  );
}