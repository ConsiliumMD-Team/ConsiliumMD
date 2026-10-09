import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.iomt_streamer import mock_vitals_streamer
from backend.app.services.vram_orchestrator import vram_orchestrator

router = APIRouter(prefix="/telemetry", tags=["IoMT & Real-Time Hardware Telemetry"])

@router.get("/snapshot/{patient_id}")
def get_vitals_snapshot(patient_id: int):
    return mock_vitals_streamer.generate_next_vitals_tick(patient_id)

@router.get("/vram-status")
def get_vram_status():
    return vram_orchestrator.get_status()

@router.websocket("/ws/{patient_id}")
async def websocket_telemetry_endpoint(websocket: WebSocket, patient_id: int):
    await websocket.accept()
    try:
        while True:
            vitals = mock_vitals_streamer.generate_next_vitals_tick(patient_id)
            await websocket.send_json(vitals)
            await asyncio.sleep(1.0)  # 1 Hz streaming rate
    except WebSocketDisconnect:
        pass
