from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    note_name: str
    note_link: str
    note_type: str

class NoteCreate(NoteBase):
    subject_id: str

class NoteUpdate(BaseModel):
    note_name: Optional[str] = None
    note_link: Optional[str] = None
    note_type: Optional[str] = None

class NoteResponse(NoteBase):
    id: str
    subject_id: str
    created_at: datetime

    class Config:
        orm_mode = True
