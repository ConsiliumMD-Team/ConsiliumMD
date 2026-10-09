import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle2, UserCheck, Scale, RefreshCw, 
  AlertCircle, ChevronRight, FileText, Lock
} from 'lucide-react';
import { api } from '../../api/client';
import { ClinicalCase } from '../../types';

interface ReviewerDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({ currentTab = 'dashboard' }) => {
  const [escalations, setEscalations] = useState<ClinicalCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);
  const [resolutionText, setResolutionText] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchEscalations = async () => {
    setIsLoading(true);
    try {
      const data = await api.listEscalations();
      setEscalations(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleResolveEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !resolutionText.trim() || !overrideReason.trim()) return;
    setIsSubmitting(true);
    try {
      await api.resolveEscalate(selectedCase.id, resolutionText.trim(), overrideReason.trim());
      await fetchEscalations();
      setSelectedCase(null);
      setResolutionText('');
      setOverrideReason('');
      alert('Senior clinical resolution committed and signed to audit trail.');
    } catch (e: any) {
      alert(e.message || 'Resolution submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="card-surface p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Senior Clinician Escalation & Adjudication Board</h1>
            <p className="text-xs text-slate-400">
              Human backstop workspace for ECL graph collapse, non-identifiable mathematical bounds, and CPIC pharmacogenomic contraindications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge-warning font-mono">
            {escalations.length} Pending Adjudications
          </span>
          <button
            onClick={fetchEscalations}
            className="btn-secondary text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Escalation Queue (Left) & Adjudication Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Escalation Queue (4 cols) */}
        <div className="lg:col-span-4 card-surface p-4 flex flex-col gap-3 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Disputed Cases Queue ({escalations.length})
            </span>
            <span className="badge-danger font-mono text-[9px]">
              CRITICAL
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-xs text-slate-400 font-mono">Loading cases...</div>
          ) : escalations.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-mono flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <span>All escalated clinical cases resolved.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[600px]">
              {escalations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`cursor-pointer rounded-xl p-3.5 transition-all text-left border ${
                    selectedCase?.id === c.id
                      ? 'bg-purple-600/15 border-purple-500 shadow-md'
                      : 'card-subtle hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">{c.title}</span>
                    <span className="badge-danger font-mono text-[9px]">ESCALATED</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{c.query_text}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>RPD: {c.rpd_score.toFixed(2)}</span>
                    <span>Reversal: {c.reversal_hazard.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adjudication Workspace (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {selectedCase ? (
            <div className="card-surface p-6 border border-slate-800 flex flex-col gap-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white">{selectedCase.title}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Case #{selectedCase.id} • Patient MRN #{selectedCase.patient_id}</p>
                </div>
                <span className="badge-danger font-mono text-xs">
                  ECL Graph Collapsed
                </span>
              </div>

              {/* Clinical Query Context */}
              <div className="card-subtle p-4">
                <div className="text-[10px] font-bold uppercase text-sky-400 font-mono mb-1">Primary Clinical Query:</div>
                <p className="text-xs text-white leading-relaxed">{selectedCase.query_text}</p>
              </div>

              {/* Critical Safety / PGx Alerts */}
              {selectedCase.carma_payload?.critical_alerts && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Safety Bounds Breach Summary:</span>
                  </div>
                  {selectedCase.carma_payload.critical_alerts.map((a: any, i: number) => (
                    <div key={i} className="text-xs text-rose-200 leading-relaxed">
                      • <strong>{a.type}:</strong> {a.description}
                    </div>
                  ))}
                </div>
              )}

              {/* Senior Resolution Form */}
              <form onSubmit={handleResolveEscalation} className="flex flex-col gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Senior Reviewer Adjudicated Action Plan:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="e.g., 'Due to CYP2C19 *2/*2 poor metabolizer status, Clopidogrel is ineffective. Adjudicated resolution: Prescribe Ticagrelor 90mg BID for 12 months with PPI gastroprotection.'"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Formal Guideline Adjudication Rationale:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., 'CPIC Level A pharmacogenomic override accepted under Senior Clinical Review authority.'"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !resolutionText.trim() || !overrideReason.trim()}
                  className="btn-primary w-full py-3 bg-purple-600 hover:bg-purple-700 border-purple-500 justify-center text-xs"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>Sign & Commit Senior Clinical Resolution</span>
                </button>
              </form>

            </div>
          ) : (
            <div className="card-surface p-12 text-center text-slate-400 text-xs font-mono border border-slate-800">
              Select an escalated case from the left queue to review and adjudicate.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
