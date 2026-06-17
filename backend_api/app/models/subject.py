from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    subject_name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
