from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    color_code: Optional[str] = None

class EventCreate(EventBase):
    recurring_weeks: Optional[int] = 0

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    color_code: Optional[str] = None

class EventResponse(EventBase):
    id: str
    student_id: str

    class Config:
        from_attributes = True
