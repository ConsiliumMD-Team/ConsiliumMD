import React, { useState } from 'react';
import { Crosshair, ShieldCheck, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import { ConfidencePoint } from '../../types';

interface ConfidenceSpaceScatterplotProps {
  currentHazard: number;
  currentRpd: number;
  currentState: string;
  historicalPoints?: ConfidencePoint[];
}

export const ConfidenceSpaceScatterplot: React.FC<ConfidenceSpaceScatterplotProps> = ({
  currentHazard,
  currentRpd,
  currentState,
  historicalPoints
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ConfidencePoint | null>(null);

  const points: ConfidencePoint[] = historicalPoints || [
    { label: 'Aspirin 1° Prev 2018', x_hazard: 0.72, y_rpd: 0.25, cohort: 'Historical Reversals', category: 'Reversed' },
    { label: 'ACCORD Glycemic 2008', x_hazard: 0.65, y_rpd: 0.70, cohort: 'Historical Reversals', category: 'Reversed' },
    { label: 'SGLT2i in HFrEF 2021', x_hazard: 0.12, y_rpd: 0.15, cohort: 'Robust Consensus', category: 'Stable' },
    { label: 'Statin in ASCVD <75', x_hazard: 0.18, y_rpd: 0.10, cohort: 'Robust Consensus', category: 'Stable' },
    { label: 'DAPT > 12m Post-DES', x_hazard: 0.58, y_rpd: 0.62, cohort: 'Normative Controversy', category: 'Fragile' },
    { label: 'Current Patient Case', x_hazard: currentHazard, y_rpd: currentRpd, cohort: 'Active Query', category: currentState, is_current: true }
  ];

  return (
    <div className="card-surface p-5 sm:p-6 flex flex-col gap-4 shadow-xl border border-slate-800">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Crosshair className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2D Confidence Space (RPD vs. Reversal Risk)
            </h3>
            <p className="text-xs text-slate-400 font-mono">Mathematical Assurance Coordinate Plot</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="rounded-xl bg-slate-900 px-3 py-1 border border-slate-700 text-slate-200">
            Hazard: <strong className="text-amber-400 text-sm">{currentHazard.toFixed(2)}</strong>
          </span>
          <span className="rounded-xl bg-slate-900 px-3 py-1 border border-slate-700 text-slate-200">
            RPD: <strong className="text-purple-400 text-sm">{currentRpd.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      {/* 2D Plot Canvas */}
      <div className="relative h-80 w-full bg-[#05070E] rounded-2xl border-2 border-slate-700 overflow-hidden p-4 select-none shadow-inner">
        
        {/* Quadrant Background Zones */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-40 pointer-events-none">
          {/* Top Left: Normative Dilemma */}
          <div className="border-r-2 border-b-2 border-slate-700 bg-purple-950/40 flex items-start p-3.5">
            <span className="text-xs font-extrabold text-purple-300 uppercase font-mono">
              ● Normative Dilemma (High RPD)
            </span>
          </div>
          {/* Top Right: Critical ECL Conflict */}
          <div className="border-b-2 border-slate-700 bg-rose-950/40 flex items-start justify-end p-3.5">
            <span className="text-xs font-extrabold text-rose-300 uppercase font-mono">
              ● Critical ECL Conflict
            </span>
          </div>
          {/* Bottom Left: Safe Consensus Zone */}
          <div className="border-r-2 border-slate-700 bg-emerald-950/40 flex items-end p-3.5">
            <span className="text-xs font-extrabold text-emerald-300 uppercase font-mono">
              ● Safe Consensus Zone
            </span>
          </div>
          {/* Bottom Right: Fragile Guideline Zone */}
          <div className="bg-amber-950/40 flex items-end justify-end p-3.5">
            <span className="text-xs font-extrabold text-amber-300 uppercase font-mono">
              ● Fragile Guideline Zone
            </span>
          </div>
        </div>

        {/* Center Threshold Dividers (X=0.45, Y=0.35) */}
        <div className="absolute top-0 bottom-0 left-[45%] w-[2px] bg-sky-400/50 border-r border-dashed border-sky-400" />
        <div className="absolute left-0 right-0 bottom-[35%] h-[2px] bg-purple-400/50 border-b border-dashed border-purple-400" />

        {/* Render Points */}
        {points.map((pt, idx) => {
          const leftPercent = pt.x_hazard * 86 + 7;
          const bottomPercent = pt.y_rpd * 76 + 12;

          if (pt.is_current) {
            return (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
                style={{ left: `${leftPercent}%`, bottom: `${bottomPercent}%` }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-9 w-9 rounded-full bg-sky-400/25 border border-sky-400/40 animate-pulse absolute" />
                  <div className="h-8 w-8 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_20px_#0EA5E9] flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-black" />
                  </div>
                </div>
                <span className="mt-2 text-xs font-black text-sky-300 font-mono bg-black px-2.5 py-1 rounded-lg border border-sky-400 shadow-xl whitespace-nowrap">
                  ACTIVE CASE ({pt.category})
                </span>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center cursor-pointer group"
              style={{ left: `${leftPercent}%`, bottom: `${bottomPercent}%` }}
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <div className={`h-5 w-5 rounded-full border-2 transition-transform duration-200 group-hover:scale-150 ${
                pt.category === 'Stable' ? 'bg-emerald-400 border-emerald-100 shadow-[0_0_10px_#10B981]' :
                pt.category === 'Fragile' ? 'bg-amber-400 border-amber-100 shadow-[0_0_10px_#F59E0B]' :
                'bg-rose-500 border-rose-100 shadow-[0_0_10px_#F43F5E]'
              }`} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 text-xs font-mono font-bold text-white bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-600 whitespace-nowrap pointer-events-none shadow-2xl z-30">
                {pt.label} (H:{pt.x_hazard.toFixed(2)}, RPD:{pt.y_rpd.toFixed(2)})
              </span>
            </div>
          );
        })}

        {/* Dynamic Hover Popover */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 bg-slate-900/95 border border-sky-400 p-3 rounded-xl shadow-2xl z-30 pointer-events-none text-xs">
            <div className="font-bold text-white text-sm">{hoveredPoint.label}</div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              Hazard: {hoveredPoint.x_hazard.toFixed(2)} • RPD: {hoveredPoint.y_rpd.toFixed(2)} • {hoveredPoint.cohort}
            </div>
          </div>
        )}

        {/* Axes Labels */}
        <div className="absolute bottom-2 right-3 text-xs font-mono text-slate-300 font-extrabold">
          Reversal Hazard (X) ►
        </div>
        <div className="absolute top-3 left-3 text-xs font-mono text-slate-300 font-extrabold">
          ▲ RPD Divergence (Y)
        </div>

      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-300 pt-1 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Stable Guidelines</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" /> Fragility Risk</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_6px_#F43F5E]" /> Reversed Trials</span>
        </div>
        <span className="font-mono text-sky-400 font-bold">CARMA 2D Space</span>
      </div>

    </div>
  );
};
