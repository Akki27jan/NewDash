from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from app.api import deps
from app.schemas.attendance import AttendanceResponse, AttendanceUpdate
from app.models.attendance import Attendance
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=list[AttendanceResponse])
async def read_attendance(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Attendance).where(Attendance.student_id == current_user.id))
    records = result.scalars().all()
    return records

@router.put("/{subject_id}", response_model=AttendanceResponse)
async def update_attendance(
    subject_id: str,
    attendance_in: AttendanceUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(Attendance).where(
            Attendance.student_id == current_user.id,
            Attendance.subject_id == subject_id
        )
    )
    attendance = result.scalars().first()

    if not attendance:
        # Create new record
        attendance = Attendance(
            id=str(uuid.uuid4()),
            student_id=current_user.id,
            subject_id=subject_id,
            attended=attendance_in.attended,
            total=attendance_in.total
        )
        db.add(attendance)
    else:
        # Update existing record
        attendance.attended = attendance_in.attended
        attendance.total = attendance_in.total
        db.add(attendance)

    await db.commit()
    await db.refresh(attendance)
    return attendance
