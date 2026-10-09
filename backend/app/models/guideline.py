import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from backend.app.database import Base

class Guideline(Base):
    __tablename__ = "guidelines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., 'ACC_AHA_2019_PRIMARY_PREVENTION'
    title = Column(String(255), nullable=False)
    organization = Column(String(100), nullable=False)  # 'ACC/AHA', 'NICE', 'USPSTF', 'KDIGO', 'ESC'
    domain = Column(String(100), nullable=False)  # 'Cardiology', 'Nephrology', 'Endocrinology'
    publication_year = Column(Integer, nullable=False)
    
    # Mathematical assurance indices
    reversal_hazard = Column(Float, default=0.18)  # Deep survival prediction score
    reversal_zone = Column(String(50), default="SAFE")  # 'SAFE', 'MONITOR', 'HIGH_RISK_FRAGILE'
    normative_weights = Column(JSON, default=dict)  # {"longevity": 0.8, "qol": 0.6, "cost_minimization": 0.3}
    evidence_nodes = Column(JSON, default=list)  # Associated clinical evidence anchors
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class DepartmentNormativePrior(Base):
    __tablename__ = "department_normative_priors"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String(100), unique=True, index=True, nullable=False)
    longevity_weight = Column(Float, default=0.65)
    quality_of_life_weight = Column(Float, default=0.75)
    bleeding_risk_aversion = Column(Float, default=0.80)
    cost_sensitivity = Column(Float, default=0.30)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
