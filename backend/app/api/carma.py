from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.patient import Patient
from backend.app.models.case import ClinicalCase
from backend.app.models.user import User
from backend.app.schemas.case import (
    ClinicalQueryRequest, ElicitResolveRequest, RetrieveResolveRequest,
    WarnAcknowledgeRequest, EscalateResolveRequest, CaseOverrideRequest,
    WhatIfSimulationRequest, ClinicalCaseResponse
)
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.carma_engine import carma_engine
from backend.app.services.counterfactual_engine import counterfactual_engine
from backend.app.services.phi_scrubber import phi_scrubber
from backend.app.services.soap_generator import soap_generator
from backend.app.services.vram_orchestrator import vram_orchestrator
from backend.app.services.audit_service import log_audit_event

router = APIRouter(prefix="/carma", tags=["CARMA Decision Engine & 5-State Routing"])

@router.post("/analyze", response_model=ClinicalCaseResponse)
def analyze_clinical_query(
    query_in: ClinicalQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["doctor", "reviewer", "admin"]))
):
    patient = db.query(Patient).filter(Patient.id == query_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 1. Consumer GPU VRAM Orchestration (Swap in CARMA LLM)
    vram_orchestrator.allocate_carma_reasoning()

    # 2. Pre-LLM PHI Scrubbing Gateway
    scrubbed_query, phi_counts = phi_scrubber.scrub_text(query_in.query_text, patient.full_name)

    patient_dict = {
        "id": patient.id,
        "age": patient.age,
        "gender": patient.gender,
        "conditions": patient.conditions or [],
        "medications": patient.medications or [],
        "allergies": patient.allergies or [],
        "vitals": patient.vitals or {},
        "lab_results": patient.lab_results or {},
        "genomics": patient.genomics or {}
    }

    # 3. Execute CARMA 5-State Reasoning Engine
    carma_result = carma_engine.evaluate_clinical_query(
        patient_context=patient_dict,
        query_text=scrubbed_query
    )

    # 4. Generate Auto SOAP note if in ANSWER or WARN state
    soap_data = {}
    icd10 = []
    cpt = []
    if carma_result.get("routing_state") in ["ANSWER", "WARN"] and "recommendation" in carma_result:
        soap_res = soap_generator.generate_soap_and_codes(
            patient=patient_dict,
            case_title=query_in.title,
            query_text=query_in.query_text,
            recommendation=carma_result["recommendation"],
            clinician_name=current_user.full_name
        )
        soap_data = soap_res["soap_note"]
        icd10 = soap_res["icd10_codes"]
        cpt = soap_res["cpt_codes"]

    # 5. Persist Clinical Case in DB
    new_case = ClinicalCase(
        patient_id=patient.id,
        created_by_user_id=current_user.id,
        title=query_in.title,
        query_text=query_in.query_text,
        status="Pending" if carma_result["routing_state"] in ["RETRIEVE", "ELICIT", "WARN", "ESCALATE"] else "Resolved",
        routing_state=carma_result["routing_state"],
        rpd_score=carma_result.get("rpd_score", 0.0),
        reversal_hazard=carma_result.get("reversal_hazard", 0.0),
        confidence_score=carma_result.get("confidence_score", 0.90),
        extracted_context={"phi_scrubbed": True, "phi_counts": phi_counts, "modality_inputs": query_in.modality_inputs or {}},
        carma_payload=carma_result,
        soap_note=soap_data,
        icd10_codes=icd10,
        cpt_codes=cpt
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # 6. Immutable Audit Logging
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action=f"CARMA_QUERY_{carma_result['routing_state']}",
        resource_type="ClinicalCase",
        resource_id=str(new_case.id),
        details={"case_id": new_case.id, "routing_state": carma_result["routing_state"], "patient_id": patient.id}
    )

    return new_case

@router.post("/resolve-elicit", response_model=ClinicalCaseResponse)
def resolve_elicit(
    elicit_in: ElicitResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["doctor", "reviewer"]))
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == elicit_in.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    patient = db.query(Patient).filter(Patient.id == case.patient_id).first()

    patient_dict = {
        "id": patient.id,
        "age": patient.age,
        "gender": patient.gender,
        "conditions": patient.conditions or [],
        "medications": patient.medications or [],
        "vitals": patient.vitals or {},
        "lab_results": patient.lab_results or {},
        "genomics": patient.genomics or {}
    }

    # Re-evaluate with elicited weights
    carma_result = carma_engine.evaluate_clinical_query(
        patient_context=patient_dict,
        query_text=case.query_text,
        elicit_input=elicit_in.preferences
    )

    soap_res = soap_generator.generate_soap_and_codes(
        patient=patient_dict,
        case_title=case.title,
        query_text=case.query_text,
        recommendation=carma_result.get("recommendation", {}),
        clinician_name=current_user.full_name
    )

    case.routing_state = carma_result["routing_state"]
    case.status = "Resolved"
    case.elicit_preferences = elicit_in.preferences
    case.carma_payload = carma_result
    case.soap_note = soap_res["soap_note"]
    case.icd10_codes = soap_res["icd10_codes"]
    case.cpt_codes = soap_res["cpt_codes"]

    db.commit()
    db.refresh(case)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="RESOLVE_ELICIT_STATE",
        resource_type="ClinicalCase",
        resource_id=str(case.id),
        details={"preferences": elicit_in.preferences}
    )
    return case

@router.post("/resolve-retrieve", response_model=ClinicalCaseResponse)
def resolve_retrieve(
    retrieve_in: RetrieveResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["doctor", "reviewer"]))
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == retrieve_in.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    patient = db.query(Patient).filter(Patient.id == case.patient_id).first()

    # Update patient central lab/vitals
    updated_labs = dict(patient.lab_results or {})
    updated_vitals = dict(patient.vitals or {})
    for k, v in retrieve_in.retrieved_data.items():
        if k in ["ldl", "egfr", "creatinine", "hba1c", "potassium", "platelets"]:
            updated_labs[k] = float(v)
        elif k in ["bp_systolic", "bp_diastolic", "heart_rate", "spo2"]:
            updated_vitals[k] = float(v)

    patient.lab_results = updated_labs
    patient.vitals = updated_vitals
    db.commit()

    patient_dict = {
        "id": patient.id,
        "age": patient.age,
        "gender": patient.gender,
        "conditions": patient.conditions or [],
        "medications": patient.medications or [],
        "vitals": updated_vitals,
        "lab_results": updated_labs,
        "genomics": patient.genomics or {}
    }

    carma_result = carma_engine.evaluate_clinical_query(
        patient_context=patient_dict,
        query_text=case.query_text,
        retrieved_input=retrieve_in.retrieved_data
    )

    soap_data = {}
    icd10 = []
    cpt = []
    if "recommendation" in carma_result:
        soap_res = soap_generator.generate_soap_and_codes(
            patient=patient_dict,
            case_title=case.title,
            query_text=case.query_text,
            recommendation=carma_result["recommendation"],
            clinician_name=current_user.full_name
        )
        soap_data = soap_res["soap_note"]
        icd10 = soap_res["icd10_codes"]
        cpt = soap_res["cpt_codes"]

    case.routing_state = carma_result["routing_state"]
    case.status = "Resolved" if carma_result["routing_state"] in ["ANSWER", "WARN"] else "Pending"
    case.retrieved_variables = retrieve_in.retrieved_data
    case.carma_payload = carma_result
    case.soap_note = soap_data
    case.icd10_codes = icd10
    case.cpt_codes = cpt

    db.commit()
    db.refresh(case)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="RESOLVE_RETRIEVE_STATE",
        resource_type="ClinicalCase",
        resource_id=str(case.id),
        details={"retrieved": retrieve_in.retrieved_data}
    )
    return case

@router.post("/acknowledge-warn", response_model=ClinicalCaseResponse)
def acknowledge_warn(
    warn_in: WarnAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["doctor", "reviewer"]))
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == warn_in.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.warning_acknowledged = True
    case.status = "Resolved"
    db.commit()
    db.refresh(case)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="ACKNOWLEDGE_REVERSAL_WARN",
        resource_type="ClinicalCase",
        resource_id=str(case.id),
        details={"rationale": warn_in.rationale}
    )
    return case

@router.post("/resolve-escalate", response_model=ClinicalCaseResponse)
def resolve_escalate(
    esc_in: EscalateResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["reviewer", "admin"]))  # Senior Clinician Only
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == esc_in.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = "Resolved"
    case.senior_resolution = esc_in.senior_resolution
    case.override_reason = esc_in.override_reason
    case.routing_state = "ANSWER"

    db.commit()
    db.refresh(case)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="SENIOR_ESCALATION_RESOLVED",
        resource_type="ClinicalCase",
        resource_id=str(case.id),
        details={"senior_resolution": esc_in.senior_resolution, "override_reason": esc_in.override_reason}
    )
    return case

@router.post("/override", response_model=ClinicalCaseResponse)
def override_case(
    override_in: CaseOverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["doctor", "reviewer"]))
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == override_in.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = "Overridden"
    case.override_reason = override_in.override_reason
    
    db.commit()
    db.refresh(case)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="CLINICAL_DECISION_OVERRIDE",
        resource_type="ClinicalCase",
        resource_id=str(case.id),
        details={"override_reason": override_in.override_reason, "prescribed": override_in.prescribed_intervention}
    )
    return case

@router.post("/what-if")
def what_if_simulation(
    sim_in: WhatIfSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == sim_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_dict = {
        "id": patient.id,
        "age": patient.age,
        "gender": patient.gender,
        "conditions": patient.conditions or [],
        "medications": patient.medications or [],
        "vitals": patient.vitals or {},
        "lab_results": patient.lab_results or {},
        "genomics": patient.genomics or {}
    }

    query_text = "Evaluate statin intensity and cardiovascular risk reduction."
    if sim_in.base_case_id:
        c = db.query(ClinicalCase).filter(ClinicalCase.id == sim_in.base_case_id).first()
        if c:
            query_text = c.query_text

    sim_result = counterfactual_engine.simulate(
        base_patient=patient_dict,
        tweaks=sim_in.simulated_variables,
        query_text=query_text
    )

    return sim_result

@router.get("/cases/{case_id}", response_model=ClinicalCaseResponse)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/escalations")
def list_escalations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["reviewer", "admin"]))
):
    cases = db.query(ClinicalCase).filter(ClinicalCase.routing_state == "ESCALATE").order_by(ClinicalCase.created_at.desc()).all()
    return cases
