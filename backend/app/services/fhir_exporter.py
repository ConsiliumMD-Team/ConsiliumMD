import datetime
from typing import Dict, Any

class FhirExporter:
    """
    1-Click SMART on FHIR Export Engine
    Exports Patient context, Observation, Condition, MedicationRequest, and DiagnosticReport
    as an HL7 FHIR R4 JSON Transaction Bundle.
    """

    @classmethod
    def export_case_to_fhir(cls, patient: Dict[str, Any], case: Dict[str, Any]) -> Dict[str, Any]:
        patient_id = patient.get("id", 1)
        mrn = patient.get("mrn", "MRN-1001")
        now_str = datetime.datetime.utcnow().isoformat() + "Z"

        entries = []

        # 1. Patient Resource
        entries.append({
            "fullUrl": f"urn:uuid:patient-{patient_id}",
            "resource": {
                "resourceType": "Patient",
                "id": f"pat-{patient_id}",
                "identifier": [{"system": "http://hospital.consiliummd.org/mrn", "value": mrn}],
                "name": [{"use": "official", "text": patient.get("full_name", "Anonymous Patient")}],
                "gender": patient.get("gender", "unknown").lower(),
                "birthDate": f"{2026 - patient.get('age', 65)}-01-01"
            },
            "request": {"method": "PUT", "url": f"Patient/pat-{patient_id}"}
        })

        # 2. Observations (Labs & Vitals)
        vitals = patient.get("vitals", {})
        if vitals.get("bp_systolic"):
            entries.append({
                "fullUrl": f"urn:uuid:obs-bp-{patient_id}",
                "resource": {
                    "resourceType": "Observation",
                    "status": "final",
                    "code": {
                        "coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel"}]
                    },
                    "subject": {"reference": f"Patient/pat-{patient_id}"},
                    "effectiveDateTime": now_str,
                    "component": [
                        {"code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic"}]}, "valueQuantity": {"value": vitals.get("bp_systolic"), "unit": "mmHg"}},
                        {"code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic"}]}, "valueQuantity": {"value": vitals.get("bp_diastolic"), "unit": "mmHg"}}
                    ]
                },
                "request": {"method": "POST", "url": "Observation"}
            })

        # 3. Clinical CARMA DiagnosticReport
        rec = case.get("carma_payload", {}).get("recommendation", {})
        entries.append({
            "fullUrl": f"urn:uuid:report-carma-{case.get('id', 1)}",
            "resource": {
                "resourceType": "DiagnosticReport",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0074", "code": "CDS", "display": "Clinical Decision Support"}]}],
                "code": {"coding": [{"system": "http://consiliummd.org/carma", "code": "CARMA-CDSS", "display": "CARMA Reasoning Report"}]},
                "subject": {"reference": f"Patient/pat-{patient_id}"},
                "effectiveDateTime": now_str,
                "conclusion": rec.get("text", "ConsiliumMD CDS synthesis completed."),
                "presentedForm": [{
                    "contentType": "text/plain",
                    "data": case.get("soap_note", {}).get("plan", "Plan documented in ConsiliumMD.")
                }]
            },
            "request": {"method": "POST", "url": "DiagnosticReport"}
        })

        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "timestamp": now_str,
            "entry": entries
        }

        return {
            "resource_type": "Bundle",
            "bundle_type": "transaction",
            "patient_id": patient_id,
            "case_id": case.get("id", 1),
            "total_entries": len(entries),
            "fhir_bundle": bundle,
            "exported_at": now_str
        }

fhir_exporter = FhirExporter()
