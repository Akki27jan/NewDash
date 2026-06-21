from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import uuid

from app.api import deps
from app.schemas.exam import ExamPeriodCreate, ExamPeriodResponse
from app.models.exam import ExamPeriod, Exam
from app.models.user import User

router = APIRouter()

@router.post("", response_model=ExamPeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_period(
    period_in: ExamPeriodCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    period_id = f"EXMP-{uuid.uuid4().hex[:8].upper()}"

    new_period = ExamPeriod(
        id=period_id,
        student_id=current_user.id,
        title=period_in.title,
        start_date=period_in.start_date,
        end_date=period_in.end_date,
        color_code=period_in.color_code
    )
    
    db.add(new_period)

    # Add all sub-exams
    for exam_in in period_in.exams:
        exam_id = f"EXM-{uuid.uuid4().hex[:8].upper()}"
        new_exam = Exam(
            id=exam_id,
            period_id=period_id,
            subject=exam_in.subject,
            exam_time=exam_in.exam_time,
            duration_minutes=exam_in.duration_minutes
        )
        db.add(new_exam)

    await db.commit()
    
    # Refresh and load exams
    result = await db.execute(select(ExamPeriod).options(selectinload(ExamPeriod.exams)).where(ExamPeriod.id == period_id))
    created_period = result.scalars().first()
    
    return created_period

@router.get("", response_model=List[ExamPeriodResponse])
async def read_exam_periods(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(ExamPeriod)
        .options(selectinload(ExamPeriod.exams))
        .where(ExamPeriod.student_id == current_user.id)
    )
    periods = result.scalars().all()
    return periods

@router.delete("/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam_period(
    period_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(ExamPeriod).where(ExamPeriod.id == period_id))
    period = result.scalars().first()
    
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam Period not found")
        
    if period.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this Exam Period")
        
    await db.delete(period) # Cascade deletes exams
    await db.commit()
    return None

@router.delete("/paper/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_single_exam(
    exam_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # We must join with ExamPeriod to verify ownership
    result = await db.execute(
        select(Exam).join(ExamPeriod).where(Exam.id == exam_id, ExamPeriod.student_id == current_user.id)
    )
    exam = result.scalars().first()
    
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found or unauthorized")
        
    await db.delete(exam)
    await db.commit()
    return None
