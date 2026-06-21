from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base

class ExamPeriod(Base):
    __tablename__ = "exam_periods"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    color_code = Column(String, nullable=True)

    exams = relationship("Exam", back_populates="period", cascade="all, delete-orphan")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(String, primary_key=True, index=True)
    period_id = Column(String, ForeignKey("exam_periods.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String, nullable=False)
    exam_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(String, nullable=True)

    period = relationship("ExamPeriod", back_populates="exams")
