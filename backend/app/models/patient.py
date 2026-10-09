import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from backend.app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String(50), unique=True, index=True, nullable=False)  # Medical Record Number
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    blood_type = Column(String(10), default="O+")
    room_number = Column(String(20), default="ICU-402")
    status = Column(String(50), default="Active")  # 'Active', 'Discharged', 'Critical'
    
    # Clinical profiles (stored as structured JSON)
    conditions = Column(JSON, default=list)  # e.g., ["Type 2 Diabetes", "Chronic Kidney Disease Stage 3b", "Hypertension"]
    medications = Column(JSON, default=list)  # e.g., [{"name": "Lisinopril", "dose": "20mg", "freq": "daily"}]
    allergies = Column(JSON, default=list)  # e.g., ["Penicillin", "Sulfa drugs"]
    vitals = Column(JSON, default=dict)  # e.g., {"heart_rate": 84, "bp_systolic": 138, "bp_diastolic": 86, "spo2": 97, "respiratory_rate": 18, "temp_c": 37.1}
    lab_results = Column(JSON, default=dict)  # e.g., {"egfr": 42.5, "creatinine": 1.7, "ldl": 142, "hba1c": 8.1, "potassium": 4.6}
    genomics = Column(JSON, default=dict)  # e.g., {"CYP2C19": "*2/*2 (Poor Metabolizer)", "CYP2D6": "*1/*1 (Normal)"}
    organ_states = Column(JSON, default=dict)  # for 3D twin: {"heart": "normal", "lungs": "warning", "kidneys": "critical", "brain": "normal", "liver": "normal"}

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
