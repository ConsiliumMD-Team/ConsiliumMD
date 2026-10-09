import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, CheckCircle2, Cpu, ShieldCheck } from 'lucide-react';
import { ReplayStep } from '../../types';

interface CinematicReasoningReplayProps {
  steps?: ReplayStep[];
  onComplete?: () => void;
}

export const CinematicReasoningReplay: React.FC<CinematicReasoningReplayProps> = ({
  steps
}) => {
  const replaySteps: ReplayStep[] = steps || [
    { step: 1, title: 'Multimodal Ingestion & De-Identification', description: 'Scrubbed PHI and extracted high-dimensional features from DICOM & PDF.', duration_ms: 2000, status: 'complete' },
    { step: 2, title: 'Pre-CARMA Contextual Entropy Audit', description: 'Verified completeness of continuous parameters against guideline axioms.', duration_ms: 2000, status: 'complete' },
    { step: 3, title: 'RPD Revealed-Preference Optimization', description: 'Decomposed institutional value utility across ACC/AHA and ESC guidelines.', duration_ms: 2500, status: 'complete' },
    { step: 4, title: 'Deep Survival Reversal Risk Prediction', description: 'Mapped protocol fragility against historical clinical trial reversals.', duration_ms: 2000, status: 'complete' },
    { step: 5, title: '5-State Evidential Synthesis', description: 'Synthesized conflict-aware recommendation with mathematical assurance bounds.', duration_ms: 1500, status: 'complete' }
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStepIndex < replaySteps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, replaySteps[currentStepIndex].duration_ms);
    } else if (currentStepIndex >= replaySteps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex]);

  const togglePlay = () => {
    if (currentStepIndex >= replaySteps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cinematic Reasoning Replay (10s Animation)</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all shadow-[0_0_12px_rgba(0,242,254,0.3)]"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg bg-slate-800 p-1 text-slate-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Animated Step Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1">
        {replaySteps.map((s, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;

          return (
            <div
              key={s.step}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(idx);
              }}
              className={`cursor-pointer rounded-xl border p-2.5 transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_15px_rgba(0,242,254,0.3)] scale-[1.02]'
                  : isDone
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-slate-300'
                  : 'border-slate-800 bg-slate-900/40 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold">STEP 0{s.step}</span>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isActive ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00F2FE]" />
                ) : null}
              </div>
              <div className="text-xs font-bold text-white leading-tight mb-1">{s.title}</div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{s.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
