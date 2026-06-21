from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    subject_name = Column(String, nullable=False)
    credits = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    expected_gpa = Column(Float, nullable=True)

    notes = relationship("Note", back_populates="subject", cascade="all, delete-orphan")
