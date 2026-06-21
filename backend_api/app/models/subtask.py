from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.todo import PriorityEnum

class SubTask(Base):
    __tablename__ = "sub_tasks"

    id = Column(String, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("todos.id", ondelete="CASCADE"), nullable=False, index=True)
    sub_task_name = Column(String, nullable=False)
    priority = Column(Enum(PriorityEnum), nullable=False)
    due = Column(DateTime(timezone=True), nullable=False)
    status = Column(Boolean, nullable=False, default=False)

    task = relationship("Todo", back_populates="subtasks")
