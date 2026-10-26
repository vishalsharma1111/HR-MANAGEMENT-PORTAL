import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise HRMS"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Environment & Database
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    _default_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "hrms.db")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_default_db}")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "enterprise-hrms-super-secret-key-phase1-production-ready-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024 # 10 MB
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
