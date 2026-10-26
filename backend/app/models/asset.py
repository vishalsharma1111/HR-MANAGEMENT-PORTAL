from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String(50), unique=True, index=True, nullable=False) # e.g. AST-00101
    name = Column(String(150), nullable=False)
    category = Column(String(50), default="LAPTOP", nullable=False) # LAPTOP, MONITOR, MOBILE, ACCESSORY, SOFTWARE_LICENSE, VEHICLE, KEYCARD
    serial_number = Column(String(100), unique=True, nullable=True)
    assigned_to_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    assigned_date = Column(Date, nullable=True)
    return_date = Column(Date, nullable=True)
    status = Column(String(50), default="AVAILABLE", nullable=False) # AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    assigned_employee = relationship("Employee", back_populates="assets")
