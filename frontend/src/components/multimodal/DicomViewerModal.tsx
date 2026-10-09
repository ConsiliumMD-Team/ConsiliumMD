import React, { useState } from 'react';
import { 
  X, ZoomIn, ZoomOut, Sun, Contrast, Maximize2, 
  RotateCw, Layers, Sparkles, ShieldAlert, Eye, Download, 
  Link, Crosshair, RefreshCw, CheckCircle2
} from 'lucide-react';
import { DicomAnalysis, DicomAnomaly } from '../../types';

interface DicomViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dicomData?: DicomAnalysis | null;
}

export const DicomViewerModal: React.FC<DicomViewerModalProps> = ({
  isOpen,
  onClose,
  dicomData
}) => {
  const [activeModality, setActiveModality] = useState<'CXR' | 'MRI' | 'CT'>('CXR');
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [windowPreset, setWindowPreset] = useState<'STANDARD' | 'BONE' | 'LUNG' | 'HEATMAP' | 'INVERT'>('STANDARD');
  const [activeAnomaly, setActiveAnomaly] = useState<DicomAnomaly | null>(null);
  const [showAIOverlays, setShowAIOverlays] = useState(true);

  if (!isOpen) return null;

  // Multi-modality dataset fixtures
  const modalityDatasets: Record<'CXR' | 'MRI' | 'CT', DicomAnalysis> = {
    CXR: {
      modality: 'X-Ray (PA & Lateral)',
      body_part: 'Chest / Thorax',
      filename: 'MIMIC_CXR_0049281.dcm',
      findings: [
        'Cardiomegaly with cardiothoracic ratio (CTR) ~0.58',
        'Mild bilateral perihilar vascular congestion',
        'Trace blunting of right costophrenic angle suggesting pleural effusion'
      ],
      anomalies: [
        {
          id: 'anom_cxr_1',
          label: 'Cardiomegaly (CTR > 0.55)',
          box_2d: [42, 32, 78, 68],
          confidence: 0.95,
          evidence_link: 'ACC_AHA_HF_GUIDELINE_2022_SEC_4',
          severity: 'CRITICAL',
          clinical_significance: 'Significant left ventricular enlargement consistent with HFrEF decompensation.'
        },
        {
          id: 'anom_cxr_2',
          label: 'Right Pleural Effusion',
          box_2d: [68, 62, 82, 78],
          confidence: 0.87,
          evidence_link: 'NICE_HF_EFFUSION_2023_REC_2',
          severity: 'MODERATE',
          clinical_significance: 'Interstitial fluid overload; supports loop diuretic uptitration.'
        }
      ],
      summary: 'Chest Radiograph: AI identified 2 pathological regions with high confidence.',
      metadata: { Manufacturer: 'Siemens Healthineers', kVp: '120', Exposure: '5 mAs', Matrix: '1024x1024' }
    },
    MRI: {
      modality: 'MRI (DWI / FLAIR)',
      body_part: 'Brain / Neuro',
      filename: 'FASTMRI_BRAIN_9841.dcm',
      findings: [
        'No acute territorial infarct on diffusion-weighted imaging',
        'Periventricular white matter hyperintensities (Fazekas Grade 1)',
        'Ventricular volume within age-adjusted normal limits'
      ],
      anomalies: [
        {
          id: 'anom_mri_1',
          label: 'Microvascular Ischemic Change',
          box_2d: [30, 35, 50, 55],
          confidence: 0.91,
          evidence_link: 'AHA_STROKE_PREVENTION_2021_SEC_3',
          severity: 'MILD',
          clinical_significance: 'Small vessel ischemic change; supports strict blood pressure optimization.'
        }
      ],
      summary: 'Brain MRI: No acute stroke. Mild microvascular ischemic burden noted.',
      metadata: { Manufacturer: 'GE Healthcare 3.0T', Sequence: 'FLAIR', TR: '9000ms', TE: '120ms' }
    },
    CT: {
      modality: 'Coronary CT Angiography',
      body_part: 'Cardiac / Coronary',
      filename: 'CARDIAC_CTA_2026.dcm',
      findings: [
        'Calcified plaque in proximal Left Anterior Descending (LAD) artery',
        'Estimated Coronary Artery Calcium (CAC) Agatston score ~185',
        'No high-grade luminal stenosis (>70%)'
      ],
      anomalies: [
        {
          id: 'anom_ct_1',
          label: 'Coronary Artery Calcification (CAC > 100)',
          box_2d: [38, 42, 58, 62],
          confidence: 0.94,
          evidence_link: 'ACC_AHA_CAC_SCORE_2019_GUIDELINE',
          severity: 'MODERATE',
          clinical_significance: 'Agatston score >100 reclassifies patient ASCVD risk upward, favoring statin initiation.'
        }
      ],
      summary: 'Coronary CTA: Positive CAC score (185) confirms subclinical atherosclerosis.',
      metadata: { Manufacturer: 'Canon Medical 640-slice', SliceThickness: '0.5mm', Voltage: '100kV' }
    }
  };

  const data = modalityDatasets[activeModality];

  const getFilterStyle = () => {
    let filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (windowPreset === 'BONE') filter += ' invert(0.25) contrast(170%)';
    if (windowPreset === 'LUNG') filter += ' contrast(200%) brightness(125%)';
    if (windowPreset === 'HEATMAP') filter += ' hue-rotate(190deg) saturate(220%)';
    if (windowPreset === 'INVERT') filter += ' invert(1)';
    return filter;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in">
      <div className="flex flex-col h-[92vh] w-full max-w-6xl rounded-3xl border border-cyan-500/40 bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Top Viewer Toolbar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-700/80 bg-slate-900/95 px-6 py-3.5 gap-3">
          
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-extrabold text-white font-mono">{data.filename}</span>
                <span className="rounded-full bg-cyan-950 px-3 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/50">
                  {data.modality}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">Interactive WebGL DICOM Segmentation Engine</p>
            </div>
          </div>

          {/* Modality Switcher Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
            {(['CXR', 'MRI', 'CT'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setActiveModality(m);
                  setActiveAnomaly(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeModality === m
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {m === 'CXR' ? 'Chest X-Ray' : m === 'MRI' ? 'Brain MRI' : 'Coronary CT'}
              </button>
            ))}
          </div>

          {/* Quick AI Toggle & Close */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAIOverlays(!showAIOverlays)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
                showAIOverlays ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,254,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Segmentations {showAIOverlays ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Middle Canvas & Evidence Panel */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main DICOM Viewing Canvas */}
          <div className="relative flex-1 bg-[#05060A] flex items-center justify-center overflow-hidden select-none">
            
            {/* Darkroom Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-30 pointer-events-none" />

            {/* Medical Study Graphic Rendering */}
            <div
              className="relative transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoom})`,
                filter: getFilterStyle()
              }}
            >
              {activeModality === 'CXR' && (
                <svg width="480" height="480" viewBox="0 0 500 500" className="rounded-2xl shadow-2xl bg-[#090909] border border-slate-800">
                  <defs>
                    <radialGradient id="lungGrad" cx="50%" cy="45%" r="60%">
                      <stop offset="0%" stopColor="#2A2A2A" />
                      <stop offset="60%" stopColor="#141414" />
                      <stop offset="100%" stopColor="#050505" />
                    </radialGradient>
                    <radialGradient id="cardioGrad" cx="54%" cy="58%" r="35%">
                      <stop offset="0%" stopColor="#555555" />
                      <stop offset="80%" stopColor="#333333" />
                      <stop offset="100%" stopColor="#1A1A1A" />
                    </radialGradient>
                  </defs>

                  <path d="M 120,80 Q 250,50 380,80 Q 420,240 400,420 Q 250,440 100,420 Q 80,240 120,80 Z" fill="url(#lungGrad)" stroke="#383838" strokeWidth="2" />
                  
                  {[130, 170, 210, 250, 290, 330, 370].map((y, i) => (
                    <path key={i} d={`M 140,${y} Q 250,${y + 25} 360,${y}`} stroke="#3F3F3F" strokeWidth="3" fill="none" opacity="0.65" />
                  ))}

                  <path d="M 210,180 Q 325,260 295,380 Q 210,400 190,320 Q 180,240 210,180 Z" fill="url(#cardioGrad)" opacity="0.9" />
                  <path d="M 330,370 Q 390,390 380,420 Q 330,410 330,370 Z" fill="#484848" opacity="0.85" />
                  <line x1="250" y1="70" x2="250" y2="180" stroke="#1C1C1C" strokeWidth="6" />
                </svg>
              )}

              {activeModality === 'MRI' && (
                <svg width="480" height="480" viewBox="0 0 500 500" className="rounded-2xl shadow-2xl bg-[#090909] border border-slate-800">
                  <ellipse cx="250" cy="250" rx="160" ry="190" fill="#1C1C1C" stroke="#333" strokeWidth="3" />
                  <ellipse cx="250" cy="250" rx="140" ry="170" fill="#2E2E2E" />
                  <ellipse cx="220" cy="240" rx="30" ry="50" fill="#0A0A0A" />
                  <ellipse cx="280" cy="240" rx="30" ry="50" fill="#0A0A0A" />
                  <circle cx="210" cy="210" r="14" fill="#666666" opacity="0.8" />
                  <circle cx="290" cy="210" r="12" fill="#666666" opacity="0.8" />
                </svg>
              )}

              {activeModality === 'CT' && (
                <svg width="480" height="480" viewBox="0 0 500 500" className="rounded-2xl shadow-2xl bg-[#090909] border border-slate-800">
                  <circle cx="250" cy="250" r="180" fill="#111111" stroke="#2D3748" strokeWidth="2" />
                  <circle cx="250" cy="250" r="110" fill="#222222" />
                  <path d="M 230,220 Q 270,250 250,300" stroke="#E2E8F0" strokeWidth="7" fill="none" />
                  <circle cx="255" cy="255" r="9" fill="#FFFFFF" filter="drop-shadow(0 0 8px #FFF)" />
                </svg>
              )}

              {/* AI Bounding Box Overlays */}
              {showAIOverlays && data.anomalies.map((anom) => {
                const [ymin, xmin, ymax, xmax] = anom.box_2d;
                const top = `${ymin}%`;
                const left = `${xmin}%`;
                const width = `${xmax - xmin}%`;
                const height = `${ymax - ymin}%`;
                const isHovered = activeAnomaly?.id === anom.id;

                return (
                  <div
                    key={anom.id}
                    onClick={() => setActiveAnomaly(anom)}
                    onMouseEnter={() => setActiveAnomaly(anom)}
                    className={`absolute cursor-pointer border-2 transition-all rounded-lg flex flex-col justify-between p-1.5 group ${
                      anom.severity === 'CRITICAL'
                        ? isHovered ? 'border-rose-400 bg-rose-500/35 shadow-[0_0_25px_rgba(244,63,94,0.8)]' : 'border-rose-500 bg-rose-500/15'
                        : isHovered ? 'border-amber-400 bg-amber-500/35 shadow-[0_0_25px_rgba(245,158,11,0.8)]' : 'border-amber-500 bg-amber-500/15'
                    }`}
                    style={{ top, left, width, height }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase ${
                        anom.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-200 border border-rose-600' : 'bg-amber-950 text-amber-200 border border-amber-600'
                      }`}>
                        {anom.label}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-black/90 px-1.5 rounded border border-cyan-800">
                        {Math.round(anom.confidence * 100)}%
                      </span>
                    </div>

                    <div className="text-[10px] text-white bg-black/90 px-1.5 py-0.5 rounded font-mono truncate border border-slate-700">
                      🔗 {anom.evidence_link}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Viewer Controls */}
            <div className="absolute bottom-5 flex items-center gap-3.5 rounded-2xl border border-slate-700/80 bg-slate-900/95 px-5 py-2.5 shadow-2xl backdrop-blur-xl">
              <button
                onClick={() => setZoom(prev => Math.max(0.6, prev - 0.2))}
                className="p-1 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono font-bold text-cyan-300">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(2.5, prev + 0.2))}
                className="p-1 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-slate-700 mx-1" />

              {/* Presets */}
              {(['STANDARD', 'BONE', 'LUNG', 'HEATMAP', 'INVERT'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setWindowPreset(p)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    windowPreset === p ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,242,254,0.4)]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Right AI Findings & Evidence Panel */}
          <div className="w-88 border-l border-slate-700/80 bg-slate-950 p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3 mb-4">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Vision Evidence Linkage</h3>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700 mb-4 font-medium">
                {data.summary}
              </p>

              {/* Anomalies List */}
              <div className="flex flex-col gap-3">
                {data.anomalies.map(anom => (
                  <div
                    key={anom.id}
                    onClick={() => setActiveAnomaly(anom)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                      activeAnomaly?.id === anom.id
                        ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,242,254,0.3)]'
                        : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{anom.label}</span>
                      <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {Math.round(anom.confidence * 100)}% Conf
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{anom.clinical_significance}</p>
                    
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-cyan-300 font-mono bg-slate-950 p-2 rounded-xl border border-cyan-900/50">
                      <Link className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{anom.evidence_link}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Technical Metadata */}
            <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3 text-[10px] font-mono text-slate-300">
              {Object.entries(data.metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between py-0.5 border-b border-slate-800/60 last:border-0">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-cyan-300 font-bold">{v}</span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
