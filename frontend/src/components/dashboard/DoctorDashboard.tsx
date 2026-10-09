import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { api } from '../../api/client';
import { PatientDataCanvas } from '../multimodal/PatientDataCanvas';
import { DigitalTwin3D } from '../multimodal/DigitalTwin3D';
import { DicomViewerModal } from '../multimodal/DicomViewerModal';
import { DocumentUploadModal } from '../multimodal/DocumentUploadModal';
import { SmartDualInputForm } from '../carma/SmartDualInputForm';
import { CarmaDecisionPanel } from '../carma/CarmaDecisionPanel';
import { ConfidenceSpaceScatterplot } from '../carma/ConfidenceSpaceScatterplot';
import { DynamicArgumentFlowGraph } from '../carma/DynamicArgumentFlowGraph';
import { WhatIfCounterfactualBoard } from '../carma/WhatIfCounterfactualBoard';
import { CinematicReasoningReplay } from '../carma/CinematicReasoningReplay';
import { SoapNoteModal } from '../workflows/SoapNoteModal';
import { FhirExportModal } from '../workflows/FhirExportModal';
import { OverrideModal } from '../workflows/OverrideModal';
import { PatientDirectoryView } from '../views/PatientDirectoryView';
import { ConsultationsView } from '../views/ConsultationsView';
import { ImagingLabsView } from '../views/ImagingLabsView';
import { SettingsView } from '../views/SettingsView';
import { LiveTelemetryTick, Patient } from '../../types';
import { 
  Users, Activity, Sparkles, Stethoscope, 
  Clock, ShieldAlert, CheckCircle2, TrendingUp,
  Brain, FileText, ArrowUpRight
} from 'lucide-react';

interface DoctorDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  liveTelemetry?: LiveTelemetryTick | null;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ 
  currentTab = 'workspace',
  onSelectTab,
  liveTelemetry 
}) => {
  const { patients, activePatient, setActivePatient, activeCase, setActiveCase, refreshPatients } = usePatient();

  // Modals state
  const [isDicomViewerOpen, setIsDicomViewerOpen] = useState(false);
  const [isDicomUploadOpen, setIsDicomUploadOpen] = useState(false);
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);
  const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentPatient = activePatient || (patients && patients.length > 0 ? patients[0] : null);

  if (!currentPatient) {
    return (
      <div className="card-surface p-12 text-center text-slate-400 text-xs font-mono border border-slate-800">
        Initializing Clinical Decision Workspace...
      </div>
    );
  }

  const handleSubmitQuery = async (title: string, text: string) => {
    setIsLoading(true);
    try {
      const newCase = await api.analyzeQuery(currentPatient.id, title, text);
      setActiveCase(newCase);
      await refreshPatients();
    } catch (e: any) {
      alert(e.message || 'CARMA query analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveElicit = async (preferenceWeight: number) => {
    if (!activeCase) return;
    setIsLoading(true);
    try {
      const updated = await api.resolveElicit(activeCase.id, { longevity_vs_qol: preferenceWeight });
      setActiveCase(updated);
      await refreshPatients();
    } catch (e: any) {
      alert(e.message || 'Elicit resolution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveRetrieve = async (retrievedData: Record<string, any>) => {
    if (!activeCase) return;
    setIsLoading(true);
    try {
      const updated = await api.resolveRetrieve(activeCase.id, retrievedData);
      setActiveCase(updated);
      await refreshPatients();
    } catch (e: any) {
      alert(e.message || 'Retrieve resolution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledgeWarn = async (rationale?: string) => {
    if (!activeCase) return;
    setIsLoading(true);
    try {
      const updated = await api.acknowledgeWarn(activeCase.id, rationale);
      setActiveCase(updated);
      await refreshPatients();
    } catch (e: any) {
      alert(e.message || 'Warning acknowledgment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateUpdate = (simResult: any) => {
    if (activeCase) {
      setActiveCase({
        ...activeCase,
        routing_state: simResult.routing_state,
        rpd_score: simResult.rpd_score,
        reversal_hazard: simResult.reversal_hazard,
        confidence_score: simResult.confidence_score,
        carma_payload: {
          ...activeCase.carma_payload,
          routing_state: simResult.routing_state,
          rpd_score: simResult.rpd_score,
          reversal_hazard: simResult.reversal_hazard,
          recommendation: simResult.recommendation,
          confidence_space: simResult.confidence_space,
          argument_flow: simResult.argument_flow
        }
      });
    }
  };

  const handleSelectPatientToEvaluate = (p: Patient) => {
    setActivePatient(p);
    onSelectTab?.('workspace');
  };

  // If viewing secondary tabs:
  if (currentTab === 'patients') {
    return (
      <PatientDirectoryView
        onSelectPatientToEvaluate={handleSelectPatientToEvaluate}
        onOpenDicomViewer={() => setIsDicomViewerOpen(true)}
      />
    );
  }

  if (currentTab === 'consultations') {
    return (
      <ConsultationsView
        onOpenSoapModal={() => setIsSoapModalOpen(true)}
        onOpenFhirExport={() => setIsFhirModalOpen(true)}
        onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
      />
    );
  }

  if (currentTab === 'imaging') {
    return (
      <ImagingLabsView
        onOpenDicomViewer={() => setIsDicomViewerOpen(true)}
        onOpenDicomUpload={() => setIsDicomUploadOpen(true)}
        onOpenDocUpload={() => setIsDocUploadOpen(true)}
      />
    );
  }

  if (currentTab === 'settings') {
    return <SettingsView />;
  }

  // DEFAULT TAB: Clinical Decision Workspace (CARMA Engine Hub)
  return (
    <div className="flex flex-col gap-6">
      
      {/* Greeting Banner & KPI Summary Cards */}
      <div className="card-surface p-5 border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Good morning, Dr. Vance
            </h2>
            <p className="text-xs text-slate-400">
              Here's what's happening with your ICU and step-down clinical cohort today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-info font-mono">
              ICU Ward Active
            </span>
            <span className="badge-success font-mono">
              IoMT 1Hz Stream Online
            </span>
          </div>
        </div>

        {/* 4 Key Performance & Clinical Indicator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          
          <div className="card-subtle p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ACTIVE PATIENT</span>
              <Users className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-white truncate">{currentPatient.full_name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{currentPatient.mrn} • Room {currentPatient.room_number}</div>
            </div>
          </div>

          <div className="card-subtle p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>LIVE TELEMETRY</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {liveTelemetry?.heart_rate || currentPatient.vitals?.heart_rate || 76} bpm | {liveTelemetry?.spo2 || currentPatient.vitals?.spo2 || 98}% SpO2
              </div>
              <div className="text-[11px] text-slate-400 font-mono">BP: {currentPatient.vitals?.bp_systolic || 135}/{currentPatient.vitals?.bp_diastolic || 82} mmHg</div>
            </div>
          </div>

          <div className="card-subtle p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>CARMA ROUTING STATE</span>
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-sky-400 font-mono">
                {activeCase?.routing_state || 'READY FOR QUERY'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {activeCase ? `Hazard: ${activeCase.reversal_hazard.toFixed(2)} | RPD: ${activeCase.rpd_score.toFixed(2)}` : 'Awaiting clinical input'}
              </div>
            </div>
          </div>

          <div className="card-subtle p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>EVIDENCE ASSURANCE</span>
              <ShieldAlert className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-white font-mono">
                {activeCase ? `${((activeCase.confidence_score || 0.88) * 100).toFixed(0)}% Certainty` : 'Level-A RCT'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">ACC/AHA • KDIGO • NICE</div>
            </div>
          </div>

        </div>
      </div>

      {/* Top Section: Cinematic Patient Canvas */}
      <PatientDataCanvas
        patient={currentPatient}
        liveVitals={liveTelemetry}
        onOpenDicomUpload={() => setIsDicomUploadOpen(true)}
        onOpenDocUpload={() => setIsDocUploadOpen(true)}
        onOpenDicomViewer={() => setIsDicomViewerOpen(true)}
        onSelectOrganFilter={setSelectedOrgan}
        selectedOrgan={selectedOrgan}
      />

      {/* Main Grid: 3D Twin (Left) & CARMA Decision Support Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): 3D Digital Twin */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <DigitalTwin3D
            patient={currentPatient}
            selectedOrgan={selectedOrgan}
            onSelectOrgan={setSelectedOrgan}
          />
        </div>

        {/* Right Column (8 cols): CARMA Reasoning Hub */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Smart Dual-Input Form */}
          <SmartDualInputForm
            patient={currentPatient}
            onSubmitQuery={handleSubmitQuery}
            onResolveRetrieve={handleResolveRetrieve}
            missingVariables={activeCase?.carma_payload?.missing_variables}
            isRetrieving={activeCase?.routing_state === 'RETRIEVE'}
            isLoading={isLoading}
          />

          {/* CARMA 5-State Decision Panel (if active case exists) */}
          {activeCase && (
            <CarmaDecisionPanel
              caseData={activeCase}
              onResolveElicit={handleResolveElicit}
              onAcknowledgeWarn={handleAcknowledgeWarn}
              onOpenSoapModal={() => setIsSoapModalOpen(true)}
              onOpenFhirExport={() => setIsFhirModalOpen(true)}
              onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
              isLoading={isLoading}
            />
          )}

          {/* 2D Confidence Space & Dynamic Argument Flow Graph Side-by-Side */}
          {activeCase && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfidenceSpaceScatterplot
                currentHazard={activeCase.reversal_hazard}
                currentRpd={activeCase.rpd_score}
                currentState={activeCase.routing_state}
                historicalPoints={activeCase.carma_payload?.confidence_space?.historical_points}
              />
              <DynamicArgumentFlowGraph
                argumentFlow={activeCase.carma_payload?.argument_flow}
                currentState={activeCase.routing_state}
              />
            </div>
          )}

          {/* "What-If" Counterfactual Simulation Board */}
          <WhatIfCounterfactualBoard
            patient={currentPatient}
            baseCaseId={activeCase?.id}
            onSimulateUpdate={handleSimulateUpdate}
          />

          {/* Cinematic Reasoning Replay Sequence */}
          {activeCase && (
            <CinematicReasoningReplay
              steps={activeCase.carma_payload?.replay_steps}
            />
          )}

        </div>

      </div>

      {/* Modals */}
      <DicomViewerModal
        isOpen={isDicomViewerOpen}
        onClose={() => setIsDicomViewerOpen(false)}
      />

      <DocumentUploadModal
        isOpen={isDicomUploadOpen}
        onClose={() => setIsDicomUploadOpen(false)}
        uploadType="IMAGE"
      />

      <DocumentUploadModal
        isOpen={isDocUploadOpen}
        onClose={() => setIsDocUploadOpen(false)}
        uploadType="DOCUMENT"
      />

      <SoapNoteModal
        isOpen={isSoapModalOpen}
        onClose={() => setIsSoapModalOpen(false)}
        caseData={activeCase}
      />

      {activeCase && (
        <FhirExportModal
          isOpen={isFhirModalOpen}
          onClose={() => setIsFhirModalOpen(false)}
          caseId={activeCase.id}
        />
      )}

      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        caseData={activeCase}
        onOverrideSuccess={(updated) => setActiveCase(updated)}
      />

    </div>
  );
};
