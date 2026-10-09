from pydantic import BaseModel
from typing import Any

class FhirExportResponse(BaseModel):
    resource_type: str = "Bundle"
    bundle_type: str = "transaction"
    patient_id: int
    case_id: int
    total_entries: int
    fhir_bundle: dict[str, Any]
    exported_at: str
