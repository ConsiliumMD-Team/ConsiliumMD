import React, { useState } from 'react';
import { Settings, Shield, Cpu, Sliders, CheckCircle2, Save } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [rpdThreshold, setRpdThreshold] = useState('0.40');
  const [hazardThreshold, setHazardThreshold] = useState('0.45');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="card-surface p-5 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-sky-400" />
            <span>Clinical Practice Settings & CARMA Mathematical Bounds</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tune algorithmic sensitivity thresholds for normative RPD decomposition and longitudinal deep survival hazard models.
          </p>
        </div>

        {saved && (
          <span className="badge-success flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Settings Saved</span>
          </span>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="card-surface p-6 border border-slate-800 flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="card-subtle p-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-white block">
              RPD Divergence Threshold (Δw):
            </label>
            <p className="text-[11px] text-slate-400">
              Triggers the <strong className="text-purple-400 font-mono">ELICIT</strong> state when guideline utility weight divergence breaches this value.
            </p>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="0.9"
              value={rpdThreshold}
              onChange={(e) => setRpdThreshold(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="card-subtle p-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-white block">
              Reversal Hazard Threshold:
            </label>
            <p className="text-[11px] text-slate-400">
              Triggers the <strong className="text-rose-400 font-mono">WARN</strong> state when Deep Survival analysis flags evidence fragility exceeding this hazard rate.
            </p>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="0.9"
              value={hazardThreshold}
              onChange={(e) => setHazardThreshold(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            />
          </div>

        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button type="submit" className="btn-primary">
            <Save className="h-3.5 w-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

    </div>
  );
};
