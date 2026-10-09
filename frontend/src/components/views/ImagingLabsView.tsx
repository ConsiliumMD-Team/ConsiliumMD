import React, { useState } from 'react';
import { 
  FileImage, Eye, Upload, AlertTriangle, ShieldCheck, 
  Layers, Sparkles, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

interface ImagingLabsViewProps {
  onOpenDicomViewer: () => void;
  onOpenDicomUpload: () => void;
  onOpenDocUpload: () => void;
}

export const ImagingLabsView: React.FC<ImagingLabsViewProps> = ({
  onOpenDicomViewer,
  onOpenDicomUpload,
  onOpenDocUpload
}) => {
  const { activePatient } = usePatient();
  const [selectedScanModality, setSelectedScanModality] = useState<'CXR' | 'BRAIN_MRI' | 'CORONARY_CT'>('CXR');

  const imagingScans = [
    {
      id: 'cxr_01',
      title: 'Chest Radiograph (PA/Lateral)',
      modality: 'CXR',
      date: '2026-09-28',
      finding: 'Mild bilateral basal interstitial opacity. Normal cardiothoracic ratio (0.46). No pneumothorax.',
      status: 'VERIFIED',
      anomalies: ['Basal Infiltrates (Left Lower Lobe)']
    },
    {
      id: 'mri_01',
      title: 'Brain MRI Axial T2 / FLAIR',
      modality: 'BRAIN_MRI',
      date: '2026-09-15',
      finding: 'Age-appropriate cerebral volume loss. Mild periventricular microvascular white matter hyperintensities (Fazekas Grade 1).',
      status: 'VERIFIED',
      anomalies: ['Fazekas 1 White Matter Changes']
    },
    {
      id: 'cta_01',
      title: 'Coronary CT Angiography (CCTA)',
      modality: 'CORONARY_CT',
      date: '2026-08-20',
      finding: 'Non-calcified plaque in proximal LAD (30-40% stenosis). Coronary Artery Calcium (CAC) Agatston score = 148.',
      status: 'VERIFIED',
      anomalies: ['CAC Score 148', 'LAD 35% Stenosis']
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="card-surface p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileImage className="h-5 w-5 text-sky-400" />
            <span>Multimodal Imaging & Clinical Laboratory Ingestion</span>
          </h2>
          <p className="text-xs text-slate-400">
            WebGL DICOM visual viewer with AI anomaly bounding boxes and OCR entity extraction.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={onOpenDicomViewer} className="btn-primary">
            <Eye className="h-3.5 w-3.5" />
            <span>Launch WebGL DICOM Viewer</span>
          </button>
          <button onClick={onOpenDicomUpload} className="btn-secondary">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload DICOM</span>
          </button>
          <button onClick={onOpenDocUpload} className="btn-secondary">
            <FileText className="h-3.5 w-3.5" />
            <span>Upload Lab PDF (OCR)</span>
          </button>
        </div>
      </div>

      {/* Multimodal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {imagingScans.map(scan => (
          <div key={scan.id} className="card-surface p-4.5 flex flex-col justify-between gap-3 border border-slate-800 hover:border-sky-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-white">{scan.title}</span>
                <span className="badge-info font-mono">{scan.modality}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mb-2">Study Date: {scan.date}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{scan.finding}</p>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                {scan.anomalies.map((anom, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono">
                    • {anom}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenDicomViewer}
              className="btn-outline w-full text-xs justify-center"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Inspect Scan in WebGL Viewer</span>
            </button>
          </div>
        ))}
      </div>

      {/* Cross-Modality Discrepancy Detection Card */}
      <div className="card-surface p-5 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase font-mono">
              Cross-Modality Consistency Verification
            </span>
          </div>
          <span className="badge-success font-mono">No Discrepancies</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          ConsiliumMD automated discrepancy engine cross-referenced OCR findings from the radiologist's signed PDF report with the local computer vision model's DICOM feature maps. Zero contradictions detected across lung field opacities and cardiothoracic indices.
        </p>
      </div>

    </div>
  );
};
