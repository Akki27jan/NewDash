from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False, index=True, unique=True)
    attended = Column(Integer, default=0, nullable=False)
    total = Column(Integer, default=0, nullable=False)

    student = relationship("User")
    subject = relationship("Subject")
