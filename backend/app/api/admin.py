from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.audit import AuditEvent
from backend.app.models.guideline import DepartmentNormativePrior, Guideline
from backend.app.schemas.auth import UserResponse
from backend.app.services.auth_service import require_roles, get_current_user
from backend.app.services.audit_service import verify_audit_chain
from backend.app.services.reversal_surveillance import reversal_surveillance

router = APIRouter(prefix="/admin", tags=["Admin & Compliance Management"])

@router.get("/reversal-radar")
def get_institutional_reversal_radar(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "reviewer", "doctor"]))
):
    return reversal_surveillance.get_institutional_reversal_radar(db)

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "reviewer"]))
):
    logs = db.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(limit).all()
    return logs

@router.get("/verify-audit-chain")
def verify_audit_integrity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    return verify_audit_chain(db)

@router.get("/users", response_model=list[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    return db.query(User).all()

@router.get("/normative-priors")
def get_department_normative_priors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    priors = db.query(DepartmentNormativePrior).all()
    if not priors:
        # Return sensible defaults if empty
        return [
            {"department": "Cardiology", "longevity_weight": 0.85, "quality_of_life_weight": 0.65, "bleeding_risk_aversion": 0.80, "cost_sensitivity": 0.30},
            {"department": "Geriatrics", "longevity_weight": 0.45, "quality_of_life_weight": 0.90, "bleeding_risk_aversion": 0.85, "cost_sensitivity": 0.40},
            {"department": "Nephrology", "longevity_weight": 0.75, "quality_of_life_weight": 0.70, "bleeding_risk_aversion": 0.60, "cost_sensitivity": 0.35}
        ]
    return priors
