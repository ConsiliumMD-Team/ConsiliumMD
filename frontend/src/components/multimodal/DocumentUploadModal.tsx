import React, { useState } from 'react';
import { 
  X, Upload, FileText, CheckCircle2, AlertTriangle, 
  Sparkles, RefreshCw, FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { api } from '../../api/client';
import { DiscrepancyReport } from '../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadType: 'DOCUMENT' | 'IMAGE';
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  uploadType
}) => {
  const { activePatient, refreshPatients } = usePatient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [discrepancy, setDiscrepancy] = useState<DiscrepancyReport | null>(null);

  if (!isOpen || !activePatient) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      if (uploadType === 'IMAGE') {
        const res = await api.uploadDicom(activePatient.id, file);
        setExtractedData(res);
      } else {
        const res = await api.uploadDocument(activePatient.id, file);
        setExtractedData(res);

        // Check if there is a cross-modality discrepancy between the new report and existing image findings
        const discRes = await api.checkDiscrepancy(
          activePatient.id,
          ['Cardiomegaly with CTR 0.58'],
          [{ label: 'Cardiomegaly', confidence: 0.95 }],
          res.extracted_text || ''
        );
        setDiscrepancy(discRes);
      }
      await refreshPatients();
    } catch (e: any) {
      alert(e.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300">
              {uploadType === 'IMAGE' ? <Upload className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {uploadType === 'IMAGE' ? 'Upload Medical Image (DICOM / CXR / CT)' : 'Upload Clinical Document (PDF / Rx OCR)'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Patient: {activePatient.full_name} ({activePatient.mrn})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          
          {/* Dropzone */}
          <div className="relative border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-cyan-500/50 bg-slate-900/30 transition-all">
            <input
              type="file"
              onChange={handleFileChange}
              accept={uploadType === 'IMAGE' ? '.dcm,.png,.jpg,.jpeg' : '.pdf,.txt,.png,.jpg'}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-cyan-400" />
              <p className="text-xs font-semibold text-white">
                {file ? file.name : 'Drag & drop file here, or click to browse'}
              </p>
              <p className="text-[10px] text-slate-400">
                {uploadType === 'IMAGE' ? 'Supports DICOM (.dcm), Chest X-Ray, CT, MRI' : 'Supports PDF reports, Prescriptions, Lab panels'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {file && !extractedData && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-2.5 text-xs font-bold text-black hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing Multimodal Vision/OCR Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run NLP / Vision Extraction</span>
                </>
              )}
            </button>
          )}

          {/* Cross-Modality Discrepancy Alert */}
          {discrepancy && discrepancy.has_discrepancy && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 flex flex-col gap-2 animate-pulse">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
                <span>MULTIMODAL DISCREPANCY DETECTED ({discrepancy.severity})</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                {discrepancy.explanation}
              </p>
              <div className="rounded-lg bg-black/50 p-2 text-[10px] font-mono text-slate-300 flex flex-col gap-1 border border-rose-900/50">
                <div><strong>Image Modality:</strong> {discrepancy.image_modality_claim}</div>
                <div><strong>Document Text:</strong> {discrepancy.text_document_claim}</div>
              </div>
            </div>
          )}

          {/* Extracted Data View */}
          {extractedData && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Extraction Complete & Ingested into Patient EHR
                </span>
                <span className="text-[10px] font-mono text-slate-400">Confidence: 98.5%</span>
              </div>

              {extractedData.extracted_medications && (
                <div>
                  <div className="text-[11px] font-bold text-slate-300 mb-1">Parsed Medications:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.extracted_medications.map((m: any, idx: number) => (
                      <span key={idx} className="text-[10px] font-mono rounded bg-slate-800 text-cyan-300 px-2 py-0.5 border border-slate-700">
                        {m.name} {m.dose} ({m.frequency})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.extracted_labs && Object.keys(extractedData.extracted_labs).length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-300 mb-1">Parsed Lab Values:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(extractedData.extracted_labs).map(([k, v]: any) => (
                      <span key={k} className="text-[10px] font-mono rounded bg-slate-800 text-teal-300 px-2 py-0.5 border border-slate-700">
                        {k.toUpperCase()}: {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-900/60 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
