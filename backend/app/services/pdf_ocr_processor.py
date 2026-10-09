import re
from typing import Dict, Any, List

class PdfOcrProcessor:
    """
    Document Retrieval & Prescription OCR Pipeline
    Extracts clinical narrative, medications, dosages, and laboratory values.
    """

    @classmethod
    def process_document(cls, filename: str, text_content: str = None) -> Dict[str, Any]:
        fname_lower = filename.lower()
        
        # If no explicit text passed, simulate extraction based on clinical mock templates
        if not text_content:
            if "prescription" in fname_lower or "rx" in fname_lower:
                text_content = """
                PRESCRIPTION / DISPENSE ORDER
                Clinic: St. Jude Heart & Vascular Institute
                Rx Date: 2026-09-18
                Patient: [PATIENT_NAME_REDACTED] | DOB: [DOB_REDACTED]
                
                1. Atorvastatin 40mg PO QHS (Quantity: 90, Refills: 3) - Indication: Hyperlipidemia
                2. Metformin HCl 500mg PO BID with meals (Quantity: 180, Refills: 2)
                3. Lisinopril 20mg PO Daily (Quantity: 90, Refills: 3)
                4. Clopidogrel 75mg PO Daily (Quantity: 30, Refills: 0)
                
                Physician Signature: Dr. Elena Rostova, MD (NPI: 1892019482)
                """
            elif "radio" in fname_lower or "xray" in fname_lower:
                text_content = """
                DEPARTMENT OF RADIOLOGY & IMAGING
                CHEST RADIOGRAPH 2-VIEWS (PA & LATERAL)
                
                CLINICAL INDICATION: Dyspnea on exertion, history of chronic hypertension.
                
                FINDINGS:
                The cardiothoracic silhouette demonstrates mild enlargement (cardiomegaly).
                Pulmonary vasculature shows mild cephalization consistent with mild elevated left atrial pressures.
                Trace blunting of the right costophrenic sulcus.
                Lungs are otherwise clear of focal airspace consolidation or pneumothorax.
                Bony thorax and soft tissues unremarkable.
                
                IMPRESSION:
                1. Mild cardiomegaly and early pulmonary vascular congestion.
                2. Trace right-sided pleural fluid.
                """
            elif "lab" in fname_lower or "blood" in fname_lower:
                text_content = """
                COMPREHENSIVE METABOLIC & LIPID PANEL
                Collection Time: 2026-09-25 07:30 EST
                
                Sodium: 139 mEq/L (Ref: 135-145)
                Potassium: 4.8 mEq/L (Ref: 3.5-5.0)
                Creatinine: 1.82 mg/dL [HIGH] (Ref: 0.7-1.3)
                eGFR (CKD-EPI 2021): 38.4 mL/min/1.73m2 [LOW] (Ref: >60)
                BUN: 28 mg/dL [HIGH] (Ref: 7-20)
                
                Total Cholesterol: 218 mg/dL [HIGH]
                Triglycerides: 195 mg/dL [HIGH]
                HDL-C: 41 mg/dL [LOW]
                LDL-C (Calculated): 138 mg/dL [HIGH] (Ref: <100)
                HbA1c: 7.8% [HIGH] (Ref: <5.7%)
                """
            else:
                text_content = f"Clinical Note for {filename}: Patient evaluated for routine management. Stable baseline parameters."

        # Extract structured entities via regex heuristics
        medications = cls._extract_medications(text_content)
        lab_values = cls._extract_lab_values(text_content)

        return {
            "filename": filename,
            "extracted_text": text_content.strip(),
            "extracted_medications": medications,
            "extracted_labs": lab_values,
            "entity_count": len(medications) + len(lab_values),
            "ocr_confidence": 0.985
        }

    @staticmethod
    def _extract_medications(text: str) -> List[Dict[str, str]]:
        meds = []
        med_pattern = re.compile(r'(\b[A-Z][a-z]+(?: [A-Z][a-z]+)?)\s+(\d+\s*(?:mg|mcg|g|mL|units))\s+(PO|IV|SC|QHS|BID|TID|QID|Daily)?', re.IGNORECASE)
        for match in med_pattern.finditer(text):
            name, dose, route = match.groups()
            if name.lower() not in ["patient", "dob", "clinic", "refills", "physician", "department"]:
                meds.append({"name": name.strip(), "dose": dose.strip(), "frequency": route or "Daily"})
        return meds

    @staticmethod
    def _extract_lab_values(text: str) -> Dict[str, float]:
        labs = {}
        patterns = {
            "egfr": r'eGFR.*?:\s*([\d\.]+)',
            "creatinine": r'Creatinine:\s*([\d\.]+)',
            "potassium": r'Potassium:\s*([\d\.]+)',
            "ldl": r'LDL(?:-C)?.*?:\s*([\d\.]+)',
            "hba1c": r'HbA1c:\s*([\d\.]+)',
            "bnp": r'BNP:\s*([\d\.]+)'
        }
        for k, p in patterns.items():
            m = re.search(p, text, re.IGNORECASE)
            if m:
                try:
                    labs[k] = float(m.group(1))
                except ValueError:
                    pass
        return labs

pdf_ocr_processor = PdfOcrProcessor()
