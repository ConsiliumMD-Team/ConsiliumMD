import React, { useState } from 'react';
import { 
  Users, Search, Filter, Stethoscope, FileText, 
  Activity, Heart, ChevronRight, Eye, Sparkles, 
  Dna, ShieldAlert, CheckCircle2, Clock, Droplets
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { Patient } from '../../types';

interface PatientDirectoryViewProps {
  onSelectPatientToEvaluate: (patient: Patient) => void;
  onOpenDicomViewer: () => void;
}

export const PatientDirectoryView: React.FC<PatientDirectoryViewProps> = ({
  onSelectPatientToEvaluate,
  onOpenDicomViewer
}) => {
  const { patients, activePatient, setActivePatient } = usePatient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAge, setFilterAge] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [activeProfileTab, setActiveProfileTab] = useState<'OVERVIEW' | 'VITALS' | 'LABS' | 'MEDS' | 'PGX' | 'TIMELINE'>('OVERVIEW');

  // Filtered patient roster
  const filteredPatients = patients.filter(p => {
    const primaryCond = p.conditions?.[0] || '';
    const matchesSearch = 
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      primaryCond.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAge = 
      filterAge === 'ALL' ? true :
      filterAge === 'ELDERLY' ? p.age >= 75 :
      filterAge === 'ADULT' ? p.age < 75 : true;

    const matchesRisk =
      filterRisk === 'ALL' ? true :
      filterRisk === 'HIGH' ? (p.age >= 80 || (p.lab_results?.egfr && p.lab_results.egfr < 40)) :
      filterRisk === 'MODERATE' ? (p.age < 80 && p.age >= 60) : true;

    return matchesSearch && matchesAge && matchesRisk;
  });

  const selectedPatient = activePatient || (patients.length > 0 ? patients[0] : null);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner & Search Filter Bar */}
      <div className="card-surface p-5 border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-400" />
              <span>Patient Directory & Electronic Health Records</span>
            </h2>
            <p className="text-xs text-slate-400">
              Active ICU & Step-Down patient cohort with longitudinal multimodal biomarkers and CARMA risk profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-info font-mono">
              {patients.length} Active Records
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800">
          
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, or clinical condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Age Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="ALL">All Age Demographics</option>
              <option value="ELDERLY">Elderly / Geriatric (≥75 yrs)</option>
              <option value="ADULT">Adult (&lt;75 yrs)</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="ALL">All CARMA Risk Profiles</option>
              <option value="HIGH">High Reversal / Frailty Risk</option>
              <option value="MODERATE">Moderate Risk</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main 2-Column Workspace: Patient Table (Left) & Deep EHR Profile (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Patients List ({filteredPatients.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Select to inspect profile</span>
          </div>

          <div className="space-y-2.5">
            {filteredPatients.map(p => {
              const isSelected = selectedPatient?.id === p.id;
              const isHighRisk = p.age >= 80 || (p.lab_results?.egfr && p.lab_results.egfr < 40);

              return (
                <div
                  key={p.id}
                  onClick={() => setActivePatient(p)}
                  className={`cursor-pointer rounded-xl p-3.5 transition-all border text-left flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-sky-600/15 border-sky-500 shadow-md'
                      : 'card-surface hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-sky-400 font-bold text-xs border border-slate-700">
                        {p.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.mrn} • Age {p.age} • {p.gender}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {p.room_number}
                      </span>
                      <span className={isHighRisk ? 'badge-danger' : 'badge-success'}>
                        {isHighRisk ? 'High Risk' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="truncate max-w-[200px] text-slate-400">
                      {p.conditions?.[0] || 'Cardiometabolic Risk'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatientToEvaluate(p);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      <Stethoscope className="h-3 w-3" />
                      <span>Evaluate CARMA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep EHR Patient Profile (7 cols) */}
        <div className="lg:col-span-7">
          {selectedPatient ? (
            <div className="card-surface p-5 flex flex-col gap-4 border border-slate-800">
              
              {/* Profile Header Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600/20 border border-sky-500/40 text-sky-300 font-bold text-base">
                    {selectedPatient.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedPatient.full_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>MRN: <strong className="text-slate-200">{selectedPatient.mrn}</strong></span>
                      <span>•</span>
                      <span>Age: {selectedPatient.age}</span>
                      <span>•</span>
                      <span>{selectedPatient.gender}</span>
                      <span>•</span>
                      <span>Room: {selectedPatient.room_number}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPatientToEvaluate(selectedPatient)}
                    className="btn-primary"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span>Open in CARMA</span>
                  </button>
                  <button
                    onClick={onOpenDicomViewer}
                    className="btn-secondary"
                    title="Launch WebGL DICOM Viewer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Scans</span>
                  </button>
                </div>
              </div>

              {/* Profile Sub-Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
                {[
                  { id: 'OVERVIEW', label: 'Clinical Summary' },
                  { id: 'VITALS', label: 'Vitals & Telemetry' },
                  { id: 'LABS', label: 'Biomarkers & Labs' },
                  { id: 'MEDS', label: 'Medications' },
                  { id: 'PGX', label: 'Pharmacogenomics' },
                  { id: 'TIMELINE', label: 'Timeline' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      activeProfileTab === tab.id
                        ? 'bg-sky-600/20 text-sky-400 font-bold border border-sky-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeProfileTab === 'OVERVIEW' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="card-subtle p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Primary Diagnosis</span>
                      <span className="text-xs font-bold text-white">{selectedPatient.conditions?.[0] || 'ASCVD / CKD Stage 3b'}</span>
                    </div>
                    <div className="card-subtle p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Admission Date</span>
                      <span className="text-xs font-bold text-white">{selectedPatient.created_at?.split('T')[0] || '2026-09-28'}</span>
                    </div>
                    <div className="card-subtle p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Attending Physician</span>
                      <span className="text-xs font-bold text-sky-300">Dr. Arthur Vance, MD</span>
                    </div>
                  </div>

                  {/* Active Clinical Conditions */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase font-mono">Documented Conditions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedPatient.conditions || ['Chronic Kidney Disease Stage 3b', 'Essential Hypertension', 'Type 2 Diabetes Mellitus', 'Dyslipidemia']).map((cond, idx) => (
                        <span key={idx} className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 border border-slate-700">
                          • {cond}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Vitals */}
              {activeProfileTab === 'VITALS' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">HEART RATE</span>
                    <span className="text-lg font-bold font-mono text-rose-400">
                      {selectedPatient.vitals?.heart_rate || 76} <span className="text-[10px]">bpm</span>
                    </span>
                  </div>
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">BLOOD PRESSURE</span>
                    <span className="text-lg font-bold font-mono text-purple-300">
                      {selectedPatient.vitals?.bp_systolic || 135}/{selectedPatient.vitals?.bp_diastolic || 82}
                    </span>
                  </div>
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">OXYGEN SAT (SPO2)</span>
                    <span className="text-lg font-bold font-mono text-sky-400">
                      {selectedPatient.vitals?.spo2 || 98}%
                    </span>
                  </div>
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">RESPIRATORY RATE</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      {selectedPatient.vitals?.respiratory_rate || 16} <span className="text-[10px]">/min</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 3: Labs */}
              {activeProfileTab === 'LABS' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">eGFR (RENAL)</span>
                    <span className="text-base font-bold font-mono text-sky-300">
                      {selectedPatient.lab_results?.egfr || 38} <span className="text-[10px]">mL/min</span>
                    </span>
                  </div>
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">LDL CHOLESTEROL</span>
                    <span className="text-base font-bold font-mono text-amber-300">
                      {selectedPatient.lab_results?.ldl || 142} <span className="text-[10px]">mg/dL</span>
                    </span>
                  </div>
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">HbA1c</span>
                    <span className="text-base font-bold font-mono text-emerald-300">
                      {selectedPatient.lab_results?.hba1c || 7.4}%
                    </span>
                  </div>
                  <div className="card-subtle p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">PLATELETS</span>
                    <span className="text-base font-bold font-mono text-slate-200">
                      {selectedPatient.lab_results?.platelets || 215} <span className="text-[10px]">k/uL</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 4: Medications */}
              {activeProfileTab === 'MEDS' && (
                <div className="flex flex-col gap-2">
                  <div className="space-y-1.5">
                    {(selectedPatient.medications || []).map((med, i) => {
                      const medText = typeof med === 'string' ? med : `${med.name} ${med.dose} (${med.freq || med.frequency || 'daily'})`;
                      return (
                        <div key={i} className="card-subtle p-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">• {medText}</span>
                          <span className="badge-info font-mono text-[9px]">Active Rx</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 5: PGx */}
              {activeProfileTab === 'PGX' && (
                <div className="flex flex-col gap-3">
                  <div className="card-subtle p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Dna className="h-5 w-5 text-purple-400" />
                      <div>
                        <div className="text-xs font-bold text-white">CYP2C19 Genotype Profile</div>
                        <div className="text-[11px] text-slate-400">CPIC Drug Metabolism Status</div>
                      </div>
                    </div>
                    <span className="rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2.5 py-1 text-xs font-mono font-bold">
                      {selectedPatient.genomics?.cyp2c19 || '*1/*1 Extensive Metabolizer'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 6: Timeline */}
              {activeProfileTab === 'TIMELINE' && (
                <div className="space-y-3 py-1">
                  <div className="flex items-start gap-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Admitted to ICU West (Room {selectedPatient.room_number})</div>
                      <div className="text-[10px] text-slate-400 font-mono">2026-09-28 08:30 UTC</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Chest X-Ray AP & Lab Biomarkers Ingested</div>
                      <div className="text-[10px] text-slate-400 font-mono">2026-09-28 10:15 UTC</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">CARMA Decision Bounds Evaluated</div>
                      <div className="text-[10px] text-slate-400 font-mono">2026-09-28 11:00 UTC</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="card-surface p-12 text-center text-xs text-slate-400 font-mono">
              Select a patient from the roster to view EHR details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
