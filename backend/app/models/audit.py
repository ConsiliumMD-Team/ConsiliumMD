import datetime
import hashlib
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from backend.app.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    actor_id = Column(Integer, nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # 'LOGIN', 'VIEW_PATIENT', 'CARMA_QUERY', 'ELICIT_RESOLVED', 'WARN_ACKNOWLEDGED', 'CASE_OVERRIDE', 'ESCALATION_RESOLVED', 'FHIR_EXPORT'
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String(100), default="127.0.0.1")
    
    # Cryptographic immutability hash chain
    prev_hash = Column(String(64), nullable=True)
    record_hash = Column(String(64), nullable=False)

    @staticmethod
    def compute_hash(prev_hash: str, timestamp: datetime.datetime, actor_id: int, action: str, resource_id: str, details: dict) -> str:
        payload = f"{prev_hash}|{timestamp.isoformat()}|{actor_id}|{action}|{resource_id}|{json.dumps(details, sort_keys=True)}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()
