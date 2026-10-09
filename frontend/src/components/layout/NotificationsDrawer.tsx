import React, { useState } from 'react';
import { 
  Bell, X, CheckCheck, AlertTriangle, ShieldAlert, 
  Activity, Clock, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (actionKey: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AI_ALERTS' | 'PATIENTS' | 'SYSTEM'>('ALL');

  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      category: 'AI_ALERTS',
      title: 'Longitudinal Reversal Risk Alert',
      desc: 'Deep Survival engine flagged Aspirin 1° Prevention protocol for Eleanor Vance (Reversal Hazard: 0.68).',
      time: '12m ago',
      unread: true,
      severity: 'WARNING',
      actionKey: 'warn_aspirin'
    },
    {
      id: 2,
      category: 'AI_ALERTS',
      title: 'CYP2C19 Pharmacogenomic Breach',
      desc: 'Critical loss-of-function allele detected for Marcus Sterling (*2/*2 poor metabolizer). Case routed to Senior Reviewer.',
      time: '35m ago',
      unread: true,
      severity: 'CRITICAL',
      actionKey: 'escalate_pgx'
    },
    {
      id: 3,
      category: 'PATIENTS',
      title: 'Missing Biomarker Detected',
      desc: 'CARMA halted statin initiation reasoning for Arthur Vance pending LDL cholesterol lab confirmation.',
      time: '1h ago',
      unread: false,
      severity: 'INFO',
      actionKey: 'retrieve_ldl'
    },
    {
      id: 4,
      category: 'SYSTEM',
      title: 'SHA-256 Audit Chain Verified',
      desc: 'Institutional compliance audit successfully validated 42 consecutive cryptographic event records.',
      time: '2h ago',
      unread: false,
      severity: 'SUCCESS'
    },
    {
      id: 5,
      category: 'PATIENTS',
      title: '07:00 AM Census Ready',
      desc: 'Morning pre-rounding summary compiled for 3 patients in ICU West & Step-Down telemetry ward.',
      time: '3h ago',
      unread: false,
      severity: 'INFO'
    }
  ];

  const filtered = notifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    return n.category === activeFilter;
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[420px] bg-[#0E1626] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0B1325]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Clinical Notifications</h2>
              <p className="text-[10px] text-slate-400 font-mono">ConsiliumMD Clinical Dispatch Center</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-[#0B1325]/50 overflow-x-auto">
          {(['ALL', 'AI_ALERTS', 'PATIENTS', 'SYSTEM'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === f 
                  ? 'bg-sky-600/20 text-sky-300 font-bold border border-sky-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f === 'AI_ALERTS' ? 'AI Alerts' : f === 'PATIENTS' ? 'Patients' : f === 'SYSTEM' ? 'System' : 'All'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => {
                if (item.actionKey && onSelectAction) {
                  onSelectAction(item.actionKey);
                  onClose();
                }
              }}
              className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1.5 ${
                item.unread
                  ? 'bg-slate-900/90 border-sky-500/30 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              } ${item.actionKey ? 'cursor-pointer hover:bg-slate-800/60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    item.severity === 'CRITICAL' ? 'bg-rose-500' :
                    item.severity === 'WARNING' ? 'bg-amber-500' :
                    item.severity === 'SUCCESS' ? 'bg-emerald-400' : 'bg-sky-400'
                  }`} />
                  <span className="text-xs font-bold text-white">{item.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>

              {item.actionKey && (
                <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 pt-1">
                  <span>Evaluate Case in CARMA</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-[#0B1325] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>All critical logs synced</span>
          </span>
          <button onClick={onClose} className="text-sky-400 hover:underline">
            Dismiss
          </button>
        </div>

      </div>
    </>
  );
};
