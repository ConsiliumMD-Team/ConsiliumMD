from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.database import get_db
from backend.app.models.patient import Patient
from backend.app.models.user import User
from backend.app.services.auth_service import get_current_user
from backend.app.services.dicom_processor import dicom_processor
from backend.app.services.pdf_ocr_processor import pdf_ocr_processor
from backend.app.services.discrepancy_detector import discrepancy_detector
from backend.app.services.vram_orchestrator import vram_orchestrator
from backend.app.services.audit_service import log_audit_event

router = APIRouter(prefix="/multimodal", tags=["Multimodal Ingestion (DICOM & PDF OCR)"])

@router.post("/upload-dicom")
async def upload_dicom_image(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Allocate VRAM for Vision Model Pipeline
    vram_orchestrator.allocate_vision_pipeline()

    content = await file.read()
    result = dicom_processor.process_image(file.filename, content)

    # Automatically update patient organ state if anomaly detected
    organ_states = dict(patient.organ_states or {})
    for anom in result.get("anomalies", []):
        if "Cardiomegaly" in anom.get("label", ""):
            organ_states["heart"] = "critical"
        elif "Effusion" in anom.get("label", ""):
            organ_states["lungs"] = "warning"
        elif "Calcification" in anom.get("label", ""):
            organ_states["vascular"] = "warning"
    
    patient.organ_states = organ_states
    db.commit()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="UPLOAD_DICOM_IMAGE",
        resource_type="Patient",
        resource_id=str(patient.id),
        details={"filename": file.filename, "anomalies_found": len(result.get("anomalies", []))}
    )

    return result

@router.post("/upload-document")
async def upload_document_pdf(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    vram_orchestrator.allocate_vision_pipeline()
    
    content = await file.read()
    result = pdf_ocr_processor.process_document(file.filename)

    # Ingest extracted labs and medications into patient longitudinal EHR profile
    current_labs = dict(patient.lab_results or {})
    for k, v in result.get("extracted_labs", {}).items():
        current_labs[k] = v
    patient.lab_results = current_labs

    # Append new medications
    existing_med_names = [m.get("name", "").lower() if isinstance(m, dict) else str(m).lower() for m in (patient.medications or [])]
    current_meds = list(patient.medications or [])
    for med in result.get("extracted_medications", []):
        if med.get("name", "").lower() not in existing_med_names:
            current_meds.append(med)
    patient.medications = current_meds

    db.commit()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="UPLOAD_DOCUMENT_OCR",
        resource_type="Patient",
        resource_id=str(patient.id),
        details={"filename": file.filename, "meds_extracted": len(result.get("extracted_medications", []))}
    )

    return result

@router.post("/check-discrepancy")
def check_discrepancy(
    patient_id: int,
    image_findings: list[str],
    anomalies: list[dict],
    ocr_text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    report = discrepancy_detector.analyze_cross_modality(
        image_findings=image_findings,
        anomalies=anomalies,
        ocr_text=ocr_text
    )

    if report["has_discrepancy"]:
        log_audit_event(
            db=db,
            actor_id=current_user.id,
            actor_role=current_user.role,
            action="MULTIMODAL_DISCREPANCY_FLAGGED",
            resource_type="Patient",
            resource_id=str(patient.id),
            details={"severity": report["severity"], "explanation": report["explanation"]}
        )

    return report
