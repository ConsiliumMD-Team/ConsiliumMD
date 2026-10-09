import { Patient, ClinicalCase, DicomAnalysis, DiscrepancyReport, LiveTelemetryTick, User } from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('consilium_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Patients
  async listPatients(): Promise<Patient[]> {
    const res = await fetch(`${API_BASE}/patients`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getPatient(id: number): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch patient');
    return res.json();
  },

  async getPatientTimeline(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${id}/timeline`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  },

  // CARMA Reasoning Engine
  async analyzeQuery(patientId: number, title: string, queryText: string, modalityInputs?: any): Promise<ClinicalCase> {
    const res = await fetch(`${API_BASE}/carma/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        patient_id: patientId,
        title,
        query_text: queryText,
        modality_inputs: modalityInputs || {}
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Analysis query failed');
    }
    return res.json();
  },

  async resolveElicit(caseId: number, preferences: Record<string, number>): Promise<ClinicalCase> {
    const res = await fetch(`${API_BASE}/carma/resolve-elicit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ case_id: caseId, preferences })
    });
    if (!res.ok) throw new Error('Failed to resolve elicit state');
    return res.json();
  },

  async resolveRetrieve(caseId: number, retrievedData: Record<string, any>): Promise<ClinicalCase> {
    const res = await fetch(`${API_BASE}/carma/resolve-retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ case_id: caseId, retrieved_data: retrievedData })
    });
    if (!res.ok) throw new Error('Failed to resolve retrieve state');
    return res.json();
  },

  async acknowledgeWarn(caseId: number, rationale?: string): Promise<ClinicalCase> {
    const res = await fetch(`${API_BASE}/carma/acknowledge-warn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ case_id: caseId, acknowledged: true, rationale: rationale || 'Clinician acknowledged fragility hazard.' })
    });
    if (!res.ok) throw new Error('Failed to acknowledge warning');
    return res.json();
  },

  async resolveEscalate(caseId: number, seniorResolution: string, overrideReason: string): Promise<ClinicalCase> {
    const res = await fetch(`${API_BASE}/carma/resolve-escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ case_id: caseId, senior_resolution: seniorResolution, override_reason: overrideReason })
    });
    if (!res.ok) throw new Error('Failed to resolve senior escalation');
    return res.json();
  },

  async overrideDecision(caseId: number, overrideReason: string, prescribedIntervention: string): Promise<ClinicalCase> {
    const res = await fetch(`${API_BASE}/carma/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ case_id: caseId, override_reason: overrideReason, prescribed_intervention: prescribedIntervention })
    });
    if (!res.ok) throw new Error('Failed to override case');
    return res.json();
  },

  async simulateWhatIf(patientId: number, tweaks: Record<string, any>, baseCaseId?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/carma/what-if`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ patient_id: patientId, simulated_variables: tweaks, base_case_id: baseCaseId })
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  async listEscalations(): Promise<ClinicalCase[]> {
    const res = await fetch(`${API_BASE}/carma/escalations`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to list escalations');
    return res.json();
  },

  // Multimodal Uploads
  async uploadDicom(patientId: number, file: File): Promise<DicomAnalysis> {
    const formData = new FormData();
    formData.append('patient_id', patientId.toString());
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/multimodal/upload-dicom`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (!res.ok) throw new Error('DICOM upload failed');
    return res.json();
  },

  async uploadDocument(patientId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('patient_id', patientId.toString());
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/multimodal/upload-document`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (!res.ok) throw new Error('Document upload failed');
    return res.json();
  },

  async checkDiscrepancy(patientId: number, imageFindings: string[], anomalies: any[], ocrText: string): Promise<DiscrepancyReport> {
    const res = await fetch(`${API_BASE}/multimodal/check-discrepancy?patient_id=${patientId}&ocr_text=${encodeURIComponent(ocrText)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        patient_id: patientId,
        image_findings: imageFindings,
        anomalies,
        ocr_text: ocrText
      })
    });
    if (!res.ok) throw new Error('Discrepancy check failed');
    return res.json();
  },

  // Workflows
  async exportFhir(caseId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/workflows/fhir-export/${caseId}`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('FHIR export failed');
    return res.json();
  },

  async getMorningHuddle(): Promise<any> {
    const res = await fetch(`${API_BASE}/workflows/morning-huddle`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Morning huddle fetch failed');
    return res.json();
  },

  // Admin & Compliance
  async getReversalRadar(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/reversal-radar`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to load reversal radar');
    return res.json();
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  async verifyAuditChain(): Promise<{ valid: boolean; total_records: number; message: string }> {
    const res = await fetch(`${API_BASE}/admin/verify-audit-chain`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to verify audit chain');
    return res.json();
  },

  async getVramStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/telemetry/vram-status`);
    if (!res.ok) return { current_usage_mb: 4824, vram_limit_mb: 6144, utilization_percent: 78.5, loaded_model: 'CARMA_LLM' };
    return res.json();
  }
};
