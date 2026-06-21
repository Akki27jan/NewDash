from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, index=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    note_name = Column(String, nullable=False)
    note_link = Column(String, nullable=False)
    note_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())

    subject = relationship("Subject", back_populates="notes")
