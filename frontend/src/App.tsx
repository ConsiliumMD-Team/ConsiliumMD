import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PatientProvider, usePatient } from './context/PatientContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/layout/CommandPalette';
import { NotificationsDrawer } from './components/layout/NotificationsDrawer';
import { DoctorDashboard } from './components/dashboard/DoctorDashboard';
import { ReviewerDashboard } from './components/dashboard/ReviewerDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { NurseDashboard } from './components/dashboard/NurseDashboard';
import { MorningHuddleDrawer } from './components/workflows/MorningHuddleDrawer';
import { LiveTelemetryTick } from './types';
import { api } from './api/client';

const DashboardContent: React.FC = () => {
  const { user, switchRoleDemo } = useAuth();
  const { patients, activePatient, setActivePatient, activeCase, setActiveCase, refreshPatients } = usePatient();
  
  // Navigation & Layout state
  const [currentTab, setCurrentTab] = useState<string>('workspace');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMorningHuddleOpen, setIsMorningHuddleOpen] = useState<boolean>(false);
  const [liveTelemetry, setLiveTelemetry] = useState<LiveTelemetryTick | null>(null);

  // Synchronize default tab on role switch
  useEffect(() => {
    if (user?.role === 'doctor') {
      setCurrentTab('workspace');
    } else {
      setCurrentTab('dashboard');
    }
  }, [user?.role]);

  // Live IoMT Telemetry Streamer Simulation / WebSocket
  useEffect(() => {
    if (!activePatient) return;

    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      ws = new WebSocket(`${protocol}//${host}/api/v1/telemetry/ws/${activePatient.id}`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLiveTelemetry(data);
        } catch (e) {
          // ignore
        }
      };

      ws.onerror = () => {
        startFallbackInterval();
      };
    } catch (e) {
      startFallbackInterval();
    }

    function startFallbackInterval() {
      if (fallbackInterval) clearInterval(fallbackInterval);
      fallbackInterval = setInterval(() => {
        const t = Date.now() / 1000;
        const hr = Math.round(76 + Math.sin(t * 0.8) * 3);
        const spo2 = Math.round(98 + Math.sin(t * 0.2) * 0.5);
        setLiveTelemetry({
          patient_id: activePatient ? activePatient.id : 1,
          timestamp: t,
          heart_rate: hr,
          spo2: spo2,
          bp_systolic: 128,
          bp_diastolic: 78,
          respiratory_rate: 16,
          temp_c: 37.0,
          is_breach: false,
          ecg_sample: [0.1, 0.2, 0.9, -0.4, 0.1, 0.0]
        });
      }, 1000);
    }

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [activePatient?.id]);

  // Fast 1-Click Preset Case Loader Handler
  const handleSelectPresetCase = async (presetKey: string) => {
    if (!patients || patients.length === 0) return;

    // Ensure doctor workspace is active
    if (user?.role !== 'doctor') {
      switchRoleDemo('doctor');
    }
    setCurrentTab('workspace');

    let targetPatient = patients[0];
    let queryTitle = '';
    let queryText = '';

    if (presetKey === 'elicit_statin') {
      targetPatient = patients.find(p => p.age >= 75) || patients[0];
      queryTitle = 'Elderly Statin Initiation in CKD';
      queryText = '82-year-old with CKD stage 3b and LDL 142 mg/dL. Evaluate high-intensity statin initiation weighing 5-year ASCVD reduction against statin myopathy and QoL trade-offs.';
    } else if (presetKey === 'warn_aspirin') {
      targetPatient = patients[0];
      queryTitle = 'Primary Prevention Aspirin Evaluation';
      queryText = 'Initiate daily low-dose aspirin 81mg for primary prevention of cardiovascular disease in a 74-year-old with moderate ASCVD risk score.';
    } else if (presetKey === 'escalate_pgx') {
      targetPatient = patients.find(p => p.id === 2 || p.genomics?.cyp2c19) || patients[1] || patients[0];
      queryTitle = 'CYP2C19 Clopidogrel DAPT Protocol';
      queryText = 'Prescribe standard dual antiplatelet therapy (DAPT) with Clopidogrel 75mg daily post drug-eluting stent placement.';
    } else if (presetKey === 'retrieve_ldl') {
      targetPatient = patients[0];
      queryTitle = 'Missing Biomarker Risk Triage';
      queryText = 'Assess statin eligibility and lipid management protocol without complete lipid profile.';
    } else if (presetKey === 'answer_sglt2') {
      targetPatient = patients.find(p => p.id === 2) || patients[0];
      queryTitle = 'SGLT2i Renoprotection Consensus';
      queryText = 'Evaluate Dapagliflozin 10mg initiation for cardiorenal protection in T2D with eGFR 42 mL/min.';
    }

    if (targetPatient.id !== activePatient?.id) {
      setActivePatient(targetPatient);
    }

    try {
      const evaluatedCase = await api.analyzeQuery(targetPatient.id, queryTitle, queryText);
      setActiveCase(evaluatedCase);
      await refreshPatients();
    } catch (e: any) {
      console.error('Failed to run preset evaluation', e);
    }
  };

  const currentRole = user?.role || 'doctor';

  return (
    <div className="min-h-screen bg-[#080D1A] text-slate-100 flex font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenMorningHuddle={() => setIsMorningHuddleOpen(true)}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenMorningHuddle={() => setIsMorningHuddleOpen(true)}
          onSelectPresetCase={handleSelectPresetCase}
        />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentRole === 'doctor' && (
            <DoctorDashboard 
              currentTab={currentTab} 
              onSelectTab={setCurrentTab}
              liveTelemetry={liveTelemetry} 
            />
          )}
          {currentRole === 'reviewer' && (
            <ReviewerDashboard 
              currentTab={currentTab} 
              onSelectTab={setCurrentTab}
            />
          )}
          {currentRole === 'admin' && (
            <AdminDashboard 
              currentTab={currentTab} 
              onSelectTab={setCurrentTab}
            />
          )}
          {currentRole === 'nurse' && (
            <NurseDashboard 
              currentTab={currentTab} 
              onSelectTab={setCurrentTab}
              liveTelemetry={liveTelemetry} 
            />
          )}
        </main>

        {/* Global Drawers & Modals */}
        <MorningHuddleDrawer
          isOpen={isMorningHuddleOpen}
          onClose={() => setIsMorningHuddleOpen(false)}
        />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onSelectPresetCase={handleSelectPresetCase}
        />

        <NotificationsDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onSelectAction={(actionKey) => handleSelectPresetCase(actionKey)}
        />

        {/* Clean, Subtle Medical Footer */}
        <footer className="border-t border-slate-800/80 bg-[#0B1325] py-3.5 px-6 text-center text-xs text-slate-400 font-mono flex flex-wrap items-center justify-between gap-2">
          <span>ConsiliumMD Clinical Decision Support Platform • CARMA Engine v1.0.0</span>
          <span>HIPAA / GDPR Compliant • SHA-256 Audit Trail Active</span>
        </footer>

      </div>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PatientProvider>
        <DashboardContent />
      </PatientProvider>
    </AuthProvider>
  );
};

export default App;
