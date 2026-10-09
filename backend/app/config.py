import os

class Settings:
    PROJECT_NAME: str = "ConsiliumMD - Clinical Decision Support Platform for CARMA"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "consiliummd-super-secret-production-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./consiliummd.db")
    PHI_SCRUBBING_ENABLED: bool = True
    VRAM_LIMIT_MB: int = 6144  # 6GB consumer GPU simulation
    REVERSAL_HAZARD_THRESHOLD: float = 0.45
    RPD_DIVERGENCE_THRESHOLD: float = 0.35
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]

settings = Settings()
