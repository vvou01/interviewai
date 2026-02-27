import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Check, Loader2 } from "lucide-react";

export default function CVProfileForm({ profile, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({ name: "", cv_text: "", is_default: false });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || "", cv_text: profile.cv_text || "", is_default: profile.is_default || false });
    }
  }, [profile]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Profile name is required";
    else if (form.name.length > 50) errs.name = "Max 50 characters";
    if (!form.cv_text.trim()) errs.cv_text = "CV text is required";
    else if (form.cv_text.trim().length < 200) errs.cv_text = `At least 200 characters required (${form.cv_text.trim().length}/200)`;
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {profile ? "Edit CV Profile" : "Add New CV Profile"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <Label className="text-sm text-slate-700 font-medium">
              Profile Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g., Software Engineer CV"
              maxLength={55}
              className={`mt-1.5 ${errors.name ? "border-red-400 focus-visible:ring-red-300" : ""}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            <p className="text-xs text-slate-400 mt-1 text-right">{form.name.length}/50</p>
          </div>

          {/* CV Text */}
          <div>
            <Label className="text-sm text-slate-700 font-medium">
              CV / Resume Text <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.cv_text}
              onChange={e => set("cv_text", e.target.value)}
              placeholder="Paste your full CV/resume here..."
              rows={12}
              className={`mt-1.5 resize-none font-mono text-sm leading-relaxed ${errors.cv_text ? "border-red-400 focus-visible:ring-red-300" : ""}`}
            />
            {errors.cv_text && <p className="text-xs text-red-500 mt-1">{errors.cv_text}</p>}
            <p className={`text-xs mt-1 text-right ${form.cv_text.trim().length < 200 ? "text-amber-500" : "text-slate-400"}`}>
              {form.cv_text.trim().length} / 200 min
            </p>
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={e => set("is_default", e.target.checked)}
              className="w-4 h-4 rounded accent-violet-600"
            />
            <span className="text-sm text-slate-700">Set as default profile</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100">
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            {profile ? "Save Changes" : "Create Profile"}
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-slate-500">Cancel</Button>
        </div>
      </div>
    </div>
  );
}