export type UserRole = 'doctor' | 'reviewer' | 'admin' | 'nurse';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: number;
  mrn: string;
  full_name: string;
  age: number;
  gender: string;
  blood_type: string;
  room_number: string;
  status: string;
  conditions: string[];
  medications: Array<{ name: string; dose: string; freq?: string; frequency?: string }>;
  allergies: string[];
  vitals: {
    heart_rate?: number;
    bp_systolic?: number;
    bp_diastolic?: number;
    spo2?: number;
    respiratory_rate?: number;
    temp_c?: number;
    [key: string]: any;
  };
  lab_results: {
    egfr?: number;
    creatinine?: number;
    ldl?: number;
    hba1c?: number;
    potassium?: number;
    platelets?: number;
    bnp?: number;
    [key: string]: any;
  };
  genomics: Record<string, string>;
  organ_states: Record<string, 'normal' | 'warning' | 'critical'>;
  created_at: string;
  updated_at: string;
}

export type RoutingState = 'ANSWER' | 'RETRIEVE' | 'ELICIT' | 'WARN' | 'ESCALATE';

export interface Recommendation {
  headline: string;
  text: string;
  rationale?: string;
  evidence_grade?: string;
  citations?: Array<{ source: string; section: string }>;
  mandatory_acknowledgment?: boolean;
}

export interface ArgumentNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  stance?: string;
}

export interface ArgumentEdge {
  source: string;
  target: string;
  conflict?: boolean;
  type?: string;
  status?: string;
}

export interface ConfidencePoint {
  label: string;
  x_hazard: number;
  y_rpd: number;
  cohort: string;
  category: string;
  is_current?: boolean;
}

export interface ReplayStep {
  step: number;
  title: string;
  description: string;
  duration_ms: number;
  status: string;
}

export interface CarmaPayload {
  routing_state: RoutingState;
  state_title: string;
  summary: string;
  confidence_score: number;
  rpd_score: number;
  reversal_hazard: number;
  missing_variables?: Array<{ variable: string; label: string; unit: string; reason: string }>;
  normative_domains?: Array<{ dimension: string; weight: number; favors: string }>;
  fragility_reasons?: string[];
  critical_alerts?: Array<{ type: string; severity: string; description: string; [key: string]: any }>;
  pgx_alerts?: Array<{ type: string; severity: string; description: string; [key: string]: any }>;
  recommendation?: Recommendation;
  escalation_queue_assigned?: string;
  elicitation_scale?: {
    dimension_left: string;
    dimension_right: string;
    default_value: number;
    current_recommendation_left: string;
    current_recommendation_right: string;
  };
  argument_flow?: { nodes: ArgumentNode[]; edges: ArgumentEdge[] };
  confidence_space?: {
    current_point: { x_hazard: number; y_rpd: number; state: string };
    quadrants: Record<string, string>;
    historical_points: ConfidencePoint[];
  };
  replay_steps?: ReplayStep[];
  action_prompt?: string;
}

export interface ClinicalCase {
  id: number;
  patient_id: number;
  created_by_user_id: number;
  title: string;
  query_text: string;
  status: string;
  routing_state: RoutingState;
  rpd_score: number;
  reversal_hazard: number;
  confidence_score: number;
  extracted_context: Record<string, any>;
  carma_payload: CarmaPayload;
  elicit_preferences: Record<string, any>;
  retrieved_variables: Record<string, any>;
  warning_acknowledged: boolean;
  override_reason?: string;
  escalation_notes?: string;
  senior_resolution?: string;
  soap_note: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  icd10_codes: Array<{ code: string; description: string }>;
  cpt_codes: Array<{ code: string; description: string; rvu?: number }>;
  created_at: string;
  updated_at: string;
}

export interface DicomAnomaly {
  id: string;
  label: string;
  box_2d: [number, number, number, number];
  confidence: number;
  evidence_link: string;
  severity: string;
  clinical_significance: string;
}

export interface DicomAnalysis {
  modality: string;
  body_part: string;
  filename: string;
  findings: string[];
  anomalies: DicomAnomaly[];
  summary: string;
  metadata: Record<string, any>;
}

export interface DiscrepancyReport {
  has_discrepancy: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'NONE';
  image_modality_claim: string;
  text_document_claim: string;
  explanation: string;
  recommended_action: string;
}

export interface LiveTelemetryTick {
  patient_id: number;
  timestamp: number;
  heart_rate: number;
  spo2: number;
  bp_systolic: number;
  bp_diastolic: number;
  respiratory_rate: number;
  temp_c: number;
  is_breach: boolean;
  breach_alert?: string;
  ecg_sample: number[];
}
