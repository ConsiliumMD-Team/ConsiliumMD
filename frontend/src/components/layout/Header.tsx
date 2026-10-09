import React, { useState, useEffect } from 'react';
import { 
  Menu, Search, Bell, HelpCircle, ChevronDown, 
  FlaskConical, Clock, Cpu, Activity, User, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import { api } from '../../api/client';

interface HeaderProps {
  currentTab: string;
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenMorningHuddle: () => void;
  onSelectPresetCase?: (caseKey: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenMorningHuddle,
  onSelectPresetCase
}) => {
  const { user } = useAuth();
  const { patients, activePatient, selectPatientById } = usePatient();
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [vram, setVram] = useState({ current_usage_mb: 4824, vram_limit_mb: 6144, utilization_percent: 78.5, loaded_model: 'CARMA_LLM' });

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
    const interval = setInterval(fetchVram, 10000);
    return () => clearInterval(interval);
  }, []);

  const demoPresets = [
    { key: 'elicit_statin', title: 'Elderly Statin Debate (RPD Divergence)', state: 'ELICIT', desc: '82yo patient trade-off: Longevity vs QoL' },
    { key: 'warn_aspirin', title: 'Primary Prevention Aspirin (Fragility)', state: 'WARN', desc: 'High Reversal Risk trial flag (ASPREE/ARRIVE)' },
    { key: 'escalate_pgx', title: 'CYP2C19 Clopidogrel Breach (ECL Collapse)', state: 'ESCALATE', desc: 'Non-identifiable bounds routed to Senior Reviewer' },
    { key: 'retrieve_ldl', title: 'Missing LDL-C Parameter (Epistemic Gap)', state: 'RETRIEVE', desc: 'Dynamic dual-input unblock workflow' },
    { key: 'answer_sglt2', title: 'SGLT2i Renoprotection (Consensus)', state: 'ANSWER', desc: 'KDIGO 2024 Level A RCT consensus' }
  ];

  const getPageTitle = () => {
    switch (currentTab) {
      case 'workspace': return 'Clinical Decision Workspace';
      case 'patients': return 'Patient Directory & Health Records';
      case 'consultations': return 'Consultations & SOAP Documentation';
      case 'imaging': return 'Multimodal Radiology & Laboratory';
      case 'radar': return 'Institutional Reversal Radar';
      case 'audit': return 'Cryptographic Audit Trail (SHA-256)';
      case 'ecl': return 'ECL Graph Conflict Adjudication';
      case 'pgx': return 'Pharmacogenomics Safety Bounds';
      case 'users': return 'Staff Credentials & RBAC Matrix';
      case 'beds': return 'Bedside Telemetry & IoMT Monitor';
      case 'roster': return 'Shift Handover & Patient Census';
      case 'settings': return 'Clinical Practice Protocols';
      default: return 'Clinical Overview Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-800 bg-[#0B1325]/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md shadow-md">
      
      {/* Left Section: Mobile menu button & Page Title & Patient selector */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onOpenMobileSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {getPageTitle()}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>ConsiliumMD</span>
            <span>•</span>
            <span className="text-sky-400 font-sans font-semibold">CARMA Engine v1.0</span>
          </div>
        </div>

        {/* Patient Switcher Pill (for Doctor / Clinical views) */}
        {activePatient && (
          <div className="relative ml-2 hidden sm:block">
            <button
              onClick={() => {
                setShowPatientDropdown(!showPatientDropdown);
                setShowPresetsDropdown(false);
              }}
              className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-slate-100 hover:border-sky-500/60 hover:bg-slate-800 transition-all shadow-sm"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
              <span className="font-bold text-white truncate max-w-[140px]">{activePatient.full_name}</span>
              <span className="text-xs text-sky-400 font-mono font-bold">({activePatient.mrn})</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showPatientDropdown && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-950 p-2.5 shadow-2xl z-50 animate-in fade-in">
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between font-mono">
                  <span>MIMIC-IV Cohort</span>
                  <span className="text-sky-400">{patients.length} Active</span>
                </div>
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectPatientById(p.id);
                      setShowPatientDropdown(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors mt-1 ${
                      activePatient?.id === p.id ? 'bg-sky-600/25 text-sky-200 font-bold border border-sky-500/40' : 'text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{p.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.mrn} • Age {p.age} • {p.gender}</div>
                    </div>
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-200 font-bold border border-slate-700">
                      {p.room_number}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center / Search Trigger Button */}
      <div className="hidden md:flex items-center">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 rounded-xl border border-slate-700/90 bg-slate-900/90 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-all w-72 lg:w-96 justify-between shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="truncate">Search patients, EHR, actions...</span>
          </div>
          <kbd className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        
        {/* CARMA 5-State Presets Dropdown */}
        {onSelectPresetCase && (
          <div className="relative">
            <button
              onClick={() => {
                setShowPresetsDropdown(!showPresetsDropdown);
                setShowPatientDropdown(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/15 px-3.5 py-2 text-sm font-bold text-purple-300 hover:bg-purple-500/25 transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
            >
              <FlaskConical className="h-4 w-4 text-purple-400" />
              <span className="hidden sm:inline">5-State Presets</span>
              <ChevronDown className="h-4 w-4 text-purple-400" />
            </button>

            {showPresetsDropdown && (
              <div className="absolute right-0 mt-2 w-88 rounded-2xl border border-purple-500/40 bg-slate-950 p-2.5 shadow-2xl z-50 animate-in fade-in">
                <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800 font-mono">
                  Instant CARMA State Evaluation
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
                    <div className="font-bold text-white flex items-center justify-between text-sm">
                      <span className="truncate pr-2">{preset.title}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                        preset.state === 'ELICIT' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        preset.state === 'WARN' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        preset.state === 'ESCALATE' ? 'bg-red-950 text-red-300 border border-red-800' :
                        preset.state === 'RETRIEVE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {preset.state}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">{preset.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Morning Huddle Trigger */}
        <button
          onClick={onOpenMorningHuddle}
          className="hidden xl:flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-sm font-bold text-amber-300 hover:bg-amber-500/25 transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
        >
          <Clock className="h-4 w-4 text-amber-400" />
          <span>07:00 AM Census</span>
        </button>

        {/* VRAM Meter Badge */}
        <div className="hidden lg:flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 font-mono">
          <Cpu className="h-4 w-4 text-sky-400" />
          <span className="font-bold">{vram.utilization_percent}% VRAM</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-[#0B1325]" />
        </button>

      </div>
    </header>
  );
};
