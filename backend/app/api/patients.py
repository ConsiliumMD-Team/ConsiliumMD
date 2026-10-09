from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.patient import Patient
from backend.app.models.case import ClinicalCase
from backend.app.models.user import User
from backend.app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.audit_service import log_audit_event

router = APIRouter(prefix="/patients", tags=["Patient Management & Longitudinal EHR"])

@router.get("", response_model=list[PatientResponse])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patients = db.query(Patient).all()
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="LIST_PATIENTS",
        resource_type="Patient",
        resource_id="ALL",
        details={"count": len(patients)}
    )
    return patients

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="VIEW_PATIENT_CHART",
        resource_type="Patient",
        resource_id=str(patient.id),
        details={"mrn": patient.mrn}
    )
    return patient

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["doctor", "reviewer", "nurse", "admin"]))
):
    existing = db.query(Patient).filter(Patient.mrn == patient_in.mrn).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient with this MRN already exists")
    
    patient = Patient(**patient_in.dict())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="CREATE_PATIENT",
        resource_type="Patient",
        resource_id=str(patient.id),
        details={"mrn": patient.mrn, "full_name": patient.full_name}
    )
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["doctor", "reviewer", "nurse"]))
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(patient, field, val)
        
    db.commit()
    db.refresh(patient)
    
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="UPDATE_PATIENT_PROFILE",
        resource_type="Patient",
        resource_id=str(patient.id),
        details={"updated_fields": list(update_data.keys())}
    )
    return patient

@router.get("/{patient_id}/timeline")
def get_patient_longitudinal_timeline(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    cases = db.query(ClinicalCase).filter(ClinicalCase.patient_id == patient_id).order_by(ClinicalCase.created_at.desc()).all()
    
    return {
        "patient_id": patient_id,
        "mrn": patient.mrn,
        "full_name": patient.full_name,
        "cases": [
            {
                "id": c.id,
                "title": c.title,
                "query_text": c.query_text,
                "status": c.status,
                "routing_state": c.routing_state,
                "confidence_score": c.confidence_score,
                "reversal_hazard": c.reversal_hazard,
                "recommendation": c.carma_payload.get("recommendation", {}),
                "created_at": c.created_at.isoformat()
            }
            for c in cases
        ]
    }
