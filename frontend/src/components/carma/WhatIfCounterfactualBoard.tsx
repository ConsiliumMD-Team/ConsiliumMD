import React, { useState } from 'react';
import { Sliders, RefreshCw, Sparkles, TrendingUp, CheckCircle2, Zap, UserCheck, Flame } from 'lucide-react';
import { api } from '../../api/client';
import { Patient } from '../../types';

interface WhatIfCounterfactualBoardProps {
  patient: Patient;
  baseCaseId?: number;
  onSimulateUpdate: (simResult: any) => void;
}

export const WhatIfCounterfactualBoard: React.FC<WhatIfCounterfactualBoardProps> = ({
  patient,
  baseCaseId,
  onSimulateUpdate
}) => {
  const [age, setAge] = useState<number>(patient.age);
  const [egfr, setEgfr] = useState<number>(patient.lab_results?.egfr ?? 40);
  const [sbp, setSbp] = useState<number>(patient.vitals?.bp_systolic ?? 135);
  const [ldl, setLdl] = useState<number>(patient.lab_results?.ldl ?? 140);
  const [hba1c, setHba1c] = useState<number>(patient.lab_results?.hba1c ?? 7.5);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeArchetype, setActiveArchetype] = useState<string | null>(null);

  const handleSliderChange = async (newTweaks: Record<string, number>) => {
    setIsSimulating(true);
    try {
      const sim = await api.simulateWhatIf(
        patient.id,
        {
          age: newTweaks.age ?? age,
          egfr: newTweaks.egfr ?? egfr,
          bp_systolic: newTweaks.sbp ?? sbp,
          ldl: newTweaks.ldl ?? ldl,
          hba1c: newTweaks.hba1c ?? hba1c
        },
        baseCaseId
      );
      onSimulateUpdate(sim);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const applyArchetype = (name: string, values: { age: number; egfr: number; sbp: number; ldl: number; hba1c: number }) => {
    setActiveArchetype(name);
    setAge(values.age);
    setEgfr(values.egfr);
    setSbp(values.sbp);
    setLdl(values.ldl);
    setHba1c(values.hba1c);
    handleSliderChange(values);
  };

  const resetToBaseline = () => {
    setActiveArchetype(null);
    setAge(patient.age);
    setEgfr(patient.lab_results?.egfr ?? 40);
    setSbp(patient.vitals?.bp_systolic ?? 135);
    setLdl(patient.lab_results?.ldl ?? 140);
    setHba1c(patient.lab_results?.hba1c ?? 7.5);
    handleSliderChange({
      age: patient.age,
      egfr: patient.lab_results?.egfr ?? 40,
      sbp: patient.vitals?.bp_systolic ?? 135,
      ldl: patient.lab_results?.ldl ?? 140,
      hba1c: patient.lab_results?.hba1c ?? 7.5
    });
  };

  // Deltas against patient baseline
  const baselineEgfr = patient.lab_results?.egfr ?? 40;
  const baselineSbp = patient.vitals?.bp_systolic ?? 135;
  const baselineLdl = patient.lab_results?.ldl ?? 140;

  return (
    <div className="glass-panel-glow rounded-2xl p-6 flex flex-col gap-4 border border-teal-500/30">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3.5 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              'What-If' Counterfactual Simulation Board
            </h3>
            <p className="text-xs text-teal-300/80 font-mono">
              Live Parameter Perturbation & Real-Time CARMA Confidence Space Shift
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isSimulating && (
            <span className="flex items-center gap-1.5 text-xs text-teal-300 font-mono animate-pulse">
              <Zap className="h-3.5 w-3.5 text-teal-400" /> Computing Bounds...
            </span>
          )}
          <button
            onClick={resetToBaseline}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs text-cyan-300 hover:text-white font-mono hover:bg-slate-700 transition-all font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Quick Clinical Archetype Presets */}
      <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-slate-300 uppercase font-mono mr-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Quick Archetypes:
        </span>

        <button
          type="button"
          onClick={() => applyArchetype('Severe CKD', { age: 84, egfr: 22, sbp: 155, ldl: 165, hba1c: 8.8 })}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeArchetype === 'Severe CKD'
              ? 'bg-rose-500/30 text-rose-200 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              : 'bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-750'
          }`}
        >
          🚨 Advanced CKD (eGFR 22)
        </button>

        <button
          type="button"
          onClick={() => applyArchetype('Elderly Frail', { age: 88, egfr: 34, sbp: 120, ldl: 110, hba1c: 6.9 })}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeArchetype === 'Elderly Frail'
              ? 'bg-purple-500/30 text-purple-200 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-750'
          }`}
        >
          👵 Frail Octogenarian (Age 88)
        </button>

        <button
          type="button"
          onClick={() => applyArchetype('Severe HTN', { age: 62, egfr: 68, sbp: 182, ldl: 178, hba1c: 9.4 })}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeArchetype === 'Severe HTN'
              ? 'bg-amber-500/30 text-amber-200 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-750'
          }`}
        >
          ⚡ Uncontrolled SBP (182 mmHg)
        </button>

        <button
          type="button"
          onClick={() => applyArchetype('Optimal Control', { age: 55, egfr: 85, sbp: 118, ldl: 72, hba1c: 6.1 })}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeArchetype === 'Optimal Control'
              ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-750'
          }`}
        >
          ✨ Optimized Target Profile
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Age Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-slate-200">Patient Age</span>
            <span className="font-mono text-cyan-300 font-extrabold bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-700 text-xs">
              {age} yrs
            </span>
          </div>
          <input
            type="range"
            min="45"
            max="95"
            value={age}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setAge(val);
              handleSliderChange({ age: val });
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono mt-2 font-semibold">
            <span>45 yrs</span>
            <span>95 yrs</span>
          </div>
        </div>

        {/* eGFR Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-slate-200">eGFR Renal</span>
            <span className={`font-mono font-extrabold px-2.5 py-0.5 rounded border text-xs ${
              egfr < 30 ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-cyan-950 text-cyan-300 border-cyan-700'
            }`}>
              {egfr} mL/min
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="90"
            value={egfr}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setEgfr(val);
              handleSliderChange({ egfr: val });
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono mt-2 font-semibold">
            <span className="text-rose-400">15 (ESRD)</span>
            <span className="text-emerald-400">90+ (Norm)</span>
          </div>
        </div>

        {/* Systolic BP Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-slate-200">Systolic BP</span>
            <span className={`font-mono font-extrabold px-2.5 py-0.5 rounded border text-xs ${
              sbp > 160 ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-purple-950 text-purple-300 border-purple-700'
            }`}>
              {sbp} mmHg
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="190"
            value={sbp}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setSbp(val);
              handleSliderChange({ sbp: val });
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono mt-2 font-semibold">
            <span>100</span>
            <span className="text-rose-400">190 (Crisis)</span>
          </div>
        </div>

        {/* LDL Cholesterol Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-slate-200">LDL-C</span>
            <span className="font-mono text-amber-300 font-extrabold bg-amber-950 px-2.5 py-0.5 rounded border border-amber-700 text-xs">
              {ldl} mg/dL
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="220"
            value={ldl}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setLdl(val);
              handleSliderChange({ ldl: val });
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono mt-2 font-semibold">
            <span className="text-emerald-400">60 (Ideal)</span>
            <span className="text-rose-400">220 (High)</span>
          </div>
        </div>

        {/* HbA1c Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-slate-200">HbA1c</span>
            <span className="font-mono text-emerald-300 font-extrabold bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-700 text-xs">
              {hba1c.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="5.0"
            max="12.0"
            step="0.1"
            value={hba1c}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setHba1c(val);
              handleSliderChange({ hba1c: val });
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono mt-2 font-semibold">
            <span className="text-emerald-400">5.0%</span>
            <span className="text-rose-400">12.0%</span>
          </div>
        </div>

      </div>
    </div>
  );
};
