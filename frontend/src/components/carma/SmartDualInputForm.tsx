import React, { useState } from 'react';
import { 
  Send, Sparkles, Upload, FileText, Check, 
  HelpCircle, AlertCircle, ArrowRight, RefreshCw,
  Lightbulb, Zap, Database
} from 'lucide-react';
import { AmbientVoiceDictation } from './AmbientVoiceDictation';
import { Patient } from '../../types';

interface SmartDualInputFormProps {
  patient: Patient;
  onSubmitQuery: (title: string, text: string) => Promise<void>;
  onResolveRetrieve?: (retrievedData: Record<string, any>) => Promise<void>;
  missingVariables?: Array<{ variable: string; label: string; unit: string; reason: string }>;
  isRetrieving?: boolean;
  isLoading?: boolean;
}

export const SmartDualInputForm: React.FC<SmartDualInputFormProps> = ({
  patient,
  onSubmitQuery,
  onResolveRetrieve,
  missingVariables = [],
  isRetrieving = false,
  isLoading = false
}) => {
  const [queryText, setQueryText] = useState<string>('');
  const [retrievedInputs, setRetrievedInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'UPLOAD'>('MANUAL');

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    await onSubmitQuery('Clinical Query', queryText.trim());
  };

  const handleSendRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onResolveRetrieve) return;
    await onResolveRetrieve(retrievedInputs);
  };

  // Quick prompt inquiry templates
  const quickPrompts = [
    {
      title: 'Statin in CKD/ASCVD',
      query: 'Evaluate high-intensity statin initiation (Atorvastatin 40mg) for ASCVD risk reduction in elderly patient with Stage 3b CKD.'
    },
    {
      title: 'SGLT2i Renoprotection',
      query: 'Assess Dapagliflozin 10mg initiation criteria for cardiorenal protection in T2D with reduced eGFR.'
    },
    {
      title: 'Aspirin Primary Prevention',
      query: 'Evaluate primary prevention low-dose Aspirin 81mg safety weighing bleeding hazard against ischemic benefit.'
    },
    {
      title: 'CYP2C19 Clopidogrel DAPT',
      query: 'Prescribe post-PCI dual antiplatelet therapy (DAPT) with Clopidogrel 75mg daily.'
    }
  ];

  return (
    <div className={`rounded-2xl p-5 transition-all duration-300 ${
      isRetrieving ? 'glass-panel-amber border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]' : 'glass-panel-glow border border-cyan-500/35'
    }`}>
      
      {/* If in RETRIEVE state: Show Epistemic Gap Resolution Dual-Input */}
      {isRetrieving ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between border-b border-amber-500/30 pb-3.5 gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Epistemic Gap Resolution (Missing State S)
                </h3>
                <p className="text-xs text-amber-300/80 font-mono">
                  CARMA Halted: Missing Factual Biomarkers Needed for Reasoning
                </p>
              </div>
            </div>

            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('MANUAL')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'MANUAL' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Direct Numeric Input
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UPLOAD')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'UPLOAD' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Drop Lab PDF / Scan
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-3.5 text-xs sm:text-sm text-amber-200/95 leading-relaxed flex flex-wrap items-center justify-between gap-2">
            <span>
              CARMA halted automated guideline synthesis because <strong className="text-white underline">{missingVariables.length || 1} required clinical biomarker(s)</strong> are absent from EHR context. Provide values below to resume reasoning.
            </span>
            <button
              type="button"
              onClick={() => {
                setRetrievedInputs({ ldl: '144', egfr: '38', platelets: '210', bp_systolic: '138' });
              }}
              className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm"
            >
              ⚡ Quick Fill Sample Labs
            </button>
          </div>

          {activeTab === 'MANUAL' ? (
            <form onSubmit={handleSendRetrieve} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(missingVariables.length > 0 ? missingVariables : [
                { variable: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', reason: 'Required for ASCVD risk calculation & statin intensity guideline selection' },
                { variable: 'egfr', label: 'eGFR Renal Function', unit: 'mL/min/1.73m²', reason: 'Required for renal dosage adjustment & safety bounds' }
              ]).map((mv) => (
                <div key={mv.variable} className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-4 flex flex-col gap-2 shadow-md">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-300">
                    <span className="text-sm font-bold text-white">{mv.label}</span>
                    <span className="text-xs text-amber-200 font-mono bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded">
                      {mv.unit}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={`e.g., ${mv.variable === 'ldl' ? '145' : mv.variable === 'egfr' ? '38' : '135'}`}
                    value={retrievedInputs[mv.variable] || ''}
                    onChange={(e) => setRetrievedInputs({ ...retrievedInputs, [mv.variable]: e.target.value })}
                    className="w-full rounded-xl bg-black/80 border border-amber-500/60 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="text-xs text-slate-400 leading-tight">{mv.reason}</span>
                </div>
              ))}

              <div className="sm:col-span-2 mt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 py-3.5 text-xs sm:text-sm font-extrabold text-black hover:opacity-95 transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Unblock CARMA Reasoning with Retrieved Biomarkers</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="border-2 border-dashed border-amber-500/50 rounded-2xl p-7 text-center bg-amber-950/20 flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Upload className="h-7 w-7" />
              </div>
              <span className="text-base font-bold text-white">Drag & drop lab PDF, clinical note, or radiology scan</span>
              <span className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                Tesseract OCR and Clinical NLP will extract lipid biomarkers, renal labs, and vitals to immediately resolve this epistemic gap.
              </span>
              <button
                type="button"
                onClick={() => {
                  setRetrievedInputs({ ldl: '144', egfr: '38', platelets: '210', bp_systolic: '138' });
                  setActiveTab('MANUAL');
                }}
                className="mt-2 rounded-xl bg-amber-500 text-black px-5 py-2.5 text-xs sm:text-sm font-bold hover:bg-amber-400 transition-all shadow-md"
              >
                Auto-Fill Sample Lab PDF Extraction (LDL 144, eGFR 38)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Standard Smart Clinical Query Input */
        <form onSubmit={handleSendQuery} className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-cyan-500/25 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  CARMA Predictive Clinical Query Interface
                </h3>
                <p className="text-xs text-cyan-300/80 font-mono">
                  Adversarial Multi-Guideline Decision Engine Grounded in Multimodal EHR
                </p>
              </div>
            </div>
            
            {/* Ambient Voice Dictation Button */}
            <AmbientVoiceDictation
              currentText={queryText}
              onTranscriptChange={(t) => setQueryText(t)}
            />
          </div>

          <div className="relative">
            <textarea
              rows={2}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g., 'Evaluate high-intensity statin therapy (Atorvastatin 40mg) considering renal function and primary prevention in elderly patient...'"
              className="w-full rounded-xl bg-slate-950/90 border border-slate-700/80 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none shadow-inner leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick prompt chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-300 font-mono mr-1 font-semibold">Quick Clinical Questions:</span>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQueryText(p.query)}
                  className="rounded-xl bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-cyan-300 hover:bg-slate-750 border border-slate-700 transition-all shadow-sm"
                  title={p.query}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || !queryText.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 px-6 py-3 text-xs sm:text-sm font-extrabold text-black hover:opacity-95 transition-all shadow-[0_0_25px_rgba(0,242,254,0.35)] disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Evaluating CARMA Bounds...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Execute CARMA</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
