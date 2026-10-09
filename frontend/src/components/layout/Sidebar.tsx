import React, { useState } from 'react';
import { 
  Activity, LayoutDashboard, Users, FileText, Stethoscope, 
  Layers, ShieldCheck, Clock, Settings, ChevronLeft, ChevronRight, 
  LogOut, UserCheck, AlertTriangle, Radar, Sparkles, HeartPulse,
  Brain, FileImage, ShieldAlert, Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenMorningHuddle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenMorningHuddle
}) => {
  const { user, switchRoleDemo, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const currentRole = user?.role || 'doctor';

  // Role-specific navigation items
  const getNavItems = () => {
    switch (currentRole) {
      case 'reviewer':
        return [
          { id: 'dashboard', label: 'Escalation Board', icon: ShieldAlert, badge: 'Critical' },
          { id: 'ecl', label: 'ECL Graph Collapse', icon: Layers },
          { id: 'pgx', label: 'PGx Safety Bounds', icon: Brain },
          { id: 'audit', label: 'Adjudication Log', icon: FileText },
          { id: 'settings', label: 'Protocols', icon: Settings }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Compliance Overview', icon: LayoutDashboard },
          { id: 'radar', label: 'Reversal Radar', icon: Radar, badge: 'Live' },
          { id: 'audit', label: 'SHA-256 Audit Trail', icon: ShieldCheck },
          { id: 'users', label: 'Staff & RBAC Matrix', icon: Users },
          { id: 'settings', label: 'System Settings', icon: Settings }
        ];
      case 'nurse':
        return [
          { id: 'dashboard', label: 'Ward Telemetry', icon: HeartPulse, badge: '1Hz' },
          { id: 'beds', label: 'Bedside Vitals', icon: Activity },
          { id: 'roster', label: 'Shift Roster', icon: Users },
          { id: 'settings', label: 'Monitor Config', icon: Settings }
        ];
      case 'doctor':
      default:
        return [
          { id: 'workspace', label: 'Clinical Workspace', icon: Stethoscope, badge: 'CARMA' },
          { id: 'patients', label: 'Patients & EHR', icon: Users },
          { id: 'consultations', label: 'Notes & SOAP', icon: FileText },
          { id: 'imaging', label: 'Imaging & Labs', icon: FileImage },
          { id: 'census', label: '07:00 AM Census', icon: Clock },
          { id: 'settings', label: 'Guidelines & Config', icon: Settings }
        ];
    }
  };

  const navItems = getNavItems();

  const roleLabels: Record<UserRole, { title: string; subtitle: string; color: string; bg: string }> = {
    doctor: { title: 'Attending Physician', subtitle: 'Dr. Arthur Vance', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/25' },
    reviewer: { title: 'Senior Reviewer', subtitle: 'Prof. Marcus Webb', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25' },
    admin: { title: 'Compliance Officer', subtitle: 'Sarah Jenkins, JD', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' },
    nurse: { title: 'ICU Ward Specialist', subtitle: 'David Kim, BSN', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25' }
  };

  const currentRoleInfo = roleLabels[currentRole];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B1325] border-r border-slate-800 transition-all duration-300 ease-in-out select-none shadow-xl
          ${isCollapsed ? 'w-[76px]' : 'w-[270px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md">
              <Activity className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-base font-extrabold tracking-tight text-white font-mono">
                  CONSILIUM<span className="text-sky-400">MD</span>
                </span>
                <span className="text-xs text-slate-400 font-medium truncate">
                  Clinical Decision Engine
                </span>
              </div>
            )}
          </div>

          {/* Collapse toggle (Desktop only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            {!isCollapsed ? 'Clinical Navigation' : '•'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'census' && onOpenMorningHuddle) {
                    onOpenMorningHuddle();
                  } else {
                    onSelectTab(item.id);
                  }
                  onCloseMobile();
                }}
                className={`group relative flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 font-bold shadow-md'
                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left text-sm">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                    isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 hidden rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:flex items-center gap-2 whitespace-nowrap z-50">
                    <span>{item.label}</span>
                    {item.badge && <span className="text-[10px] font-mono text-sky-400">({item.badge})</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Role Switcher Section */}
        <div className="p-3 border-t border-slate-800 bg-[#0B1325]">
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all border ${currentRoleInfo.bg} hover:border-slate-600`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700">
                <UserCheck className="h-5 w-5 text-sky-400" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{user?.full_name || currentRoleInfo.subtitle}</div>
                  <div className={`text-xs font-semibold truncate ${currentRoleInfo.color}`}>{currentRoleInfo.title}</div>
                </div>
              )}
            </button>

            {/* Role Persona Popover */}
            {showRoleMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in">
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
                  Switch Active Persona
                </div>
                {(['doctor', 'reviewer', 'admin', 'nurse'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRoleDemo(r);
                      setShowRoleMenu(false);
                      onSelectTab(r === 'doctor' ? 'workspace' : 'dashboard');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-left transition-colors mt-1 ${
                      currentRole === r ? 'bg-sky-600/25 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="capitalize">{r === 'reviewer' ? 'Senior Reviewer' : r === 'admin' ? 'Admin Compliance' : r}</span>
                    {currentRole === r && <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38BDF8]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
