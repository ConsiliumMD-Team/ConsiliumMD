import React, { useState } from 'react';
import { 
  FileText, Stethoscope, Sparkles, Download, CheckCircle2, 
  Share2, Shield, AlertCircle, Copy, Check
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { ClinicalCase } from '../../types';

interface ConsultationsViewProps {
  onOpenSoapModal: () => void;
  onOpenFhirExport: () => void;
  onOpenOverrideModal: () => void;
}

export const ConsultationsView: React.FC<ConsultationsViewProps> = ({
  onOpenSoapModal,
  onOpenFhirExport,
  onOpenOverrideModal
}) => {
  const { activePatient, activeCase } = usePatient();
  const [chiefComplaint, setChiefComplaint] = useState('Evaluation for ASCVD lipid management and cardiorenal optimization.');
  const [hpi, setHpi] = useState('Patient is an 82-year-old presenting with stage 3b CKD and elevated LDL-C (142 mg/dL). Discussing statin regimen trade-offs.');
  const [copied, setCopied] = useState(false);

  const handleCopyNote = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="card-surface p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-400" />
            <span>Clinical Consultation & EHR Documentation Workspace</span>
          </h2>
          <p className="text-xs text-slate-400">
            Structured clinical encounter documentation synchronized with CARMA decision bounds and FHIR R4 interoperability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={onOpenSoapModal} className="btn-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate SOAP Note</span>
          </button>
          {activeCase && (
            <button onClick={onOpenFhirExport} className="btn-secondary">
              <Download className="h-3.5 w-3.5" />
              <span>Export FHIR JSON</span>
            </button>
          )}
          {activeCase && (
            <button onClick={onOpenOverrideModal} className="btn-outline">
              <Shield className="h-3.5 w-3.5" />
              <span>Clinical Override</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Consultation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (4 cols): Patient & Case Context Summary */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="card-surface p-4 flex flex-col gap-3 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase font-mono">Patient Summary</span>
              <span className="badge-info font-mono">{activePatient?.mrn || 'N/A'}</span>
            </div>

            <div className="text-xs text-slate-300 space-y-1.5">
              <div><strong className="text-white">Name:</strong> {activePatient?.full_name || 'Arthur Vance'}</div>
              <div><strong className="text-white">Demographics:</strong> Age {activePatient?.age || 82}, {activePatient?.gender || 'Male'}</div>
              <div><strong className="text-white">eGFR Renal:</strong> {activePatient?.lab_results?.egfr || 38} mL/min (CKD 3b)</div>
              <div><strong className="text-white">LDL Cholesterol:</strong> {activePatient?.lab_results?.ldl || 142} mg/dL</div>
              <div><strong className="text-white">Current CARMA State:</strong> <span className="font-mono text-sky-400 font-bold">{activeCase?.routing_state || 'UNINITIALIZED'}</span></div>
            </div>
          </div>

          {/* Active CARMA Decision Snapshot */}
          {activeCase && (
            <div className="card-surface p-4 flex flex-col gap-2.5 border border-sky-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 font-mono">CARMA Synthesized Recommendation</span>
                <span className="text-[10px] text-slate-400 font-mono">Confidence: {((activeCase.confidence_score || 0.85) * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {activeCase.carma_payload?.recommendation?.text || 'Recommendation synthesized based on ACC/AHA and KDIGO guidelines.'}
              </p>
            </div>
          )}
        </div>

        {/* Center & Right (8 cols): Structured Note Editor */}
        <div className="lg:col-span-8 card-surface p-5 flex flex-col gap-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Encounter Documentation Note</h3>
              <p className="text-[11px] text-slate-400 font-mono">SOAP Structure (Subjective, Objective, Assessment, Plan)</p>
            </div>
            <button
              onClick={handleCopyNote}
              className="btn-secondary text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Note'}</span>
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Chief Complaint:</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">History of Present Illness (HPI):</label>
              <textarea
                rows={3}
                value={hpi}
                onChange={(e) => setHpi(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Objective Vitals & Labs Summary:</label>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
                BP: 135/82 mmHg | HR: 76 bpm | SpO2: 98% | eGFR: 38 mL/min | LDL-C: 142 mg/dL | HbA1c: 7.4%
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Assessment & CARMA Clinical Plan:</label>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-sky-500/20 text-xs text-slate-200 leading-relaxed font-sans">
                1. <strong>Primary Prevention / Statin Protocol:</strong> Weigh 5-year ASCVD reduction against myopathy risk in stage 3b CKD.<br />
                2. <strong>Renoprotective Optimization:</strong> Maintain guideline-directed medical therapy (GDMT) with regular renal monitoring.<br />
                3. <strong>Follow-up:</strong> Repeat comprehensive metabolic panel and lipid panel in 8-12 weeks.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
