from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True) # None = company policy
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="OTHER", nullable=False) # ID_PROOF, CONTRACT, RESUME, PAYSLIP, POLICY, CERTIFICATE, OTHER
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, default=0, nullable=False) # bytes
    mime_type = Column(String(100), default="application/octet-stream", nullable=False)
    is_company_policy = Column(Boolean, default=False, nullable=False)
    uploaded_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="documents")
