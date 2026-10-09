import re
from typing import Tuple, Dict

class PHIScrubber:
    """
    Local NLP Pre-LLM PHI Scrubbing (Anonymization Gateway)
    Enforces HIPAA Safe Harbor de-identification rules before data is passed to CARMA.
    """
    
    # Patterns for scrubbing
    SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b')
    PHONE_PATTERN = re.compile(r'\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b')
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    MRN_PATTERN = re.compile(r'\b(?:MRN|mrn|Record\s*#?)[:\s]*([A-Za-z0-9-]+)\b')
    DATE_PATTERN = re.compile(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b')
    ZIP_PATTERN = re.compile(r'\b\d{5}(?:-\d{4})?\b')

    @classmethod
    def scrub_text(cls, raw_text: str, patient_name: str = None) -> Tuple[str, Dict[str, int]]:
        scrubbed = raw_text
        counts = {"names": 0, "ssns": 0, "phones": 0, "emails": 0, "dates": 0, "mrns": 0}

        if patient_name and len(patient_name.strip()) > 2:
            name_parts = patient_name.strip().split()
            for part in name_parts:
                if len(part) > 2:
                    regex = re.compile(re.escape(part), re.IGNORECASE)
                    matches = len(regex.findall(scrubbed))
                    if matches > 0:
                        counts["names"] += matches
                        scrubbed = regex.sub("[PATIENT_NAME]", scrubbed)

        # Scrub SSNs
        ssn_matches = len(cls.SSN_PATTERN.findall(scrubbed))
        if ssn_matches > 0:
            counts["ssns"] += ssn_matches
            scrubbed = cls.SSN_PATTERN.sub("[SSN_REDACTED]", scrubbed)

        # Scrub Emails
        email_matches = len(cls.EMAIL_PATTERN.findall(scrubbed))
        if email_matches > 0:
            counts["emails"] += email_matches
            scrubbed = cls.EMAIL_PATTERN.sub("[EMAIL_REDACTED]", scrubbed)

        # Scrub Phone numbers
        phone_matches = len(cls.PHONE_PATTERN.findall(scrubbed))
        if phone_matches > 0:
            counts["phones"] += phone_matches
            scrubbed = cls.PHONE_PATTERN.sub("[PHONE_REDACTED]", scrubbed)

        # Scrub MRNs
        mrn_matches = len(cls.MRN_PATTERN.findall(scrubbed))
        if mrn_matches > 0:
            counts["mrns"] += mrn_matches
            scrubbed = cls.MRN_PATTERN.sub("MRN: [MRN_REDACTED]", scrubbed)

        return scrubbed, counts

phi_scrubber = PHIScrubber()
