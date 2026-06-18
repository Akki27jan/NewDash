from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.todo import PriorityEnum

class TodoBase(BaseModel):
    subject_id: str
    task_name: str
    due: datetime
    priority: PriorityEnum

class TodoCreate(TodoBase):
    pass

class TodoResponse(TodoBase):
    id: str
    student_id: str
    status: bool

    class Config:
        from_attributes = True

class TodoUpdate(BaseModel):
    task_name: Optional[str] = None
    status: Optional[bool] = None
    due: Optional[datetime] = None
    priority: Optional[PriorityEnum] = None

