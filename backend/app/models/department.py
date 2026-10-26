from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    manager = relationship("User", foreign_keys=[manager_id])
    designations = relationship("Designation", back_populates="department", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="department")

class Designation(Base):
    __tablename__ = "designations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    code = Column(String(30), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String(50), nullable=True, default="Mid-Level") # Executive, Junior, Mid-Level, Senior, Lead, Director, VP, C-Level
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="designations")
    employees = relationship("Employee", back_populates="designation")
