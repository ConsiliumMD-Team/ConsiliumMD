import React, { useState, useEffect } from 'react';
import { X, Share2, Download, Copy, Check, FileJson, Sparkles } from 'lucide-react';
import { api } from '../../api/client';

interface FhirExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
}

export const FhirExportModal: React.FC<FhirExportModalProps> = ({
  isOpen,
  onClose,
  caseId
}) => {
  const [bundleData, setBundleData] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && caseId) {
      setIsLoading(true);
      api.exportFhir(caseId)
        .then(res => setBundleData(res))
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, caseId]);

  if (!isOpen) return null;

  const jsonString = bundleData ? JSON.stringify(bundleData.fhir_bundle, null, 2) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir_bundle_case_${caseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="flex flex-col w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300">
              <FileJson className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">SMART on FHIR R4 Transaction Bundle</h3>
                <span className="rounded bg-teal-950 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-800 font-mono">
                  HL7 FHIR R4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Epic / Cerner Interoperability Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* JSON Viewer */}
        <div className="p-5 flex flex-col gap-3 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-mono">
              Generating HL7 FHIR transaction bundle...
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 font-mono text-[11px] text-teal-300 overflow-x-auto max-h-96">
              <pre>{jsonString}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-900/60 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {bundleData?.total_entries || 0} FHIR resources bundled
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download FHIR Bundle</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
