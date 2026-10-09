from pydantic import BaseModel
from typing import Optional, Any

class DicomAnalysisResponse(BaseModel):
    modality: str  # 'X-Ray', 'CT', 'MRI'
    body_part: str  # 'Chest', 'Abdomen', 'Brain', 'Spine'
    findings: list[str]
    anomalies: list[dict[str, Any]]  # [{"box_2d": [ymin, xmin, ymax, xmax], "label": "Cardiomegaly", "confidence": 0.94, "evidence_link": "ACC_AHA_HF_SEC_3"}]
    image_url: str
    metadata: dict[str, Any]

class DocumentOcrResponse(BaseModel):
    document_type: str  # 'Radiology Report', 'Prescription', 'Discharge Summary', 'Lab PDF'
    extracted_text: str
    structured_entities: dict[str, Any]  # {"medications": [...], "lab_values": {...}, "vitals": {...}}
    confidence: float

class DiscrepancyReport(BaseModel):
    has_discrepancy: bool
    severity: str  # 'CRITICAL', 'WARNING', 'NONE'
    image_modality_claim: str
    text_document_claim: str
    explanation: str
    recommended_action: str
