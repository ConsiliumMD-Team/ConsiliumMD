import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app, seed_database
from backend.app.database import Base, get_db
from backend.app.services.auth_service import create_access_token
from backend.app.services.carma_engine import carma_engine
from backend.app.services.pharmacogenomics_guardrail import pharmacogenomics_guardrail
from backend.app.services.discrepancy_detector import discrepancy_detector
from backend.app.services.audit_service import verify_audit_chain, log_audit_event
from backend.app.models.user import User
from backend.app.models.patient import Patient

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_consiliummd.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def get_auth_headers(email: str = "doctor@hospital.org", role: str = "doctor", user_id: int = 1):
    token = create_access_token({"sub": email, "role": role, "id": user_id})
    return {"Authorization": f"Bearer {token}"}

# --------------------------------------------------------------------------
# 1. Health & Root Tests
# --------------------------------------------------------------------------
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

# --------------------------------------------------------------------------
# 2. Authentication & RBAC Tests
# --------------------------------------------------------------------------
def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@hospital.org", "password": "doctor123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "doctor"

def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@hospital.org", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_rbac_role_guard_admin_only():
    doc_headers = get_auth_headers("doctor@hospital.org", "doctor", 1)
    res = client.get("/api/v1/admin/users", headers=doc_headers)
    assert res.status_code == 403

    admin_headers = get_auth_headers("admin@hospital.org", "admin", 3)
    res_admin = client.get("/api/v1/admin/users", headers=admin_headers)
    assert res_admin.status_code == 200

# --------------------------------------------------------------------------
# 3. Patient Management Tests
# --------------------------------------------------------------------------
def test_list_and_get_patients():
    headers = get_auth_headers()
    res = client.get("/api/v1/patients", headers=headers)
    assert res.status_code == 200
    patients = res.json()
    assert len(patients) >= 1

    first_id = patients[0]["id"]
    res_detail = client.get(f"/api/v1/patients/{first_id}", headers=headers)
    assert res_detail.status_code == 200
    assert res_detail.json()["id"] == first_id

# --------------------------------------------------------------------------
# 4. CARMA 5-State Reasoning Engine Tests
# --------------------------------------------------------------------------
def test_carma_retrieve_state_when_missing_variables():
    context = {
        "age": 65,
        "gender": "Male",
        "conditions": ["Hyperlipidemia"],
        "medications": [],
        "vitals": {},
        "lab_results": {}
    }
    result = carma_engine.evaluate_clinical_query(context, "Initiate statin therapy for ASCVD risk.")
    assert result["routing_state"] == "RETRIEVE"
    assert len(result["missing_variables"]) > 0

def test_carma_elicit_state_normative_divergence():
    context = {
        "age": 82,
        "gender": "Female",
        "conditions": ["Frail Elderly", "Polypharmacy"],
        "medications": [{"name": "Lisinopril", "dose": "10mg"}],
        "vitals": {"bp_systolic": 138, "bp_diastolic": 80},
        "lab_results": {"ldl": 145, "egfr": 50}
    }
    result = carma_engine.evaluate_clinical_query(context, "Evaluate high-intensity statin for primary prevention in frail 82yo.")
    assert result["routing_state"] == "ELICIT"
    assert result["rpd_score"] > 0.35

def test_carma_warn_state_high_reversal_hazard():
    context = {
        "age": 72,
        "gender": "Male",
        "conditions": ["Hypertension"],
        "medications": [],
        "vitals": {"bp_systolic": 130, "bp_diastolic": 80},
        "lab_results": {"ldl": 120, "egfr": 65, "platelets": 220}
    }
    result = carma_engine.evaluate_clinical_query(context, "Prescribe daily aspirin for primary cardiovascular prevention.")
    assert result["routing_state"] == "WARN"
    assert result["reversal_hazard"] > 0.45

def test_carma_escalate_state_pgx_contraindication():
    context = {
        "age": 70,
        "gender": "Male",
        "conditions": ["Post-PCI Stent"],
        "medications": [],
        "vitals": {"bp_systolic": 130, "bp_diastolic": 80},
        "lab_results": {"ldl": 110, "egfr": 70, "platelets": 200},
        "genomics": {"CYP2C19": "*2/*2 (Poor Metabolizer)"}
    }
    result = carma_engine.evaluate_clinical_query(context, "Initiate Clopidogrel antiplatelet therapy.")
    assert result["routing_state"] == "ESCALATE"

def test_carma_answer_state_consensus():
    context = {
        "age": 64,
        "gender": "Male",
        "conditions": ["Type 2 Diabetes", "CKD Stage 3a"],
        "medications": [],
        "vitals": {"bp_systolic": 130, "bp_diastolic": 80},
        "lab_results": {"egfr": 52.0, "potassium": 4.3, "hba1c": 7.5}
    }
    result = carma_engine.evaluate_clinical_query(context, "Initiate SGLT2i Dapagliflozin for CKD renoprotection.")
    assert result["routing_state"] == "ANSWER"
    assert "recommendation" in result

# --------------------------------------------------------------------------
# 5. Deterministic Pharmacogenomic & Polypharmacy Guardrails
# --------------------------------------------------------------------------
def test_pharmacogenomic_metformin_ckd_guardrail():
    alerts = pharmacogenomics_guardrail.audit_prescription(
        proposed_drug="Metformin",
        active_medications=[],
        conditions=["Chronic Kidney Disease"],
        lab_results={"egfr": 24.0},
        genomics={}
    )
    assert len(alerts) > 0
    assert alerts[0]["type"] == "DRUG_CONDITION_CONTRAINDICATION"
    assert alerts[0]["severity"] == "CRITICAL"

def test_pharmacogenomic_cyp2c19_clopidogrel():
    alerts = pharmacogenomics_guardrail.audit_prescription(
        proposed_drug="Clopidogrel",
        active_medications=[],
        conditions=[],
        lab_results={},
        genomics={"CYP2C19": "*2/*2 (Poor Metabolizer)"}
    )
    assert len(alerts) > 0
    assert alerts[0]["type"] == "PHARMACOGENOMIC_CONTRAINDICATION"
    assert alerts[0]["severity"] == "CRITICAL"

# --------------------------------------------------------------------------
# 6. Multimodal Discrepancy Detection
# --------------------------------------------------------------------------
def test_multimodal_discrepancy_detection():
    anomalies = [{"label": "Cardiomegaly (CTR > 0.55)", "confidence": 0.95}]
    ocr_text = "Chest radiograph: No signs of cardiomegaly, cardiac silhouette is normal."
    report = discrepancy_detector.analyze_cross_modality(
        image_findings=["Cardiomegaly with CTR 0.58"],
        anomalies=anomalies,
        ocr_text=ocr_text
    )
    assert report["has_discrepancy"] is True
    assert report["severity"] == "CRITICAL"

# --------------------------------------------------------------------------
# 7. Immutable Cryptographic Audit Chain Integrity
# --------------------------------------------------------------------------
def test_audit_chain_integrity():
    db = TestingSessionLocal()
    try:
        res = verify_audit_chain(db)
        assert res["valid"] is True

        log_audit_event(
            db=db,
            actor_id=1,
            actor_role="doctor",
            action="TEST_ACTION",
            resource_type="Test",
            resource_id="1",
            details={"msg": "test"}
        )
        res_after = verify_audit_chain(db)
        assert res_after["valid"] is True
    finally:
        db.close()

# --------------------------------------------------------------------------
# 8. SMART on FHIR & Morning Huddle Workflows
# --------------------------------------------------------------------------
def test_morning_huddle_endpoint():
    headers = get_auth_headers()
    res = client.get("/api/v1/workflows/morning-huddle", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "flagged_patients" in data
    assert "census_risk_distribution" in data

def test_institutional_reversal_radar():
    headers = get_auth_headers("admin@hospital.org", "admin", 3)
    res = client.get("/api/v1/admin/reversal-radar", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "departments" in data
    assert "radar_metrics" in data
