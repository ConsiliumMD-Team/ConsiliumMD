import React, { useEffect, useRef } from 'react';
import { 
  Heart, Droplets, Activity, FileText, Upload, Sparkles, 
  Dna, AlertCircle, ShieldAlert, CheckCircle2, Eye, FileSpreadsheet,
  TrendingUp, Pill, Zap, Waves
} from 'lucide-react';
import { Patient, LiveTelemetryTick } from '../../types';

interface PatientDataCanvasProps {
  patient: Patient;
  liveVitals?: LiveTelemetryTick | null;
  onOpenDicomUpload: () => void;
  onOpenDocUpload: () => void;
  onOpenDicomViewer: () => void;
  onSelectOrganFilter: (organ: string | null) => void;
  selectedOrgan: string | null;
}

export const PatientDataCanvas: React.FC<PatientDataCanvasProps> = ({
  patient,
  liveVitals,
  onOpenDicomUpload,
  onOpenDocUpload,
  onOpenDicomViewer,
  onSelectOrganFilter,
  selectedOrgan
}) => {
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const hr = liveVitals?.heart_rate ?? patient.vitals?.heart_rate ?? 82;
  const spo2 = liveVitals?.spo2 ?? patient.vitals?.spo2 ?? 96.5;
  const sbp = liveVitals?.bp_systolic ?? patient.vitals?.bp_systolic ?? 142;
  const dbp = liveVitals?.bp_diastolic ?? patient.vitals?.bp_diastolic ?? 88;
  const rr = liveVitals?.respiratory_rate ?? patient.vitals?.respiratory_rate ?? 18;

  // Real-time Canvas ECG Lead-II Trace Renderer
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;
    const width = canvas.width;
    const height = canvas.height;

    // ECG signal generator (P-Q-R-S-T wave model)
    const getEcgPoint = (x: number) => {
      const cycle = (x % 140) / 140; // 140px per cardiac cycle
      const baseline = height / 2;
      
      // P wave (at 0.15)
      if (cycle > 0.12 && cycle < 0.20) {
        return baseline - Math.sin((cycle - 0.12) / 0.08 * Math.PI) * 9;
      }
      // Q wave (at 0.28)
      if (cycle >= 0.26 && cycle < 0.30) {
        return baseline + (cycle - 0.26) / 0.04 * 6;
      }
      // R wave spike (at 0.32)
      if (cycle >= 0.30 && cycle < 0.34) {
        return baseline - (1 - Math.abs(cycle - 0.32) / 0.02) * 32;
      }
      // S wave dip (at 0.35)
      if (cycle >= 0.34 && cycle < 0.38) {
        return baseline + (1 - Math.abs(cycle - 0.36) / 0.02) * 11;
      }
      // T wave (at 0.55)
      if (cycle > 0.48 && cycle < 0.65) {
        return baseline - Math.sin((cycle - 0.48) / 0.17 * Math.PI) * 14;
      }
      return baseline + (Math.random() - 0.5) * 1.5;
    };

    const drawEcg = () => {
      ctx.fillStyle = '#060B14';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw sweeping ECG trace
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const sweepX = (step * 2) % width;

      for (let x = 0; x < width; x += 2) {
        const y = getEcgPoint(x + step * 2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw sweeping cursor beacon
      ctx.fillStyle = '#34D399';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(sweepX, getEcgPoint(sweepX + step * 2), 4.5, 0, Math.PI * 2);
      ctx.fill();

      step += 1;
      animationFrameId = requestAnimationFrame(drawEcg);
    };

    drawEcg();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Mini Sparkline Renderer
  const renderSparkline = (data: number[], color: string) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 30 - ((val - min) / range) * 24;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="h-8 w-24 overflow-visible shrink-0" viewBox="0 0 100 30">
        <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Patient Master Card & ICU Vitals Cockpit */}
      <div className="card-surface p-6 sm:p-7 border border-slate-750 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 h-64 w-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600/30 to-teal-500/15 border-2 border-sky-400 text-sky-200 font-black text-2xl shadow-md shrink-0">
              {patient.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{patient.full_name}</h1>
                <span className="badge-success text-xs">
                  ● {patient.status}
                </span>
                <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs text-sky-300 font-mono font-bold border border-slate-700">
                  {patient.room_number}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200 mt-2 font-medium">
                <span className="font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                  <strong>MRN:</strong> {patient.mrn}
                </span>
                <span>•</span>
                <span><strong>Age:</strong> {patient.age} yrs</span>
                <span>•</span>
                <span><strong>Gender:</strong> {patient.gender}</span>
                <span>•</span>
                <span><strong>Blood Group:</strong> <strong className="text-rose-400">{patient.blood_type}</strong></span>
              </div>
            </div>
          </div>

          {/* Multimodal Action Hub Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenDicomViewer}
              className="btn-primary"
            >
              <Eye className="h-4 w-4 text-sky-200 animate-pulse" />
              <span>Interactive DICOM AI Viewer</span>
            </button>
            <button
              onClick={onOpenDicomUpload}
              className="btn-secondary"
            >
              <Upload className="h-4 w-4 text-sky-400" />
              <span>Upload Image (CXR/CT)</span>
            </button>
            <button
              onClick={onOpenDocUpload}
              className="btn-secondary"
            >
              <FileSpreadsheet className="h-4 w-4 text-teal-400" />
              <span>OCR PDF / Prescription</span>
            </button>
          </div>
        </div>

        {/* Live ICU Telemetry Waveform Ribbon */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Live ECG Waveform Monitor (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-emerald-500/40 bg-slate-950 p-3.5 flex flex-col justify-between shadow-inner relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold mb-1.5">
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> LEAD-II REAL-TIME ECG
              </span>
              <span>25mm/s • 10mm/mV</span>
            </div>
            
            <canvas ref={ecgCanvasRef} width={380} height={78} className="w-full h-[78px] rounded-lg" />
          </div>

          {/* Vitals Cards (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            {/* Heart Rate */}
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/25 p-3.5 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 uppercase font-mono">Heart Rate</span>
                <Heart className="h-4.5 w-4.5 text-rose-400 animate-heartbeat" />
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-black text-rose-400 font-mono">{hr}</span>
                <span className="text-xs text-rose-300 font-mono font-bold">BPM</span>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">Normal: 60-100</span>
            </div>

            {/* SpO2 */}
            <div className="rounded-2xl border border-sky-500/40 bg-sky-950/25 p-3.5 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 uppercase font-mono">SpO2 Oxygen</span>
                <Droplets className="h-4.5 w-4.5 text-sky-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className={`text-3xl font-black font-mono ${spo2 < 92 ? 'text-amber-400' : 'text-sky-300'}`}>{spo2}%</span>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">Target: &gt;95%</span>
            </div>

            {/* Blood Pressure */}
            <div className="rounded-2xl border border-purple-500/40 bg-purple-950/25 p-3.5 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase font-mono">NIBP BP</span>
                <Activity className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-2xl font-black text-purple-200 font-mono">{sbp}/{dbp}</span>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">mmHg</span>
            </div>

            {/* Respiratory Rate */}
            <div className="rounded-2xl border border-teal-500/40 bg-teal-950/25 p-3.5 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 uppercase font-mono">Respiration</span>
                <Waves className="h-4.5 w-4.5 text-teal-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-black text-teal-300 font-mono">{rr}</span>
                <span className="text-xs text-teal-300 font-mono font-bold">RPM</span>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">Target: 12-20</span>
            </div>

          </div>

        </div>

        {/* Real-time breach alert banner if telemetry breached */}
        {liveVitals?.is_breach && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-500 bg-rose-950/80 p-3.5 text-sm text-rose-100 font-bold animate-pulse shadow-lg">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
            <span>CRITICAL TELEMETRY BREACH: {liveVitals.breach_alert}</span>
          </div>
        )}
      </div>

      {/* Grid: Longitudinal Biomarkers & Active Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Longitudinal Labs & Sparklines (6 cols) */}
        <div className="lg:col-span-6 card-surface p-5 sm:p-6 flex flex-col justify-between shadow-xl border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Activity className="h-4.5 w-4.5 text-sky-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Longitudinal Biomarkers & Sparklines
                </h2>
              </div>
              <span className="text-xs text-slate-300 font-mono">Ref: CKD-EPI / Pooled Cohort</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* eGFR */}
              <div className="card-subtle p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold">eGFR (Renal)</div>
                  <div className="text-2xl font-black font-mono text-sky-300 mt-0.5">
                    {patient.lab_results?.egfr ?? '--'} <span className="text-xs font-normal text-slate-400">mL/min</span>
                  </div>
                  <span className="text-xs text-amber-400 font-bold font-mono">CKD Stage 3b</span>
                </div>
                {renderSparkline([48, 44, 41, 38, patient.lab_results?.egfr ?? 36], '#0EA5E9')}
              </div>

              {/* LDL Cholesterol */}
              <div className="card-subtle p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold">LDL-C (Lipid)</div>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-0.5">
                    {patient.lab_results?.ldl ?? '--'} <span className="text-xs font-normal text-slate-400">mg/dL</span>
                  </div>
                  <span className="text-xs text-amber-400 font-bold font-mono">Elevated</span>
                </div>
                {renderSparkline([165, 155, 148, 142, patient.lab_results?.ldl ?? 144], '#F59E0B')}
              </div>

              {/* Creatinine */}
              <div className="card-subtle p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Creatinine</div>
                  <div className="text-2xl font-black font-mono text-slate-100 mt-0.5">
                    {patient.lab_results?.creatinine ?? '--'} <span className="text-xs font-normal text-slate-400">mg/dL</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Ref: 0.7 - 1.3</span>
                </div>
                {renderSparkline([1.4, 1.5, 1.6, 1.8, patient.lab_results?.creatinine ?? 1.88], '#94A3B8')}
              </div>

              {/* Potassium */}
              <div className="card-subtle p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Serum K+</div>
                  <div className="text-2xl font-black font-mono text-emerald-300 mt-0.5">
                    {patient.lab_results?.potassium ?? '--'} <span className="text-xs font-normal text-slate-400">mEq/L</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold font-mono">Normal Range</span>
                </div>
                {renderSparkline([4.2, 4.4, 4.5, 4.6, patient.lab_results?.potassium ?? 4.7], '#10B981')}
              </div>
            </div>
          </div>

          {/* Pharmacogenomic Alleles Bar */}
          <div className="mt-4 rounded-2xl border border-purple-500/30 bg-purple-950/30 p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Dna className="h-4.5 w-4.5 text-purple-400" />
              <span className="text-xs sm:text-sm font-bold text-purple-200">CPIC Pharmacogenomic Phenotypes:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(patient.genomics || {}).map(([gene, status]) => (
                <span key={gene} className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-purple-900/80 text-purple-200 border border-purple-400/40 shadow-sm">
                  {gene}: {status}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Active Regimen & Chronic Conditions (6 cols) */}
        <div className="lg:col-span-6 card-surface p-5 sm:p-6 flex flex-col justify-between shadow-xl border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4.5 w-4.5 text-teal-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Clinical Regimen & Conditions
                </h2>
              </div>
              <span className="badge-info text-xs">
                {patient.medications?.length || 0} Prescriptions Active
              </span>
            </div>

            {/* Condition Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {patient.conditions?.map((cond, i) => (
                <span key={i} className="text-xs font-semibold rounded-xl bg-slate-800/90 text-slate-100 px-3 py-1.5 border border-slate-700">
                  {cond}
                </span>
              ))}
            </div>

            {/* Structured Medication Cards */}
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {patient.medications?.map((med, idx) => (
                <div key={idx} className="card-subtle p-3 flex flex-col justify-between hover:border-sky-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-sky-400" />
                      <span className="text-xs font-bold text-white truncate max-w-[100px]">{med.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-300 bg-sky-950 px-2 py-0.5 rounded-lg border border-sky-800">
                      {med.dose}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1.5 flex items-center justify-between font-mono">
                    <span>{med.freq || med.frequency || 'Daily'}</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allergies Bar */}
          <div className="mt-4 flex items-center gap-2.5 text-xs text-rose-200 bg-rose-950/40 border border-rose-500/40 rounded-2xl px-4 py-2.5 font-medium">
            <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
            <span><strong>Allergies:</strong> {patient.allergies?.join(', ') || 'No Known Drug Allergies (NKDA)'}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
