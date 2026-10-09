import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User, Patient, ClinicalCase, AuditEvent, Guideline, DepartmentNormativePrior
from backend.app.services.auth_service import get_password_hash
from backend.app.services.audit_service import log_audit_event
from backend.app.api.auth import router as auth_router
from backend.app.api.patients import router as patients_router
from backend.app.api.carma import router as carma_router
from backend.app.api.multimodal import router as multimodal_router
from backend.app.api.telemetry import router as telemetry_router
from backend.app.api.workflows import router as workflows_router
from backend.app.api.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("consiliummd")

def seed_database(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    try:
        # 1. Seed RBAC Users
        if db.query(User).count() == 0:
            demo_users = [
                User(
                    email="doctor@hospital.org",
                    hashed_password=get_password_hash("doctor123"),
                    full_name="Dr. Elena Rostova, MD",
                    role="doctor",
                    department="Cardiology"
                ),
                User(
                    email="reviewer@hospital.org",
                    hashed_password=get_password_hash("reviewer123"),
                    full_name="Prof. Marcus Sterling, MD, FACC",
                    role="reviewer",
                    department="Clinical Review Board"
                ),
                User(
                    email="admin@hospital.org",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Sarah Jenkins, JD, CPHRM",
                    role="admin",
                    department="Hospital Compliance & Risk"
                ),
                User(
                    email="nurse@hospital.org",
                    hashed_password=get_password_hash("nurse123"),
                    full_name="David Kim, BSN, RN",
                    role="nurse",
                    department="Cardiovascular ICU"
                )
            ]
            db.add_all(demo_users)
            db.commit()
            logger.info("Demo RBAC users seeded.")

        # 2. Seed Realistic MIMIC-IV Clinical Patients
        if db.query(Patient).count() == 0:
            admin_user = db.query(User).filter(User.role == "admin").first()
            admin_id = admin_user.id if admin_user else 1

            sample_patients = [
                Patient(
                    mrn="MIMIC-IV-84920",
                    full_name="Arthur Pendelton",
                    age=79,
                    gender="Male",
                    blood_type="A+",
                    room_number="ICU-402",
                    status="Active",
                    conditions=["Chronic Kidney Disease Stage 3b", "Type 2 Diabetes Mellitus", "Hypertension", "Post-PCI Stent (2025)"],
                    medications=[
                        {"name": "Metformin", "dose": "500mg", "freq": "BID"},
                        {"name": "Lisinopril", "dose": "20mg", "freq": "Daily"},
                        {"name": "Clopidogrel", "dose": "75mg", "freq": "Daily"},
                        {"name": "Aspirin", "dose": "81mg", "freq": "Daily"}
                    ],
                    allergies=["Penicillin (Anaphylaxis)", "Sulfa"],
                    vitals={"heart_rate": 82, "bp_systolic": 142, "bp_diastolic": 88, "spo2": 96.5, "respiratory_rate": 18, "temp_c": 37.0},
                    lab_results={"egfr": 36.2, "creatinine": 1.88, "ldl": 144, "hba1c": 7.9, "potassium": 4.7, "platelets": 185},
                    genomics={"CYP2C19": "*2/*2 (Poor Metabolizer)", "CYP2D6": "*1/*1 (Normal)"},
                    organ_states={"heart": "warning", "lungs": "normal", "kidneys": "critical", "brain": "normal", "liver": "normal", "vascular": "warning"}
                ),
                Patient(
                    mrn="MIMIC-IV-91044",
                    full_name="Beatrice Holloway",
                    age=82,
                    gender="Female",
                    blood_type="O+",
                    room_number="STEPDOWN-210",
                    status="Active",
                    conditions=["Heart Failure with Reduced Ejection Fraction (HFrEF 32%)", "Atrial Fibrillation", "Primary Hypertension"],
                    medications=[
                        {"name": "Sacubitril/Valsartan", "dose": "24/26mg", "freq": "BID"},
                        {"name": "Metoprolol Succinate", "dose": "50mg", "freq": "Daily"},
                        {"name": "Apixaban", "dose": "5mg", "freq": "BID"},
                        {"name": "Furosemide", "dose": "40mg", "freq": "Daily"}
                    ],
                    allergies=["Codeine"],
                    vitals={"heart_rate": 88, "bp_systolic": 118, "bp_diastolic": 72, "spo2": 93.0, "respiratory_rate": 20, "temp_c": 36.8},
                    lab_results={"egfr": 44.0, "creatinine": 1.45, "bnp": 840, "potassium": 4.9, "ldl": 98, "hba1c": 6.1},
                    genomics={"CYP2C19": "*1/*1 (Normal)", "CYP2D6": "*4/*4 (Poor Metabolizer)"},
                    organ_states={"heart": "critical", "lungs": "warning", "kidneys": "warning", "brain": "normal", "liver": "normal", "vascular": "normal"}
                ),
                Patient(
                    mrn="MIMIC-IV-67219",
                    full_name="Clara Vance",
                    age=64,
                    gender="Female",
                    blood_type="B+",
                    room_number="CLINIC-A3",
                    status="Active",
                    conditions=["Hyperlipidemia", "Pre-Diabetes", "Borderline Hypertension"],
                    medications=[
                        {"name": "Hydrochlorothiazide", "dose": "12.5mg", "freq": "Daily"}
                    ],
                    allergies=["No Known Drug Allergies (NKDA)"],
                    vitals={"heart_rate": 72, "bp_systolic": 134, "bp_diastolic": 82, "spo2": 99.0, "respiratory_rate": 14, "temp_c": 36.9},
                    lab_results={"egfr": 88.0, "creatinine": 0.85, "ldl": 162, "hba1c": 5.9, "potassium": 4.2},
                    genomics={"CYP2C19": "*1/*1", "CYP2D6": "*1/*1"},
                    organ_states={"heart": "normal", "lungs": "normal", "kidneys": "normal", "brain": "normal", "liver": "normal", "vascular": "warning"}
                )
            ]
            db.add_all(sample_patients)
            db.commit()
            logger.info("MIMIC-IV sample patients seeded.")

            log_audit_event(
                db=db,
                actor_id=admin_id,
                actor_role="admin",
                action="SYSTEM_INIT_SEED",
                resource_type="System",
                resource_id="0",
                details={"message": "ConsiliumMD clinical database genesis initialized."}
            )

        # 3. Seed Department Priors
        if db.query(DepartmentNormativePrior).count() == 0:
            priors = [
                DepartmentNormativePrior(department="Cardiology", longevity_weight=0.85, quality_of_life_weight=0.65, bleeding_risk_aversion=0.80, cost_sensitivity=0.30),
                DepartmentNormativePrior(department="Geriatrics", longevity_weight=0.40, quality_of_life_weight=0.92, bleeding_risk_aversion=0.88, cost_sensitivity=0.45),
                DepartmentNormativePrior(department="Nephrology", longevity_weight=0.75, quality_of_life_weight=0.70, bleeding_risk_aversion=0.60, cost_sensitivity=0.35)
            ]
            db.add_all(priors)
            db.commit()

    finally:
        if close_db:
            db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized.")
    seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Clinical Decision Support Platform for CARMA (Conflict-Aware Reasoning with Mathematical Assurance)",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(patients_router, prefix=settings.API_V1_STR)
app.include_router(carma_router, prefix=settings.API_V1_STR)
app.include_router(multimodal_router, prefix=settings.API_V1_STR)
app.include_router(telemetry_router, prefix=settings.API_V1_STR)
app.include_router(workflows_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "HEALTHY",
        "docs_url": "/docs",
        "supported_roles": ["doctor", "reviewer", "admin", "nurse"]
    }
