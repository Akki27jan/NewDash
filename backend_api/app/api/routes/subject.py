from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from app.models.subject import Subject
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_in: SubjectCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Generate SUB{Number} ID
    result = await db.execute(select(Subject.id).where(Subject.id.like("SUB%")))
    all_ids = result.scalars().all()
    max_num = 0
    for subject_id in all_ids:
        if len(subject_id) > 3:
            try:
                num_part = int(subject_id[3:])
                if num_part > max_num:
                    max_num = num_part
            except ValueError:
                pass
    next_num = max_num + 1
    new_id = f"SUB{next_num:02d}"

    # Create new subject
    new_subject = Subject(
        id=new_id,
        student_id=current_user.id,
        subject_name=subject_in.subject_name,
        credits=subject_in.credits
    )
    
    db.add(new_subject)
    await db.commit()
    await db.refresh(new_subject)
    
    return new_subject

@router.get("/", response_model=List[SubjectResponse])
async def read_subjects(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Subject).where(Subject.student_id == current_user.id))
    subjects = result.scalars().all()
    return subjects

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this subject")
        
    await db.delete(subject)
    await db.commit()
    return None

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    subject_in: SubjectUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this subject")
        
    if subject_in.subject_name is not None:
        subject.subject_name = subject_in.subject_name
    if subject_in.credits is not None:
        subject.credits = subject_in.credits
        
    await db.commit()
    await db.refresh(subject)
    return subject
