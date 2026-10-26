from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, index=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), default="NEW", nullable=False)  # NEW, REVIEWED, RESPONDED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
