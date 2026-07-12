from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class FlashcardBase(BaseModel):
    title: str
    topic: str
    front: str
    back: str
    subject_id: str

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    front: Optional[str] = None
    back: Optional[str] = None
    subject_id: Optional[str] = None

class FlashcardResponse(FlashcardBase):
    id: str
    created_at: datetime
    subject_name: Optional[str] = None # Added via a join in the GET endpoints

    class Config:
        from_attributes = True
