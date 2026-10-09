import React, { useState } from 'react';
import { 
  Heart, Activity, Brain, Shield, Layers, Eye, 
  Sparkles, AlertTriangle, CheckCircle2, RotateCw, 
  ZoomIn, ZoomOut, Zap, ShieldCheck
} from 'lucide-react';
import { Patient } from '../../types';

interface DigitalTwin3DProps {
  patient: Patient;
  selectedOrgan: string | null;
  onSelectOrgan: (organ: string | null) => void;
}

interface OrganNode {
  id: string;
  name: string;
  cx: number;
  cy: number;
  system: string;
  icon: any;
  primaryCondition: string;
  guidelineTarget: string;
}

export const DigitalTwin3D: React.FC<DigitalTwin3DProps> = ({
  patient,
  selectedOrgan,
  onSelectOrgan
}) => {
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'ALL' | 'CARDIO' | 'RENAL' | 'PULMONARY' | 'NEURO'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const organNodes: OrganNode[] = [
    {
      id: 'brain',
      name: 'Cerebrovascular / Brain',
      cx: 50,
      cy: 14,
      system: 'NEURO',
      icon: Brain,
      primaryCondition: 'Fazekas Grade 1 Microvascular Change (Small Vessel)',
      guidelineTarget: 'AHA Stroke Primary Prevention Guidelines'
    },
    {
      id: 'heart',
      name: 'Cardiovascular (Heart)',
      cx: 54,
      cy: 35,
      system: 'CARDIO',
      icon: Heart,
      primaryCondition: patient.organ_states?.heart === 'critical' ? 'Cardiomegaly / CTR 0.58 / HFrEF' : 'ASCVD Risk Profile & Primary Statin Target',
      guidelineTarget: 'ACC/AHA 2019 Prevention / ESC 2023 Guidelines'
    },
    {
      id: 'lungs',
      name: 'Pulmonary (Lungs)',
      cx: 43,
      cy: 34,
      system: 'PULMONARY',
      icon: Activity,
      primaryCondition: patient.organ_states?.lungs === 'warning' ? 'Trace Right Pleural Congestion' : 'Clear Lung Fields Bilaterally',
      guidelineTarget: 'GOLD / ACC Heart Failure Congestion Matrix'
    },
    {
      id: 'liver',
      name: 'Hepatic / GI (Liver)',
      cx: 43,
      cy: 48,
      system: 'ALL',
      icon: Shield,
      primaryCondition: 'Normal synthetic liver baseline (AST/ALT normal)',
      guidelineTarget: 'AASLD Statin Safety & SGLT2i Clearance'
    },
    {
      id: 'kidneys',
      name: 'Renal (Kidneys)',
      cx: 56,
      cy: 53,
      system: 'RENAL',
      icon: Sparkles,
      primaryCondition: `eGFR: ${patient.lab_results?.egfr ?? 36} mL/min (CKD Stage 3b)`,
      guidelineTarget: 'KDIGO 2024 SGLT2i / RASi Clinical Practice'
    },
    {
      id: 'vascular',
      name: 'Peripheral Vasculature',
      cx: 50,
      cy: 76,
      system: 'CARDIO',
      icon: Activity,
      primaryCondition: 'Post-PCI Stenting / Dual Antiplatelet Coverage',
      guidelineTarget: 'ARC-HBR / ACC DAPT Duration Bleeding Risk'
    }
  ];

  const getOrganStatus = (organId: string) => {
    return patient.organ_states?.[organId] || 'normal';
  };

  const filteredOrgans = organNodes.filter(o => viewMode === 'ALL' || o.system === viewMode || o.system === 'ALL');

  return (
    <div className="glass-panel-glow rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden h-full min-h-[580px] shadow-2xl border border-cyan-500/30">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Holographic 3D Digital Twin
              </h2>
              <p className="text-[10px] text-cyan-300/80 font-mono">Interactive Anatomical Evidence Grounding</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
              className="flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-cyan-300 border border-slate-700 hover:bg-slate-750 transition-colors shadow-sm"
              title="Rotate 3D Silhouette"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>{rotationAngle}°</span>
            </button>
            <button
              onClick={() => setZoomLevel(prev => (prev === 1 ? 1.25 : 1))}
              className="rounded-xl bg-slate-800 p-1.5 text-slate-300 hover:text-white border border-slate-700"
              title="Toggle Zoom"
            >
              {zoomLevel === 1 ? <ZoomIn className="h-3.5 w-3.5" /> : <ZoomOut className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* System Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(['ALL', 'CARDIO', 'RENAL', 'PULMONARY', 'NEURO'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                viewMode === mode
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Holographic Canvas */}
      <div className="relative flex-1 flex items-center justify-center my-2 select-none overflow-hidden min-h-[380px]">
        
        {/* Holographic Glowing Ring Grids */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-80 w-80 rounded-full border border-cyan-500/20 animate-pulse opacity-40" />
          <div className="h-64 w-64 rounded-full border border-cyan-500/25" />
          <div className="h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {/* Anatomical Silhouette SVG */}
        <svg
          viewBox="0 0 240 400"
          className="h-[380px] w-auto transition-transform duration-700 ease-out drop-shadow-[0_0_25px_rgba(0,242,254,0.3)]"
          style={{
            transform: `rotateY(${rotationAngle}deg) scale(${zoomLevel})`
          }}
        >
          <defs>
            <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0E2346" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#123363" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#08152B" stopOpacity="0.95" />
            </linearGradient>
            <filter id="organGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Futuristic Head */}
          <path
            d="M120,22 C104,22 94,36 94,54 C94,74 104,86 120,86 C136,86 146,74 146,54 C146,36 136,22 120,22 Z"
            fill="url(#holoGradient)"
            stroke="#00F2FE"
            strokeWidth="1.8"
          />

          {/* Torso & Arms Mesh */}
          <path
            d="M94,76 L78,96 L62,152 L58,222 L72,226 L82,168 L92,192 L92,242 L148,242 L148,192 L158,168 L168,226 L182,222 L178,152 L162,96 L146,76 Z"
            fill="url(#holoGradient)"
            stroke="#00F2FE"
            strokeWidth="1.8"
          />

          {/* Legs */}
          <path
            d="M92,242 L82,322 L76,384 L104,384 L114,312 L120,262 L126,312 L136,384 L164,384 L158,322 L148,242 Z"
            fill="url(#holoGradient)"
            stroke="#00F2FE"
            strokeWidth="1.8"
          />

          {/* Neural & Vascular Holographic Grid Lines */}
          <line x1="120" y1="54" x2="120" y2="140" stroke="#00F2FE" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.8" />
          <line x1="120" y1="140" x2="105" y2="212" stroke="#00F2FE" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.8" />
          <line x1="120" y1="140" x2="135" y2="212" stroke="#00F2FE" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.8" />
          <line x1="92" y1="140" x2="148" y2="140" stroke="#00F2FE" strokeWidth="1.2" opacity="0.6" />

          {/* Interactive Organ Nodes */}
          {filteredOrgans.map((organ) => {
            const status = getOrganStatus(organ.id);
            const isSelected = selectedOrgan === organ.id;
            const svgX = (organ.cx / 100) * 240;
            const svgY = (organ.cy / 100) * 400;

            const fillColor = status === 'critical' ? '#F43F5E' : status === 'warning' ? '#F59E0B' : '#00F2FE';
            const strokeColor = status === 'critical' ? '#FDA4AF' : status === 'warning' ? '#FDE68A' : '#E0F2FE';

            return (
              <g
                key={organ.id}
                className="cursor-pointer group"
                onClick={() => onSelectOrgan(isSelected ? null : organ.id)}
              >
                {/* Outer Pulsing Glow Ring */}
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={isSelected ? 16 : 11}
                  fill={fillColor}
                  opacity={isSelected ? 0.45 : 0.2}
                  className="animate-pulse"
                />

                {/* Organ Core Circle */}
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={isSelected ? 10 : 7}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : 2}
                  filter="url(#organGlow)"
                />

                {/* Organ Label Tag */}
                <text
                  x={svgX > 120 ? svgX + 14 : svgX - 14}
                  y={svgY + 4}
                  textAnchor={svgX > 120 ? 'start' : 'end'}
                  fill={isSelected ? '#00F2FE' : '#F1F5F9'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  {organ.id.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Organ Inspector Card */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-3.5 shadow-xl">
        {selectedOrgan ? (
          (() => {
            const organ = organNodes.find(o => o.id === selectedOrgan);
            if (!organ) return null;
            const status = getOrganStatus(organ.id);
            return (
              <div className="flex flex-col gap-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    {organ.name}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono ${
                    status === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.4)]' :
                    status === 'warning' ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-[0_0_10px_rgba(245,158,11,0.4)]' :
                    'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_10px_rgba(0,242,254,0.4)]'
                  }`}>
                    ● {status}
                  </span>
                </div>
                <div className="text-xs text-slate-200">
                  <strong>Pathology:</strong> {organ.primaryCondition}
                </div>
                <div className="text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span><strong>CARMA Target:</strong> {organ.guidelineTarget}</span>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-xs text-slate-300 text-center flex items-center justify-center gap-2 py-1 font-medium">
            <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Click any illuminated anatomical organ node to filter CARMA evidence</span>
          </div>
        )}
      </div>

    </div>
  );
};
