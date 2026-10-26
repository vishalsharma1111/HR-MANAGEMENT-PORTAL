from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), default="NORMAL", nullable=False) # LOW, NORMAL, HIGH, URGENT
    is_pinned = Column(Boolean, default=False, nullable=False)
    author_name = Column(String(100), default="HR Administration", nullable=False)
    department_target = Column(String(100), default="ALL", nullable=False) # ALL or specific department
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
