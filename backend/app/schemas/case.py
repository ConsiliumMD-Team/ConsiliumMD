from pydantic import BaseModel
from typing import Optional, Any
import datetime

class ClinicalQueryRequest(BaseModel):
    patient_id: int
    title: str
    query_text: str
    modality_inputs: Optional[dict[str, Any]] = None  # e.g., {"dicom_findings": [...], "ocr_notes": "..."}

class ElicitResolveRequest(BaseModel):
    case_id: int
    preferences: dict[str, float]  # e.g., {"longevity_vs_qol": 0.8, "risk_aversion": 0.6}
    notes: Optional[str] = None

class RetrieveResolveRequest(BaseModel):
    case_id: int
    retrieved_data: dict[str, Any]  # e.g., {"ldl": 145, "egfr": 38}

class WarnAcknowledgeRequest(BaseModel):
    case_id: int
    acknowledged: bool = True
    rationale: Optional[str] = None

class EscalateResolveRequest(BaseModel):
    case_id: int
    senior_resolution: str
    guideline_override: Optional[str] = None
    override_reason: str

class CaseOverrideRequest(BaseModel):
    case_id: int
    override_reason: str
    prescribed_intervention: str

class WhatIfSimulationRequest(BaseModel):
    patient_id: int
    base_case_id: Optional[int] = None
    simulated_variables: dict[str, Any]  # e.g., {"age": 78, "egfr": 32, "ldl": 160, "bp_systolic": 150}

class ClinicalCaseResponse(BaseModel):
    id: int
    patient_id: int
    created_by_user_id: int
    title: str
    query_text: str
    status: str
    routing_state: str
    rpd_score: float
    reversal_hazard: float
    confidence_score: float
    extracted_context: dict[str, Any]
    carma_payload: dict[str, Any]
    elicit_preferences: dict[str, Any]
    retrieved_variables: dict[str, Any]
    warning_acknowledged: bool
    override_reason: Optional[str] = None
    escalation_notes: Optional[str] = None
    senior_resolution: Optional[str] = None
    soap_note: dict[str, Any]
    icd10_codes: list[dict[str, Any]]
    cpt_codes: list[dict[str, Any]]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
