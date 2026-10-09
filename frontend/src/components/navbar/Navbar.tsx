import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, Cpu, UserCheck, Stethoscope, 
  Layers, AlertTriangle, ChevronDown, Sparkles, Clock, 
  FlaskConical, CheckCircle2, Lock, Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import { UserRole } from '../../types';
import { api } from '../../api/client';

interface NavbarProps {
  onOpenMorningHuddle: () => void;
  onSelectPresetCase?: (caseKey: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMorningHuddle, onSelectPresetCase }) => {
  const { user, switchRoleDemo } = useAuth();
  const { patients, activePatient, selectPatientById } = usePatient();
  const [vram, setVram] = useState<{ current_usage_mb: number; vram_limit_mb: number; utilization_percent: number; loaded_model: string }>({
    current_usage_mb: 4824,
    vram_limit_mb: 6144,
    utilization_percent: 78.5,
    loaded_model: 'CARMA_LLM'
  });
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

  useEffect(() => {
    const fetchVram = async () => {
      try {
        const v = await api.getVramStatus();
        setVram(v);
      } catch (e) {
        // fallback
      }
    };
    fetchVram();
    const interval = setInterval(fetchVram, 8000);
    return () => clearInterval(interval);
  }, []);

  const roleColors: Record<UserRole, { bg: string; text: string; border: string; glow: string; badge: string }> = {
    doctor: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-400/60', glow: 'shadow-[0_0_20px_rgba(0,242,254,0.35)]', badge: 'DOCTOR / ATTENDING' },
    reviewer: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-400/60', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]', badge: 'SENIOR CLINICIAN REVIEWER' },
    admin: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-400/60', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]', badge: 'ADMIN & COMPLIANCE' },
    nurse: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-400/60', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]', badge: 'NURSE / ICU WARD' }
  };

  const currentRole = user?.role || 'doctor';
  const roleStyle = roleColors[currentRole];

  const demoPresets = [
    { key: 'elicit_statin', title: '⚖️ Elderly Statin Debate (RPD Divergence)', state: 'ELICIT', desc: '82yo patient trade-off: Longevity vs QoL' },
    { key: 'warn_aspirin', title: '⚠️ Primary Prevention Aspirin (Fragility)', state: 'WARN', desc: 'High Reversal Risk trial flag (ASPREE/ARRIVE)' },
    { key: 'escalate_pgx', title: '🚫 CYP2C19 Clopidogrel Breach (ECL Collapse)', state: 'ESCALATE', desc: 'Non-identifiable bounds routed to Senior Reviewer' },
    { key: 'retrieve_ldl', title: '🔍 Missing LDL-C Parameter (Epistemic Gap)', state: 'RETRIEVE', desc: 'Dynamic dual-input unblock workflow' },
    { key: 'answer_sglt2', title: '🛡️ SGLT2i Renoprotection (Consensus)', state: 'ANSWER', desc: 'KDIGO 2024 Level A RCT consensus' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700/80 bg-[#070D1A]/95 backdrop-blur-2xl shadow-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
        
        {/* Brand & CARMA CDS tag */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-[1.5px] shadow-[0_0_25px_rgba(0,242,254,0.5)]">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#070D1A]">
              <Activity className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                CONSILIUM<span className="text-cyan-400">MD</span>
              </span>
              <span className="rounded-lg bg-cyan-950 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 border border-cyan-500/50 tracking-wider shadow-[0_0_10px_rgba(0,242,254,0.25)] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                CARMA CDS v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium tracking-wide">
              Conflict-Aware Reasoning with Mathematical Assurance
            </p>
          </div>
        </div>

        {/* Center: Patient Switcher & Fast Demo Preset Loader */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Active Patient Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPatientDropdown(!showPatientDropdown);
                setShowPresetsDropdown(false);
                setShowRoleDropdown(false);
              }}
              className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 hover:border-cyan-400/60 hover:bg-slate-800 transition-all shadow-md"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              <span className="font-bold text-white">
                {activePatient ? `${activePatient.full_name}` : 'Select Patient'}
              </span>
              <span className="text-cyan-300 font-mono text-[11px] bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                {activePatient?.mrn}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showPatientDropdown && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between">
                  <span>MIMIC-IV Patient Cohort</span>
                  <span className="text-cyan-400 font-mono">3 Active</span>
                </div>
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectPatientById(p.id);
                      setShowPatientDropdown(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors mt-1 ${
                      activePatient?.id === p.id ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold' : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{p.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.mrn} • Age {p.age} • {p.gender}</div>
                    </div>
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 font-mono border border-slate-700">
                      {p.room_number}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Demo Preset Trigger */}
          {onSelectPresetCase && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowPresetsDropdown(!showPresetsDropdown);
                  setShowPatientDropdown(false);
                  setShowRoleDropdown(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/15 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/25 transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)]"
              >
                <FlaskConical className="h-4 w-4 text-purple-400" />
                <span>CARMA 5-State Presets</span>
                <ChevronDown className="h-3.5 w-3.5 text-purple-400" />
              </button>

              {showPresetsDropdown && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-purple-500/40 bg-slate-950 p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 border-b border-slate-800">
                    Instant 1-Click State Evaluation
                  </div>
                  {demoPresets.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => {
                        onSelectPresetCase(preset.key);
                        setShowPresetsDropdown(false);
                      }}
                      className="flex flex-col w-full text-left rounded-xl p-2.5 text-xs hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-all mt-1"
                    >
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{preset.title}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          preset.state === 'ELICIT' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          preset.state === 'WARN' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          preset.state === 'ESCALATE' ? 'bg-red-950 text-red-300 border border-red-800' :
                          preset.state === 'RETRIEVE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {preset.state}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Morning Huddle Pre-Rounding Census button */}
          <button
            onClick={onOpenMorningHuddle}
            className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>07:00 AM Huddle</span>
          </button>
        </div>

        {/* Right Section: VRAM Meter & Role Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Consumer GPU VRAM Orchestration Monitor */}
          <div className="hidden lg:flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2 text-xs shadow-md">
            <Cpu className="h-4 w-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300">
                <span>VRAM: <strong className="text-white">{vram.current_usage_mb}MB</strong> / {vram.vram_limit_mb}MB</span>
                <span className="text-cyan-400 font-bold">({vram.utilization_percent}%)</span>
              </div>
              <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-500 shadow-[0_0_8px_#00F2FE]" 
                  style={{ width: `${vram.utilization_percent}%` }}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-700/60 font-mono">
              {vram.loaded_model === 'CARMA_LLM' ? 'LLM ACTIVE' : 'VISION ACTIVE'}
            </span>
          </div>

          {/* RBAC Role Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowPatientDropdown(false);
                setShowPresetsDropdown(false);
              }}
              className={`flex items-center gap-2 rounded-xl border ${roleStyle.border} ${roleStyle.bg} px-3.5 py-2 text-xs font-bold ${roleStyle.text} ${roleStyle.glow} transition-all`}
            >
              <UserCheck className="h-4 w-4" />
              <span className="uppercase tracking-wider font-mono">{roleStyle.badge}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Switch Active Role Persona
                </div>
                {(['doctor', 'reviewer', 'admin', 'nurse'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRoleDemo(r);
                      setShowRoleDropdown(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors mt-1 ${
                      currentRole === r ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-bold' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="capitalize">{r === 'reviewer' ? 'Senior Reviewer' : r === 'admin' ? 'Admin / Compliance' : r}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {r === 'doctor' ? 'Clinical decision support & EHR' : r === 'reviewer' ? 'Dispute & ECL adjudication' : r === 'admin' ? 'Radar & cryptographic logs' : 'Live ward telemetry monitor'}
                      </div>
                    </div>
                    {currentRole === r && <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F2FE]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
