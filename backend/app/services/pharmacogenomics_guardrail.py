from typing import List, Dict, Any

class PharmacogenomicGuardrail:
    """
    Deterministic Safety Auditor (RxNorm / SIDER / CPIC Pharmacogenomic Rule Engine)
    Strict Zero-Hallucination rule enforcement for drug dosages, gene-drug interactions,
    and polypharmacy contraindications.
    """

    # Gene-drug CPIC matrix
    GENE_DRUG_RULES = {
        "CYP2C19": {
            "Poor Metabolizer": {
                "contraindicated": ["Clopidogrel", "Plavix"],
                "recommendation": "CYP2C19 Poor Metabolizer identified (*2/*2 or *3/*3). Clopidogrel activation impaired. Switch to Ticagrelor 90mg BID or Prasugrel 10mg daily as per CPIC Level A guidelines.",
                "severity": "CRITICAL"
            }
        },
        "CYP2D6": {
            "Poor Metabolizer": {
                "contraindicated": ["Codeine", "Tramadol"],
                "recommendation": "CYP2D6 Poor Metabolizer detected. Ineffective prodrug bioactivation. Prescribe alternative non-opioid or direct-acting analgesic (e.g., Morphine or Acetaminophen).",
                "severity": "WARNING"
            },
            "Ultrarapid Metabolizer": {
                "contraindicated": ["Codeine", "Tramadol"],
                "recommendation": "CYP2D6 Ultrarapid Metabolizer detected. Extreme risk of rapid morphine toxicity and respiratory depression. Strictly contraindicated.",
                "severity": "CRITICAL"
            }
        },
        "SLCO1B1": {
            "Decreased Function": {
                "contraindicated": ["Simvastatin 80mg", "Simvastatin 40mg"],
                "recommendation": "SLCO1B1 (*5 allele) present. High statin myopathy and rhabdomyolysis risk. Lower Simvastatin to <=20mg or switch to Rosuvastatin / Pravastatin.",
                "severity": "WARNING"
            }
        }
    }

    # Deterministic Drug-Drug and Drug-Condition Contraindications (RxNorm/SIDER)
    CONTRAINDICATION_RULES = [
        {
            "trigger_med": "Metformin",
            "condition": "Chronic Kidney Disease",
            "lab_check": lambda labs: labs.get("egfr", 60) < 30,
            "warning": "Lactic Acidosis Risk: Metformin is contraindicated in CKD Stage 4/5 (eGFR < 30 mL/min/1.73m²).",
            "severity": "CRITICAL"
        },
        {
            "trigger_med": "Lisinopril",
            "co_med": "Spironolactone",
            "lab_check": lambda labs: labs.get("potassium", 4.0) > 5.0,
            "warning": "Severe Hyperkalemia Risk: Concurrent ACE inhibitor (Lisinopril) and Mineralocorticoid Antagonist (Spironolactone) with serum K+ > 5.0 mEq/L.",
            "severity": "CRITICAL"
        },
        {
            "trigger_med": "Atorvastatin",
            "co_med": "Gemfibrozil",
            "warning": "Rhabdomyolysis Risk: Concomitant Atorvastatin and Gemfibrozil dramatically increases risk of severe myopathy. Switch fibrate to Fenofibrate.",
            "severity": "CRITICAL"
        },
        {
            "trigger_med": "Warfarin",
            "co_med": "Ibuprofen",
            "warning": "Gastrointestinal Bleeding Risk: Concomitant Warfarin and NSAIDs exponentially elevates major bleeding hazard.",
            "severity": "WARNING"
        },
        {
            "trigger_med": "SGLT2i",
            "condition": "Type 1 Diabetes",
            "warning": "Euglycemic DKA Risk: SGLT2 inhibitors (Empagliflozin/Dapagliflozin) carry boxed warning for euglycemic ketoacidosis in T1D.",
            "severity": "CRITICAL"
        }
    ]

    @classmethod
    def audit_prescription(
        cls,
        proposed_drug: str,
        active_medications: List[Dict[str, Any]],
        conditions: List[str],
        lab_results: Dict[str, Any],
        genomics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        alerts = []

        # 1. Pharmacogenomic Gene-Drug check
        for gene, alleles in genomics.items():
            if gene in cls.GENE_DRUG_RULES:
                for phenotype, rule_info in cls.GENE_DRUG_RULES[gene].items():
                    if phenotype.lower() in str(alleles).lower():
                        for contra_drug in rule_info["contraindicated"]:
                            if contra_drug.lower() in proposed_drug.lower():
                                alerts.append({
                                    "type": "PHARMACOGENOMIC_CONTRAINDICATION",
                                    "severity": rule_info["severity"],
                                    "gene": gene,
                                    "phenotype": phenotype,
                                    "drug": proposed_drug,
                                    "description": rule_info["recommendation"]
                                })

        # 2. Drug-Drug and Drug-Disease Checks
        active_med_names = [m.get("name", "") if isinstance(m, dict) else str(m) for m in active_medications]
        
        for rule in cls.CONTRAINDICATION_RULES:
            # Check if proposed drug matches trigger or co-med
            is_trigger = rule.get("trigger_med", "").lower() in proposed_drug.lower()
            if not is_trigger:
                continue

            # Check co-med
            if "co_med" in rule:
                has_co_med = any(rule["co_med"].lower() in med.lower() for med in active_med_names)
                if has_co_med:
                    lab_violation = rule["lab_check"](lab_results) if "lab_check" in rule else True
                    if lab_violation:
                        alerts.append({
                            "type": "POLYPHARMACY_INTERACTION",
                            "severity": rule["severity"],
                            "drug_a": proposed_drug,
                            "drug_b": rule["co_med"],
                            "description": rule["warning"]
                        })

            # Check condition
            if "condition" in rule:
                has_condition = any(rule["condition"].lower() in cond.lower() for cond in conditions)
                if has_condition:
                    lab_violation = rule["lab_check"](lab_results) if "lab_check" in rule else True
                    if lab_violation:
                        alerts.append({
                            "type": "DRUG_CONDITION_CONTRAINDICATION",
                            "severity": rule["severity"],
                            "drug": proposed_drug,
                            "condition": rule["condition"],
                            "description": rule["warning"]
                        })

        return alerts

pharmacogenomics_guardrail = PharmacogenomicGuardrail()
