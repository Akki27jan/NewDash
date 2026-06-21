from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ExamBase(BaseModel):
    subject: str
    exam_time: datetime
    duration_minutes: Optional[str] = None

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: str
    period_id: str

    class Config:
        from_attributes = True

class ExamPeriodBase(BaseModel):
    title: str
    start_date: datetime
    end_date: datetime
    color_code: Optional[str] = "#ef4444" # default red for exams

class ExamPeriodCreate(ExamPeriodBase):
    exams: List[ExamCreate] = []

class ExamPeriodResponse(ExamPeriodBase):
    id: str
    student_id: str
    exams: List[ExamResponse] = []

    class Config:
        from_attributes = True
