from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String, nullable=False, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    subject = relationship("Subject", back_populates="flashcards")
