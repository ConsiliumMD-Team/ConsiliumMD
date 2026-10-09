import React from 'react';
import { Activity, Heart, Droplets, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { LiveTelemetryTick } from '../../types';

interface NurseDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  liveTelemetry?: LiveTelemetryTick | null;
}

export const NurseDashboard: React.FC<NurseDashboardProps> = ({ 
  currentTab = 'dashboard', 
  liveTelemetry 
}) => {
  const { patients, activePatient, selectPatientById } = usePatient();

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="card-surface p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">IoMT Telemetry Ward Central Monitor</h1>
            <p className="text-xs text-slate-400">
              Live multi-bed high-frequency vitals stream with automated CARMA edge-detection triggering.
            </p>
          </div>
        </div>
        <span className="badge-success font-mono flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          WEBSOCKET 1Hz LIVE
        </span>
      </div>

      {/* Multi-bed Ward Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {patients.map((p) => {
          const isActive = p.id === activePatient?.id;
          const hr = isActive && liveTelemetry ? liveTelemetry.heart_rate : p.vitals?.heart_rate || 76;
          const spo2 = isActive && liveTelemetry ? liveTelemetry.spo2 : p.vitals?.spo2 || 98;
          const sbp = isActive && liveTelemetry ? liveTelemetry.bp_systolic : p.vitals?.bp_systolic || 128;
          const dbp = isActive && liveTelemetry ? liveTelemetry.bp_diastolic : p.vitals?.bp_diastolic || 78;
          const isBreach = isActive && liveTelemetry?.is_breach;

          return (
            <div
              key={p.id}
              onClick={() => selectPatientById(p.id)}
              className={`cursor-pointer rounded-2xl p-4.5 transition-all duration-200 flex flex-col justify-between border ${
                isBreach
                  ? 'border-rose-500 bg-rose-950/30 shadow-md'
                  : isActive
                  ? 'bg-sky-600/10 border-sky-500 shadow-md'
                  : 'card-surface hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div>
                    <div className="text-sm font-bold text-white">{p.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.mrn} • Age {p.age}</div>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-sky-400 border border-slate-700">
                    {p.room_number}
                  </span>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="card-subtle p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">HEART RATE</div>
                      <div className="text-xl font-bold font-mono text-rose-400">{hr} <span className="text-[10px]">bpm</span></div>
                    </div>
                    <Heart className="h-5 w-5 text-rose-500 animate-heartbeat" />
                  </div>

                  <div className="card-subtle p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">SpO2</div>
                      <div className={`text-xl font-bold font-mono ${spo2 < 92 ? 'text-amber-400' : 'text-sky-400'}`}>
                        {spo2}%
                      </div>
                    </div>
                    <Droplets className="h-5 w-5 text-sky-400" />
                  </div>
                </div>

                {/* Blood pressure */}
                <div className="mt-2.5 card-subtle p-2.5 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">NIBP BP</div>
                  <div className="text-sm font-bold font-mono text-purple-300">{sbp}/{dbp} mmHg</div>
                </div>
              </div>

              {/* Edge trigger status */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] flex items-center justify-between font-mono">
                {isBreach ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> CARMA Evaluation Triggered
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Vitals Telemetry Normal
                  </span>
                )}
                <span className="text-slate-500">{isActive ? 'ACTIVE BED' : 'MONITORING'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
