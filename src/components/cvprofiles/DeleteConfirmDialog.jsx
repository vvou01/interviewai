import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

export default function DeleteConfirmDialog({ profile, hasActiveSession, isDeleting, onConfirm, onClose }) {
  const [confirmedActiveSession, setConfirmedActiveSession] = useState(false);

  const needsExtraConfirm = hasActiveSession && !confirmedActiveSession;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hasActiveSession ? "bg-amber-100" : "bg-red-100"}`}>
            <AlertTriangle className={`w-5 h-5 ${hasActiveSession ? "text-amber-600" : "text-red-500"}`} />
          </div>
          <div>
            {needsExtraConfirm ? (
              <>
                <h3 className="font-semibold text-slate-900">Profile In Use</h3>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>"{profile.name}"</strong> is used by an active interview session. Deleting it may disrupt the session.
                </p>
                <p className="text-sm font-medium text-amber-700 mt-2">Delete anyway?</p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-slate-900">Delete "{profile.name}"?</h3>
                <p className="text-sm text-slate-500 mt-1">This cannot be undone.</p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="text-slate-600">
            Cancel
          </Button>
          {needsExtraConfirm ? (
            <Button
              onClick={() => setConfirmedActiveSession(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Anyway
            </Button>
          ) : (
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}