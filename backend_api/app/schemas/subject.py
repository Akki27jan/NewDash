from typing import Optional
from pydantic import BaseModel

class SubjectBase(BaseModel):
    subject_name: str
    credits: int

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    subject_name: Optional[str] = None
    credits: Optional[int] = None

class SubjectResponse(SubjectBase):
    id: str
    student_id: str

    class Config:
        from_attributes = True
