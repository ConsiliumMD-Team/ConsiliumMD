import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { ClinicalCase } from '../../types';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: ClinicalCase | null;
  onOverrideSuccess: (updatedCase: ClinicalCase) => void;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  onClose,
  caseData,
  onOverrideSuccess
}) => {
  const [reason, setReason] = useState<string>('');
  const [prescribed, setPrescribed] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !caseData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !prescribed.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await api.overrideDecision(caseData.id, reason.trim(), prescribed.trim());
      onOverrideSuccess(updated);
      onClose();
    } catch (e: any) {
      alert(e.message || 'Override failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="flex flex-col w-full max-w-xl rounded-2xl border border-rose-600/50 bg-slate-950 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-900/50 bg-rose-950/40 px-5 py-3.5">
          <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <span>Manual Clinician Decision Override</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-xs text-rose-200/90 leading-relaxed bg-rose-950/20 p-3 rounded-xl border border-rose-900/40">
            Overriding CARMA's evidence-grounded recommendation permanently logs an event in the immutable append-only audit trail and requires formal clinical rationale for compliance.
          </p>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Prescribed Alternative Intervention:</label>
            <input
              type="text"
              required
              value={prescribed}
              onChange={(e) => setPrescribed(e.target.value)}
              placeholder="e.g., 'Rosuvastatin 5mg every other day + Ezetimibe 10mg daily'"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Mandatory Clinical Rationale & Justification:</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., 'Patient has demonstrated severe statin-associated muscle symptoms (SAMS) with CK elevation on prior standard daily regimens...'"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim() || !prescribed.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Commit Decision Override</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
