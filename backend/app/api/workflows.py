from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.patient import Patient
from backend.app.models.case import ClinicalCase
from backend.app.models.user import User
from backend.app.schemas.fhir import FhirExportResponse
from backend.app.services.auth_service import get_current_user
from backend.app.services.fhir_exporter import fhir_exporter
from backend.app.services.soap_generator import soap_generator
from backend.app.services.reversal_surveillance import reversal_surveillance
from backend.app.services.audit_service import log_audit_event

router = APIRouter(prefix="/workflows", tags=["Workflow Acceleration & SMART on FHIR"])

@router.get("/fhir-export/{case_id}", response_model=FhirExportResponse)
def export_to_fhir(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    patient = db.query(Patient).filter(Patient.id == case.patient_id).first()

    patient_dict = {
        "id": patient.id,
        "mrn": patient.mrn,
        "full_name": patient.full_name,
        "age": patient.age,
        "gender": patient.gender,
        "vitals": patient.vitals or {},
        "lab_results": patient.lab_results or {},
        "conditions": patient.conditions or []
    }
    case_dict = {
        "id": case.id,
        "carma_payload": case.carma_payload or {},
        "soap_note": case.soap_note or {}
    }

    result = fhir_exporter.export_case_to_fhir(patient_dict, case_dict)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="FHIR_EHR_EXPORT",
        resource_type="ClinicalCase",
        resource_id=str(case.id),
        details={"bundle_entries": result["total_entries"]}
    )

    return result

@router.get("/morning-huddle")
def get_morning_huddle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    huddle_report = reversal_surveillance.generate_morning_huddle(db)
    return huddle_report

@router.post("/generate-soap")
def generate_soap_preview(
    patient_id: int,
    query_text: str,
    recommendation_text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_dict = {
        "age": patient.age,
        "gender": patient.gender,
        "conditions": patient.conditions or [],
        "medications": patient.medications or [],
        "vitals": patient.vitals or {},
        "lab_results": patient.lab_results or {}
    }

    rec = {"headline": "Clinical Intervention", "text": recommendation_text, "rationale": "Evidence-grounded CARMA CDSS synthesis."}
    
    return soap_generator.generate_soap_and_codes(
        patient=patient_dict,
        case_title="Clinical Assessment",
        query_text=query_text,
        recommendation=rec,
        clinician_name=current_user.full_name
    )
