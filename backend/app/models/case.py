import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Float, Boolean
from backend.app.database import Base

class ClinicalCase(Base):
    __tablename__ = "clinical_cases"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    query_text = Column(Text, nullable=False)
    status = Column(String(50), default="Pending")  # 'Pending', 'Resolved', 'Overridden', 'Escalated'
    
    # 5-State CARMA Routing
    # 'ANSWER', 'RETRIEVE', 'ELICIT', 'WARN', 'ESCALATE'
    routing_state = Column(String(50), nullable=False, default="ANSWER")
    
    # Mathematical assurance scores
    rpd_score = Column(Float, default=0.0)  # Revealed-Preference Divergence severity
    reversal_hazard = Column(Float, default=0.0)  # Longitudinal Reversal Hazard
    confidence_score = Column(Float, default=0.92)  # Aggregate evidence confidence
    
    # Structured CARMA payload
    extracted_context = Column(JSON, default=dict)
    carma_payload = Column(JSON, default=dict)  # recommendation, argument_flow, 2d_space, replay_steps
    
    # Resolution details
    elicit_preferences = Column(JSON, default=dict)  # {"longevity_vs_qol": 0.7, "risk_tolerance": 0.4}
    retrieved_variables = Column(JSON, default=dict)  # missing variables filled
    warning_acknowledged = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    escalation_notes = Column(Text, nullable=True)
    senior_resolution = Column(Text, nullable=True)
    
    # Generated notes & codes
    soap_note = Column(JSON, default=dict)  # {"subjective": "...", "objective": "...", "assessment": "...", "plan": "..."}
    icd10_codes = Column(JSON, default=list)  # [{"code": "I10", "description": "Essential hypertension"}]
    cpt_codes = Column(JSON, default=list)  # [{"code": "99214", "description": "Office/outpatient visit est"}]
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
