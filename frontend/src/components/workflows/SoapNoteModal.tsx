import React, { useState } from 'react';
import { X, Copy, Check, FileText, Code, DollarSign, Sparkles } from 'lucide-react';
import { ClinicalCase } from '../../types';

interface SoapNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: ClinicalCase | null;
}

export const SoapNoteModal: React.FC<SoapNoteModalProps> = ({
  isOpen,
  onClose,
  caseData
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !caseData) return null;

  const soap = caseData.soap_note || {};
  const icd10 = caseData.icd10_codes || [];
  const cpt = caseData.cpt_codes || [];

  const fullSoapText = `
SUBJECTIVE:
${soap.subjective || 'Patient evaluated via CARMA Clinical Decision Support.'}

OBJECTIVE:
${soap.objective || 'Vitals and Laboratory parameters reviewed.'}

ASSESSMENT:
${soap.assessment || caseData.carma_payload?.recommendation?.headline || 'Clinical Assessment.'}

PLAN:
${soap.plan || caseData.carma_payload?.recommendation?.text || 'Continue protocol.'}

DIAGNOSIS (ICD-10):
${icd10.map(c => `${c.code} - ${c.description}`).join('\n')}

PROCEDURES & BILLING (CPT):
${cpt.map(c => `${c.code} - ${c.description}`).join('\n')}
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSoapText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="flex flex-col w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Auto-Drafted SOAP Note & Billing Codes</h3>
              <p className="text-[11px] text-slate-400 font-mono">{caseData.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          
          {/* SOAP Note Sections */}
          <div className="flex flex-col gap-3">
            {/* Subjective */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="text-[10px] uppercase font-bold text-cyan-400 font-mono mb-1">Subjective (S)</div>
              <p className="text-xs text-slate-200 leading-relaxed">{soap.subjective}</p>
            </div>

            {/* Objective */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="text-[10px] uppercase font-bold text-teal-400 font-mono mb-1">Objective (O)</div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{soap.objective}</p>
            </div>

            {/* Assessment */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="text-[10px] uppercase font-bold text-purple-400 font-mono mb-1">Assessment (A)</div>
              <p className="text-xs text-slate-200 leading-relaxed">{soap.assessment}</p>
            </div>

            {/* Plan */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="text-[10px] uppercase font-bold text-emerald-400 font-mono mb-1">Plan (P)</div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{soap.plan}</p>
            </div>
          </div>

          {/* ICD-10 & CPT Billing Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* ICD-10 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mb-2">
                <Code className="h-3.5 w-3.5" />
                <span>Suggested ICD-10 Diagnostic Codes</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {icd10.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-slate-800/80 px-2 py-1 text-xs">
                    <span className="font-mono text-cyan-300 font-bold">{c.code}</span>
                    <span className="text-[11px] text-slate-300 truncate max-w-[200px]">{c.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CPT Codes */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 mb-2">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Suggested CPT Procedure Codes</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {cpt.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-slate-800/80 px-2 py-1 text-xs">
                    <span className="font-mono text-teal-300 font-bold">{c.code}</span>
                    <span className="text-[11px] text-slate-300 truncate max-w-[200px]">{c.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-900/60 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">Ready for 1-click EHR chart insertion</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)]"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : '1-Click Copy SOAP Note'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
