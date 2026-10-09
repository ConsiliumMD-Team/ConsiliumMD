import datetime
from sqlalchemy.orm import Session
from backend.app.models.audit import AuditEvent

def log_audit_event(
    db: Session,
    actor_id: int,
    actor_role: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: dict,
    ip_address: str = "127.0.0.1"
) -> AuditEvent:
    # Fetch last audit event for cryptographic hash chaining
    last_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    prev_hash = last_event.record_hash if last_event else "GENESIS_HASH_00000000000000000000000000000000000000000000000000000000"
    
    timestamp = datetime.datetime.utcnow()
    record_hash = AuditEvent.compute_hash(
        prev_hash=prev_hash,
        timestamp=timestamp,
        actor_id=actor_id,
        action=action,
        resource_id=resource_id,
        details=details
    )
    
    event = AuditEvent(
        timestamp=timestamp,
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details,
        ip_address=ip_address,
        prev_hash=prev_hash,
        record_hash=record_hash
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def verify_audit_chain(db: Session) -> dict:
    events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
    if not events:
        return {"valid": True, "total_records": 0, "message": "Audit chain empty."}
    
    prev_hash = "GENESIS_HASH_00000000000000000000000000000000000000000000000000000000"
    for event in events:
        if event.prev_hash != prev_hash:
            return {
                "valid": False,
                "broken_at_id": event.id,
                "expected_prev_hash": prev_hash,
                "found_prev_hash": event.prev_hash,
                "message": f"Cryptographic integrity breach detected at event ID {event.id}!"
            }
        
        computed = AuditEvent.compute_hash(
            prev_hash=event.prev_hash,
            timestamp=event.timestamp,
            actor_id=event.actor_id,
            action=event.action,
            resource_id=event.resource_id,
            details=event.details
        )
        if computed != event.record_hash:
            return {
                "valid": False,
                "tampered_id": event.id,
                "expected_hash": computed,
                "found_hash": event.record_hash,
                "message": f"Tampering detected in record contents at event ID {event.id}!"
            }
        prev_hash = event.record_hash
        
    return {"valid": True, "total_records": len(events), "message": "All cryptographic signatures verified intact."}
