import React, { useState } from 'react';
import { Scale, Sparkles, Check, ArrowRight, ShieldCheck, Heart, Sliders } from 'lucide-react';

interface GenerativeElicitationScaleProps {
  initialValue?: number;
  dimensionLeft?: string;
  dimensionRight?: string;
  recLeft?: string;
  recRight?: string;
  onResolve: (preferenceWeight: number) => void;
  isLoading?: boolean;
}

export const GenerativeElicitationScale: React.FC<GenerativeElicitationScaleProps> = ({
  initialValue = 0.5,
  dimensionLeft = 'Longevity & Aggressive Risk Reduction',
  dimensionRight = 'Quality of Life & Minimizing Adverse Events',
  recLeft = 'Initiate High-Intensity Statin (Atorvastatin 40mg daily) + strict biomarker targets.',
  recRight = 'Prescribe Moderate Statin (Pravastatin 20mg) or lifestyle optimization prioritizing fall/myopathy avoidance.',
  onResolve,
  isLoading = false
}) => {
  const [value, setValue] = useState<number>(initialValue);

  // Tilt angle between -16 deg and +16 deg
  const tiltAngle = (value - 0.5) * 32;

  return (
    <div className="glass-panel-purple rounded-3xl p-6 border-2 border-purple-500/50 shadow-2xl relative overflow-hidden flex flex-col gap-5">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/30 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Scale className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Generative Elicitation Scale (Normative Value Alignment)
            </h3>
            <p className="text-xs text-purple-200/90 font-medium">
              RPD detected guideline weight divergence ($\Delta w \ge 0.35$). Adjust the balance scale to calibrate patient-specific utility priorities.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-purple-950 px-3.5 py-1 text-xs font-mono font-black text-purple-300 border border-purple-600 shadow-md">
          ELICIT STATE ACTIVE
        </span>
      </div>

      {/* Visual Balance Scale Graphic */}
      <div className="relative flex flex-col items-center justify-center py-5 select-none">
        
        {/* Scale Fulcrum & Beam */}
        <div className="relative w-80 sm:w-[420px] flex flex-col items-center">
          
          {/* Pivoting Beam */}
          <div
            className="w-full h-3 bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-400 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-transform duration-300 ease-out origin-center flex items-center justify-between px-3 border border-white/20"
            style={{ transform: `rotate(${tiltAngle}deg)` }}
          >
            {/* Left Pan (Longevity) */}
            <div className="h-10 w-10 -mt-8 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.5)]">
              <span className="text-xs font-black text-cyan-300 font-mono">{Math.round((1 - value) * 100)}%</span>
            </div>

            {/* Right Pan (QoL) */}
            <div className="h-10 w-10 -mt-8 rounded-full bg-amber-950 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <span className="text-xs font-black text-amber-300 font-mono">{Math.round(value * 100)}%</span>
            </div>
          </div>

          {/* Central Fulcrum Stand */}
          <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-b-[32px] border-b-purple-500/90 mt-[-5px] shadow-2xl" />
          <div className="w-20 h-2.5 bg-purple-900 rounded-full mt-[-2px] border border-purple-700" />
        </div>

        {/* Dynamic Continuous Slider */}
        <div className="w-full max-w-xl mt-7 flex flex-col gap-2.5">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            className="w-full h-3 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-400 border border-slate-700 shadow-inner"
          />
          <div className="flex justify-between text-xs font-black text-slate-200">
            <span className="text-cyan-300 flex items-center gap-1">◄ {dimensionLeft}</span>
            <span className="text-amber-300 flex items-center gap-1">{dimensionRight} ►</span>
          </div>
        </div>

      </div>

      {/* Dynamic Recommendation Text Preview */}
      <div className="rounded-2xl border-2 border-purple-500/40 bg-slate-950/80 p-5 shadow-xl transition-all duration-300">
        <div className="flex items-center gap-2 text-xs font-black text-purple-300 uppercase tracking-wider mb-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Real-Time Calibrated Clinical Recommendation:</span>
        </div>
        <p className="text-sm text-white leading-relaxed font-bold">
          {value < 0.42 ? (
            <span className="text-cyan-200">{recLeft}</span>
          ) : value > 0.58 ? (
            <span className="text-amber-200">{recRight}</span>
          ) : (
            <span className="text-purple-200">
              Balanced shared decision-making: Initiate Moderate-Intensity Statin (Atorvastatin 20mg) with baseline CKD & frailty monitoring.
            </span>
          )}
        </p>
      </div>

      {/* Submit Action */}
      <button
        onClick={() => onResolve(value)}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 py-3.5 text-xs font-extrabold text-white hover:opacity-90 transition-all shadow-[0_0_25px_rgba(168,85,247,0.5)] disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        <span>Confirm Elicited Values & Synthesize Final Protocol</span>
      </button>

    </div>
  );
};
