from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True)
    actor_email = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False) # CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, LOGOUT, DOCUMENT_UPLOAD
    entity_type = Column(String(50), nullable=False) # EMPLOYEE, DEPARTMENT, USER, DOCUMENT, ASSET, ONBOARDING
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True) # JSON or descriptive text
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
