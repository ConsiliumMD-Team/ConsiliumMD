import math
import time
import random
from typing import Dict, Any, List

class MockVitalsStreamer:
    """
    IoMT & Real-Time Hardware Telemetry Pipeline (MIMIC-IV Simulation)
    Generates high-frequency ICU telemetry waveforms (Heart Rate, SpO2, NIBP, Respiration)
    with edge anomaly detection.
    """

    @classmethod
    def generate_next_vitals_tick(cls, patient_id: int, base_hr: int = 76, base_spo2: int = 98) -> Dict[str, Any]:
        t = time.time()
        
        # Add subtle biological oscillations (respiratory sinus arrhythmia)
        hr_jitter = math.sin(t * 0.8) * 3 + (random.random() - 0.5) * 2
        spo2_jitter = math.sin(t * 0.2) * 0.5 + (random.random() - 0.5) * 0.5
        
        # Inject occasional acute threshold event for patient 2 (ICU test case)
        if patient_id == 2:
            current_hr = int(base_hr + 24 + hr_jitter)
            current_spo2 = round(max(88.0, min(100.0, base_spo2 - 6 + spo2_jitter)), 1)
        else:
            current_hr = int(base_hr + hr_jitter)
            current_spo2 = round(max(92.0, min(100.0, base_spo2 + spo2_jitter)), 1)

        systolic = int(128 + math.sin(t * 0.1) * 6)
        diastolic = int(78 + math.cos(t * 0.1) * 4)
        resp_rate = int(16 + math.sin(t * 0.3) * 2)

        # Edge-detection threshold breach
        is_breach = False
        breach_alert = None

        if current_spo2 < 91.0:
            is_breach = True
            breach_alert = "Critical Hypoxemia Alert: SpO2 dropped below 91%. Zero-click CARMA re-evaluation triggered."
        elif current_hr > 115:
            is_breach = True
            breach_alert = "Tachycardia Alert: Heart Rate exceeded 115 bpm threshold."

        return {
            "patient_id": patient_id,
            "timestamp": t,
            "heart_rate": current_hr,
            "spo2": current_spo2,
            "bp_systolic": systolic,
            "bp_diastolic": diastolic,
            "respiratory_rate": resp_rate,
            "temp_c": 37.1,
            "is_breach": is_breach,
            "breach_alert": breach_alert,
            "ecg_sample": [round(math.sin(t * 10 + i * 0.2) * (1.2 if (i % 8 == 0) else 0.2), 2) for i in range(16)]
        }

mock_vitals_streamer = MockVitalsStreamer()
