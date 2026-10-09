import React, { useState, useEffect } from 'react';
import { 
  Search, Users, Activity, FileText, FlaskConical, 
  Stethoscope, Clock, ShieldCheck, X, ArrowRight, UserCheck
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onSelectPresetCase?: (caseKey: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectPresetCase
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { patients, selectPatientById } = usePatient();
  const { switchRoleDemo } = useAuth();

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Clinical Decision Workspace (CARMA)', category: 'Navigation', icon: Stethoscope, action: () => { onSelectTab('workspace'); onClose(); } },
    { label: 'Patient Directory & Profiles', category: 'Navigation', icon: Users, action: () => { onSelectTab('patients'); onClose(); } },
    { label: 'Consultation Notes & SOAP Generator', category: 'Documentation', icon: FileText, action: () => { onSelectTab('consultations'); onClose(); } },
    { label: 'Multimodal Radiology & Lab Reports', category: 'Imaging', icon: Activity, action: () => { onSelectTab('imaging'); onClose(); } },
    { label: '07:00 AM Morning Census Rounding', category: 'Census', icon: Clock, action: () => { onSelectTab('census'); onClose(); } },
    
    // CARMA Presets
    { label: 'Evaluate: Elderly Statin Initiation (ELICIT)', category: 'CARMA Presets', icon: FlaskConical, action: () => { onSelectPresetCase?.('elicit_statin'); onClose(); } },
    { label: 'Evaluate: Primary Prevention Aspirin (WARN)', category: 'CARMA Presets', icon: FlaskConical, action: () => { onSelectPresetCase?.('warn_aspirin'); onClose(); } },
    { label: 'Evaluate: CYP2C19 Clopidogrel Escalation (ESCALATE)', category: 'CARMA Presets', icon: FlaskConical, action: () => { onSelectPresetCase?.('escalate_pgx'); onClose(); } },
    { label: 'Evaluate: Missing LDL-C Epistemic Gap (RETRIEVE)', category: 'CARMA Presets', icon: FlaskConical, action: () => { onSelectPresetCase?.('retrieve_ldl'); onClose(); } },
    { label: 'Evaluate: SGLT2i Cardiorenal Consensus (ANSWER)', category: 'CARMA Presets', icon: FlaskConical, action: () => { onSelectPresetCase?.('answer_sglt2'); onClose(); } },

    // Role Switchers
    { label: 'Switch Role: Senior Clinician Reviewer', category: 'RBAC', icon: UserCheck, action: () => { switchRoleDemo('reviewer'); onSelectTab('dashboard'); onClose(); } },
    { label: 'Switch Role: Admin & Compliance Officer', category: 'RBAC', icon: ShieldCheck, action: () => { switchRoleDemo('admin'); onSelectTab('dashboard'); onClose(); } },
    { label: 'Switch Role: Nurse / Ward Telemetry', category: 'RBAC', icon: Activity, action: () => { switchRoleDemo('nurse'); onSelectTab('dashboard'); onClose(); } }
  ];

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.conditions?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredActions = quickActions.filter(a => 
    a.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0E1626] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-[#0B1325]">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, patient name, MRN, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-4 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Matching Patients Section */}
          {filteredPatients.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Patients ({filteredPatients.length})
              </div>
              <div className="space-y-1">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectPatientById(p.id);
                      onSelectTab('workspace');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-800/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs border border-sky-500/20">
                        {p.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-sky-400">
                          {p.full_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.mrn} • Age {p.age} • {p.room_number} • {p.conditions?.[0] || 'Cardiometabolic'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions & Navigation */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Commands & Presets ({filteredActions.length})
              </div>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={action.action}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-800/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                            {action.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {action.category}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredPatients.length === 0 && filteredActions.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">
              No matching patients or commands found.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-[#0B1325] text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigation: <kbd className="px-1 rounded bg-slate-800 border border-slate-700">↑</kbd> <kbd className="px-1 rounded bg-slate-800 border border-slate-700">↓</kbd></span>
            <span>Select: <kbd className="px-1 rounded bg-slate-800 border border-slate-700">Enter</kbd></span>
          </div>
          <span>ConsiliumMD Command Palette</span>
        </div>
      </div>
    </div>
  );
};
