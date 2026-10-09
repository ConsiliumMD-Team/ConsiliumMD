from pydantic import BaseModel
from typing import Optional, Any
import datetime

class PatientBase(BaseModel):
    mrn: str
    full_name: str
    age: int
    gender: str
    blood_type: Optional[str] = "O+"
    room_number: Optional[str] = "ICU-402"
    status: Optional[str] = "Active"
    conditions: list[str] = []
    medications: list[dict[str, Any]] = []
    allergies: list[str] = []
    vitals: dict[str, Any] = {}
    lab_results: dict[str, Any] = {}
    genomics: dict[str, Any] = {}
    organ_states: dict[str, Any] = {}

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    room_number: Optional[str] = None
    status: Optional[str] = None
    conditions: Optional[list[str]] = None
    medications: Optional[list[dict[str, Any]]] = None
    allergies: Optional[list[str]] = None
    vitals: Optional[dict[str, Any]] = None
    lab_results: Optional[dict[str, Any]] = None
    genomics: Optional[dict[str, Any]] = None
    organ_states: Optional[dict[str, Any]] = None

class PatientResponse(PatientBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
