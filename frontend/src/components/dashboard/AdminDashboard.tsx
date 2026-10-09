import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Radar, Lock, CheckCircle2, 
  Activity, RefreshCw, Key, Users, FileText
} from 'lucide-react';
import { api } from '../../api/client';

interface AdminDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab = 'dashboard' }) => {
  const [radarData, setRadarData] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [chainStatus, setChainStatus] = useState<{ valid: boolean; total_records: number; message: string } | null>(null);
  const [subTab, setSubTab] = useState<'RADAR' | 'AUDIT' | 'USERS'>('RADAR');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [radar, logs, chain] = await Promise.all([
        api.getReversalRadar(),
        api.getAuditLogs(),
        api.verifyAuditChain()
      ]);
      setRadarData(radar);
      setAuditLogs(logs);
      setChainStatus(chain);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setChainStatus(res);
      alert(res.message);
    } catch (e: any) {
      alert(e.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="card-surface p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Institutional Compliance & Reversal Radar</h1>
            <p className="text-xs text-slate-400">
              HIPAA cryptographic append-only audit trail and continuous guideline drift surveillance.
            </p>
          </div>
        </div>

        {/* Chain Integrity Badge & Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-mono">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>SHA-256 Chain:</span>
            <span className={`font-bold ${chainStatus?.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {chainStatus?.valid ? 'VERIFIED INTACT' : 'TAMPER DETECTED'}
            </span>
          </div>

          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Audit Hash Chain</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('RADAR')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            subTab === 'RADAR' ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radar className="h-4 w-4" />
          <span>Institutional Reversal Radar</span>
        </button>

        <button
          onClick={() => setSubTab('AUDIT')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            subTab === 'AUDIT' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Immutable Audit Events Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: REVERSAL RADAR */}
      {subTab === 'RADAR' && radarData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Institutional Radar Metrics Grid (6 cols) */}
          <div className="lg:col-span-6 card-surface p-5 flex flex-col gap-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Hospital Guideline Drift Metrics (Q3 2026)
              </span>
              <span className="text-[10px] font-mono text-sky-400">Institutional vs Benchmark</span>
            </div>

            <div className="flex flex-col gap-3">
              {radarData.radar_metrics.map((m: any, i: number) => {
                const isOverBenchmark = m.hospital_score > m.benchmark;
                return (
                  <div key={i} className="flex flex-col gap-1.5 card-subtle p-3">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>{m.category}</span>
                      <span className={`font-mono text-[11px] ${isOverBenchmark ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                        Local: {m.hospital_score}% (National: {m.benchmark}%)
                      </span>
                    </div>
                    {/* Bar comparison */}
                    <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 bottom-0 bg-slate-500 z-10 w-[2px]" 
                        style={{ left: `${m.benchmark}%` }}
                        title="National Benchmark"
                      />
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOverBenchmark ? 'bg-amber-500' : 'bg-sky-500'}`}
                        style={{ width: `${m.hospital_score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Protocols at Risk (6 cols) */}
          <div className="lg:col-span-6 card-surface p-5 flex flex-col gap-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Departmental Fragility Surveillance
              </span>
              <span className="badge-success font-mono text-[9px]">Continuous Daemon</span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[460px]">
              {radarData.departments.map((d: any, idx: number) => (
                <div key={idx} className="card-subtle p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{d.name}</span>
                    <span className="badge-info font-mono text-[9px]">
                      Compliance: {d.guideline_compliance}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <span>Drift Score: <strong className="text-amber-400">{d.local_drift_score.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>Benchmark: <strong className="text-slate-400">{d.national_benchmark.toFixed(2)}</strong></span>
                  </div>

                  <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Protocols in High-Risk Zone:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {d.at_risk_protocols.map((prot: string, pIdx: number) => (
                        <span key={pIdx} className="text-[10px] rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2 py-0.5 font-mono">
                          ⚠️ {prot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: IMMUTABLE AUDIT TRAIL EXPLORER */}
      {subTab === 'AUDIT' && (
        <div className="card-surface p-5 flex flex-col gap-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                HIPAA Append-Only Audit Log
              </span>
              <p className="text-[11px] text-slate-400 font-mono">Chained Cryptographic Signatures (SHA-256)</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">{auditLogs.length} Verified Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Event ID</th>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Actor (Role)</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Prev Hash</th>
                  <th className="p-3">Record SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-bold text-white">#{log.id}</td>
                    <td className="p-3 text-slate-400">{log.timestamp}</td>
                    <td className="p-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-sky-300">
                        {log.actor_role} (#{log.actor_id})
                      </span>
                    </td>
                    <td className="p-3 text-emerald-400 font-semibold">{log.action}</td>
                    <td className="p-3 text-slate-300">{log.resource_type} ({log.resource_id})</td>
                    <td className="p-3 text-slate-500 truncate max-w-[120px]" title={log.prev_hash}>
                      {log.prev_hash?.slice(0, 12)}...
                    </td>
                    <td className="p-3 text-sky-400 truncate max-w-[120px]" title={log.record_hash}>
                      {log.record_hash?.slice(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
