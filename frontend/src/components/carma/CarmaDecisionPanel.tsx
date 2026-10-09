import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Scale, ShieldAlert, 
  HelpCircle, Sparkles, FileText, Download, Share2, 
  ArrowRight, ShieldCheck, Bookmark, CheckSquare, Square,
  Zap, Lock, Activity, Eye
} from 'lucide-react';
import { ClinicalCase, RoutingState } from '../../types';
import { GenerativeElicitationScale } from './GenerativeElicitationScale';

interface CarmaDecisionPanelProps {
  caseData: ClinicalCase;
  onResolveElicit: (preferenceWeight: number) => Promise<void>;
  onAcknowledgeWarn: (rationale?: string) => Promise<void>;
  onOpenSoapModal: () => void;
  onOpenFhirExport: () => void;
  onOpenOverrideModal: () => void;
  isLoading?: boolean;
}

export const CarmaDecisionPanel: React.FC<CarmaDecisionPanelProps> = ({
  caseData,
  onResolveElicit,
  onAcknowledgeWarn,
  onOpenSoapModal,
  onOpenFhirExport,
  onOpenOverrideModal,
  isLoading = false
}) => {
  const [warnAckChecked, setWarnAckChecked] = useState<boolean>(caseData.warning_acknowledged);
  const payload = caseData.carma_payload;
  const state: RoutingState = caseData.routing_state;

  const stateConfigs: Record<RoutingState, { bg: string; border: string; text: string; label: string; icon: any }> = {
    ANSWER: { 
      bg: 'glass-panel-emerald', 
      border: 'border-emerald-500/80', 
      text: 'text-emerald-300', 
      label: 'STATE 1: CLINICAL CONSENSUS (VERIFIED)', 
      icon: CheckCircle2 
    },
    RETRIEVE: { 
      bg: 'glass-panel-amber', 
      border: 'border-amber-500/80', 
      text: 'text-amber-300', 
      label: 'STATE 2: EPISTEMIC GAP (RETRIEVE MISSING BIOMARKER S)', 
      icon: HelpCircle 
    },
    ELICIT: { 
      bg: 'glass-panel-purple', 
      border: 'border-purple-500/80', 
      text: 'text-purple-300', 
      label: 'STATE 3: NORMATIVE CONFLICT (RPD WEIGHT DIVERGENCE Δw)', 
      icon: Scale 
    },
    WARN: { 
      bg: 'glass-panel-rose', 
      border: 'border-rose-500/80', 
      text: 'text-rose-300', 
      label: 'STATE 4: LONGITUDINAL REVERSAL RISK ALERT', 
      icon: AlertTriangle 
    },
    ESCALATE: { 
      bg: 'glass-panel-rose', 
      border: 'border-red-500', 
      text: 'text-red-300', 
      label: 'STATE 5: ECL GRAPH COLLAPSE / ESCALATE TO SENIOR REVIEWER', 
      icon: ShieldAlert 
    }
  };

  const currentCfg = stateConfigs[state] || stateConfigs.ANSWER;
  const StateIcon = currentCfg.icon;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 5-State Routing Luminous Banner */}
      <div className={`rounded-3xl border-2 ${currentCfg.border} ${currentCfg.bg} p-6 sm:p-7 transition-all duration-300 relative overflow-hidden shadow-2xl`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-5">
          
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/70 border border-white/30 text-white shadow-xl shrink-0">
              <StateIcon className={`h-8 w-8 ${currentCfg.text} animate-pulse`} />
            </div>
            <div>
              <span className={`text-xs font-black uppercase tracking-wider font-mono ${currentCfg.text}`}>
                {currentCfg.label}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight">
                {payload.state_title}
              </h3>
            </div>
          </div>

          {/* Mathematical Assurance Metrics Gauges */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="rounded-xl bg-black/80 px-3.5 py-2 border border-slate-700 shadow-md">
              <span className="text-slate-400">Certainty: </span>
              <strong className="text-sky-300 text-sm font-bold">{Math.round(caseData.confidence_score * 100)}%</strong>
            </div>
            <div className="rounded-xl bg-black/80 px-3.5 py-2 border border-slate-700 shadow-md">
              <span className="text-slate-400">RPD Δw: </span>
              <strong className="text-purple-300 text-sm font-bold">{caseData.rpd_score.toFixed(2)}</strong>
            </div>
            <div className="rounded-xl bg-black/80 px-3.5 py-2 border border-slate-700 shadow-md">
              <span className="text-slate-400">Reversal Hazard: </span>
              <strong className="text-amber-300 text-sm font-bold">{caseData.reversal_hazard.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-100 mt-4 leading-relaxed font-medium">
          {payload.summary}
        </p>
      </div>

      {/* Critical Pharmacogenomic & Safety Alerts */}
      {payload.pgx_alerts && payload.pgx_alerts.length > 0 && (
        <div className="rounded-2xl border-2 border-purple-500/60 bg-purple-950/60 p-5 flex flex-col gap-3 shadow-xl">
          {payload.pgx_alerts.map((al, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <ShieldAlert className="h-6 w-6 text-purple-300 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-purple-200 uppercase font-mono tracking-wider">
                  {al.type} [{al.severity}]
                </span>
                <p className="text-sm text-purple-100 leading-relaxed mt-1 font-medium">{al.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STATE 3: ELICIT - Generative Elicitation Scale */}
      {state === 'ELICIT' && (
        <GenerativeElicitationScale
          dimensionLeft={payload.elicitation_scale?.dimension_left}
          dimensionRight={payload.elicitation_scale?.dimension_right}
          recLeft={payload.elicitation_scale?.current_recommendation_left}
          recRight={payload.elicitation_scale?.current_recommendation_right}
          onResolve={onResolveElicit}
          isLoading={isLoading}
        />
      )}

      {/* STATE 4: WARN - Longitudinal Reversal Risk Mandatory Acknowledgment */}
      {state === 'WARN' && (
        <div className="glass-panel-rose rounded-3xl p-6 sm:p-7 border-2 border-rose-500/70 flex flex-col gap-5 shadow-2xl">
          <div className="flex items-center gap-3 text-rose-300 font-extrabold text-base uppercase tracking-wider">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
            <span>High Guideline Drift & Clinical Trial Fragility Warning</span>
          </div>

          <div className="rounded-2xl bg-black/80 p-4.5 text-sm text-rose-100 flex flex-col gap-2 border border-rose-900/80 font-medium leading-relaxed">
            {payload.fragility_reasons?.map((r, i) => (
              <div key={i}>⚠️ {r}</div>
            ))}
          </div>

          {/* Mandatory UI Acknowledgment Checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900/95 p-4.5 border border-slate-700">
            <label className="flex items-center gap-3.5 cursor-pointer text-sm font-bold text-white select-none">
              <input
                type="checkbox"
                checked={warnAckChecked}
                onChange={(e) => setWarnAckChecked(e.target.checked)}
                className="h-5 w-5 rounded-md accent-rose-500 cursor-pointer"
              />
              <span>I acknowledge the historical reversal hazard and accept clinical responsibility.</span>
            </label>

            <button
              onClick={() => onAcknowledgeWarn()}
              disabled={!warnAckChecked || isLoading || caseData.warning_acknowledged}
              className="btn-primary bg-rose-600 hover:bg-rose-700 border-rose-500"
            >
              {caseData.warning_acknowledged ? 'Acknowledged & Unlocked' : 'Acknowledge Fragility & Proceed'}
            </button>
          </div>
        </div>
      )}

      {/* STATE 5: ESCALATE - Locked to Senior Reviewer */}
      {state === 'ESCALATE' && (
        <div className="glass-panel-rose rounded-3xl p-6 sm:p-7 border-2 border-red-500 flex flex-col gap-4 shadow-2xl">
          <div className="flex items-center gap-3 text-red-300 font-extrabold text-base uppercase tracking-wider">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            <span>Automated AI Decision Suspended (ECL Graph Collapse)</span>
          </div>
          <p className="text-sm text-red-100 leading-relaxed font-medium">
            {payload.recommendation?.text || 'CARMA halted automated routing due to non-identifiable bounds. Assigned to Senior Reviewer for human clinical adjudication.'}
          </p>
          <div className="text-xs font-mono text-sky-300 bg-black/70 p-3 rounded-xl border border-red-900 font-bold">
            Queue Target: {payload.escalation_queue_assigned || 'Senior Cardiology Review Board'}
          </div>
        </div>
      )}

      {/* Standard Consensus / Synthesized Recommendation Card */}
      {payload.recommendation && (state === 'ANSWER' || (state === 'WARN' && caseData.warning_acknowledged)) && (
        <div className="glass-panel-emerald rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/70 flex flex-col gap-5 shadow-2xl">
          
          <div className="flex items-center justify-between border-b border-emerald-500/40 pb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-emerald-300" />
              <h3 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">
                {payload.recommendation.headline}
              </h3>
            </div>
            <span className="badge-success text-xs">
              {payload.recommendation.evidence_grade || 'Level A RCT Concordance'}
            </span>
          </div>

          <div className="text-base font-bold text-white leading-relaxed bg-slate-900/90 p-5 rounded-2xl border border-slate-700 shadow-inner">
            {payload.recommendation.text}
          </div>

          {payload.recommendation.rationale && (
            <p className="text-sm text-slate-200 leading-relaxed">
              <strong>Clinical Rationale:</strong> {payload.recommendation.rationale}
            </p>
          )}

          {/* Evidence Citations */}
          {payload.recommendation.citations && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-700/80">
              <div className="text-xs uppercase font-bold text-slate-400 font-mono">Evidence Grounding Citations:</div>
              <div className="flex flex-wrap gap-2.5">
                {payload.recommendation.citations.map((c, i) => (
                  <span key={i} className="text-xs font-mono rounded-xl bg-slate-900/90 px-3.5 py-2 text-sky-200 border border-slate-700 shadow-sm">
                    📚 {c.source} ({c.section})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Zero-Friction Workflow Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-700/80">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenSoapModal}
                className="btn-primary"
              >
                <FileText className="h-4 w-4" />
                <span>Auto-Draft SOAP Note & ICD Codes</span>
              </button>

              <button
                onClick={onOpenFhirExport}
                className="btn-secondary"
              >
                <Share2 className="h-4 w-4 text-sky-400" />
                <span>1-Click SMART on FHIR Export</span>
              </button>
            </div>

            <button
              onClick={onOpenOverrideModal}
              className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors"
            >
              Manual Clinician Override
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
