from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    attendance_threshold: float
    prev_gpa: Optional[float] = None
    prev_credits: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserThresholdUpdate(BaseModel):
    attendance_threshold: float

class UserGPASettingsUpdate(BaseModel):
    prev_gpa: Optional[float] = None
    prev_credits: Optional[float] = None

class Login(BaseModel):
    email: EmailStr
    password: str
