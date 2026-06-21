from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    attendance_threshold = Column(Float, default=75.0, nullable=False)
    prev_gpa = Column(Float, nullable=True)
    prev_credits = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
