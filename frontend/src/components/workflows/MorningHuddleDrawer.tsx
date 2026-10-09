import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../../api/client';
import { usePatient } from '../../context/PatientContext';

interface MorningHuddleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MorningHuddleDrawer: React.FC<MorningHuddleDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const { selectPatientById } = usePatient();
  const [huddleData, setHuddleData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getMorningHuddle()
        .then(res => setHuddleData(res))
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="h-full w-full max-w-md bg-slate-950 border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  07:00 AM Morning Huddle
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">Pre-Rounding Guideline Fragility Census</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Risk Distribution Summary */}
          {huddleData && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 mb-4 flex flex-col gap-2">
              <div className="text-xs font-bold text-white flex justify-between">
                <span>Total Ward Census: {huddleData.total_census} Patients</span>
                <span className="text-amber-400 font-mono">{huddleData.flagged_count} Flagged</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono mt-1">
                <div className="rounded-lg bg-rose-950/50 p-2 border border-rose-800/40 text-rose-300">
                  <div className="font-bold text-sm text-rose-400">{huddleData.census_risk_distribution.high_fragility}</div>
                  <div>Critical Fragility</div>
                </div>
                <div className="rounded-lg bg-amber-950/50 p-2 border border-amber-800/40 text-amber-300">
                  <div className="font-bold text-sm text-amber-400">{huddleData.census_risk_distribution.moderate_fragility}</div>
                  <div>Mod Fragility</div>
                </div>
                <div className="rounded-lg bg-emerald-950/50 p-2 border border-emerald-800/40 text-emerald-300">
                  <div className="font-bold text-sm text-emerald-400">{huddleData.census_risk_distribution.safe_concordance}</div>
                  <div>Concordant</div>
                </div>
              </div>
            </div>
          )}

          {/* Flagged Patients List */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Patients Requiring Protocol Review:
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-xs text-slate-400 font-mono">
                Scanning patient census...
              </div>
            ) : huddleData?.flagged_patients?.map((pat: any) => (
              <div
                key={pat.patient_id}
                onClick={() => {
                  selectPatientById(pat.patient_id);
                  onClose();
                }}
                className="cursor-pointer rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex flex-col gap-2 hover:border-amber-400 hover:bg-amber-950/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {pat.full_name} ({pat.mrn})
                  </span>
                  <span className="rounded bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono text-amber-200 border border-amber-700">
                    {pat.room_number}
                  </span>
                </div>

                <div className="text-[11px] text-amber-200/90 leading-tight">
                  {pat.reasons.map((r: string, idx: number) => (
                    <div key={idx}>⚠️ {r}</div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-amber-500/20 font-mono">
                  <span>Hazard: {pat.hazard_level.toFixed(2)}</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    Open Chart <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close Morning Huddle
          </button>
        </div>

      </div>
    </div>
  );
};
