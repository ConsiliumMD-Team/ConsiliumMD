from typing import Dict, Any
from backend.app.services.carma_engine import carma_engine

class CounterfactualEngine:
    """
    'What-If' Counterfactual Simulation Engine
    Allows clinicians to dynamically adjust continuous patient biomarkers (Age, eGFR, SBP, LDL, HbA1c)
    and observe real-time trajectory shifts across the 2D Confidence Space.
    """

    @classmethod
    def simulate(cls, base_patient: Dict[str, Any], tweaks: Dict[str, Any], query_text: str) -> Dict[str, Any]:
        simulated_patient = dict(base_patient)
        simulated_patient["vitals"] = dict(base_patient.get("vitals", {}))
        simulated_patient["lab_results"] = dict(base_patient.get("lab_results", {}))

        # Apply tweaks
        if "age" in tweaks:
            simulated_patient["age"] = int(tweaks["age"])
        if "bp_systolic" in tweaks:
            simulated_patient["vitals"]["bp_systolic"] = float(tweaks["bp_systolic"])
        if "egfr" in tweaks:
            simulated_patient["lab_results"]["egfr"] = float(tweaks["egfr"])
        if "ldl" in tweaks:
            simulated_patient["lab_results"]["ldl"] = float(tweaks["ldl"])
        if "hba1c" in tweaks:
            simulated_patient["lab_results"]["hba1c"] = float(tweaks["hba1c"])

        # Re-evaluate query with tweaked parameters
        carma_result = carma_engine.evaluate_clinical_query(
            patient_context=simulated_patient,
            query_text=query_text
        )

        return {
            "tweaked_parameters": tweaks,
            "simulated_patient": simulated_patient,
            "routing_state": carma_result.get("routing_state"),
            "rpd_score": carma_result.get("rpd_score"),
            "reversal_hazard": carma_result.get("reversal_hazard"),
            "confidence_score": carma_result.get("confidence_score"),
            "recommendation": carma_result.get("recommendation"),
            "confidence_space": carma_result.get("confidence_space"),
            "argument_flow": carma_result.get("argument_flow")
        }

counterfactual_engine = CounterfactualEngine()
