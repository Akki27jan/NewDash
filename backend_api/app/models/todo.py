from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class PriorityEnum(str, enum.Enum):
    Low = 'Low'
    Medium = 'Medium'
    High = 'High'

class Todo(Base):
    __tablename__ = "todos"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False, index=True)
    task_name = Column(String, nullable=False)
    status = Column(Boolean, nullable=False, default=False)
    due = Column(DateTime(timezone=True), nullable=False)
    priority = Column(Enum(PriorityEnum), nullable=False)

    subtasks = relationship("SubTask", back_populates="task", cascade="all, delete-orphan")
