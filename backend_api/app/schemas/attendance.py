from pydantic import BaseModel

class AttendanceBase(BaseModel):
    attended: int
    total: int

class AttendanceUpdate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: str
    subject_id: str
    student_id: str

    class Config:
        from_attributes = True
