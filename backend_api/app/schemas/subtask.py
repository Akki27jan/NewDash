from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.todo import PriorityEnum

class SubTaskBase(BaseModel):
    task_id: str
    sub_task_name: str
    due: datetime
    priority: PriorityEnum

class SubTaskCreate(SubTaskBase):
    pass

class SubTaskResponse(SubTaskBase):
    id: str
    status: bool

    class Config:
        from_attributes = True

class SubTaskUpdate(BaseModel):
    sub_task_name: Optional[str] = None
    status: Optional[bool] = None
    due: Optional[datetime] = None
    priority: Optional[PriorityEnum] = None
