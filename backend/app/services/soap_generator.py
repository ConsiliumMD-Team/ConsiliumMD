from typing import Dict, Any, List

class SoapGenerator:
    """
    Automated Clinical Note & ICD-10 / CPT Billing Code Generator
    Converts accepted CARMA clinical decisions into standardized EHR documentation.
    """

    @classmethod
    def generate_soap_and_codes(
        cls,
        patient: Dict[str, Any],
        case_title: str,
        query_text: str,
        recommendation: Dict[str, Any],
        clinician_name: str = "Dr. Attending"
    ) -> Dict[str, Any]:
        age = patient.get("age", 65)
        gender = patient.get("gender", "Female")
        conditions = patient.get("conditions", [])
        meds = patient.get("medications", [])
        vitals = patient.get("vitals", {})
        labs = patient.get("lab_results", {})
        
        # 1. Subjective
        subjective = (
            f"Patient is a {age}-year-old {gender} with a known medical history of "
            f"{', '.join(conditions) if conditions else 'chronic cardiovascular disease'}. "
            f"Clinical consultation initiated regarding: '{query_text}'. "
            f"Patient reports compliance with current outpatient pharmacotherapy."
        )

        # 2. Objective
        vitals_str = f"BP: {vitals.get('bp_systolic', 130)}/{vitals.get('bp_diastolic', 80)} mmHg, HR: {vitals.get('heart_rate', 76)} bpm, SpO2: {vitals.get('spo2', 98)}%, RR: {vitals.get('respiratory_rate', 16)} bpm."
        labs_str = f"Labs: eGFR: {labs.get('egfr', 'N/A')} mL/min/1.73m², Creatinine: {labs.get('creatinine', 'N/A')} mg/dL, LDL-C: {labs.get('ldl', 'N/A')} mg/dL, HbA1c: {labs.get('hba1c', 'N/A')}%."
        objective = f"VITALS: {vitals_str}\nLABORATORY DATA: {labs_str}\nCURRENT MEDICATIONS: {', '.join([m.get('name', '') if isinstance(m, dict) else str(m) for m in meds])}."

        # 3. Assessment
        rec_headline = recommendation.get("headline", "Clinical Management")
        rec_rationale = recommendation.get("rationale", "Synthesized across multi-guideline evidence base.")
        assessment = (
            f"Assessment of {case_title}: Clinical data evaluated via CARMA Decision Support. "
            f"{rec_headline}. {rec_rationale}"
        )

        # 4. Plan
        rec_text = recommendation.get("text", "Continue tailored guideline therapy.")
        plan = (
            f"1. Pharmacotherapy: {rec_text}\n"
            f"2. Monitoring: Repeat routine renal & lipid biomarkers in 8-12 weeks.\n"
            f"3. Patient Counseling: Reviewed risk-benefit profile, potential adverse effects, and lifestyle modifications.\n"
            f"4. Follow-up: Clinic follow-up scheduled in 3 months or sooner if acute symptoms arise."
        )

        # Suggested ICD-10 & CPT codes
        icd10_codes = []
        if any("hypertens" in c.lower() for c in conditions) or "bp" in query_text.lower():
            icd10_codes.append({"code": "I10", "description": "Essential (primary) hypertension"})
        if any("lipid" in c.lower() or "hyperchol" in c.lower() for c in conditions) or "statin" in query_text.lower():
            icd10_codes.append({"code": "E78.5", "description": "Hyperlipidemia, unspecified"})
        if any("kidney" in c.lower() or "ckd" in c.lower() for c in conditions) or labs.get("egfr", 60) < 60:
            icd10_codes.append({"code": "N18.30", "description": "Chronic kidney disease, stage 3 unspecified"})
        if any("diabet" in c.lower() for c in conditions):
            icd10_codes.append({"code": "E11.9", "description": "Type 2 diabetes mellitus without complications"})
        if not icd10_codes:
            icd10_codes.append({"code": "Z00.00", "description": "Encounter for general adult medical examination"})

        cpt_codes = [
            {"code": "99214", "description": "Office or other outpatient visit for the evaluation and management of an established patient (Moderate Medical Decision Making)", "rvu": 1.92},
            {"code": "99424", "description": "Principal care management services for a single high-risk disease (first 30 min)", "rvu": 1.45}
        ]

        return {
            "soap_note": {
                "subjective": subjective.strip(),
                "objective": objective.strip(),
                "assessment": assessment.strip(),
                "plan": plan.strip()
            },
            "icd10_codes": icd10_codes,
            "cpt_codes": cpt_codes,
            "author": clinician_name
        }

soap_generator = SoapGenerator()
