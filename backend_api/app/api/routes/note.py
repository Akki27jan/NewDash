from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.models.note import Note
from app.models.subject import Subject
from app.models.user import User

router = APIRouter()

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_in: NoteCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Validate that the subject exists and belongs to the student
    subject_result = await db.execute(select(Subject).where(Subject.id == note_in.subject_id))
    subject = subject_result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add a note to this subject")

    # Generate NTE{Number} ID
    result = await db.execute(select(Note.id).where(Note.id.like("NTE%")))
    all_ids = result.scalars().all()
    max_num = 0
    for nte_id in all_ids:
        if len(nte_id) > 3:
            try:
                num_part = int(nte_id[3:])
                if num_part > max_num:
                    max_num = num_part
            except ValueError:
                pass
    next_num = max_num + 1
    new_id = f"NTE{next_num:02d}"

    # Create new note
    new_note = Note(
        id=new_id,
        subject_id=note_in.subject_id,
        note_name=note_in.note_name,
        note_link=note_in.note_link,
        note_type=note_in.note_type
    )
    
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)
    
    return new_note

@router.get("", response_model=List[NoteResponse])
async def read_notes(
    subject_id: Optional[str] = Query(None, description="Filter notes by subject ID"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if subject_id:
        # Validate that the subject belongs to the user
        subject_result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = subject_result.scalars().first()
        
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
            
        if subject.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access notes for this subject")
            
        result = await db.execute(select(Note).where(Note.subject_id == subject_id))
    else:
        # Get all notes for all subjects of the user
        result = await db.execute(
            select(Note).join(Subject, Note.subject_id == Subject.id).where(Subject.student_id == current_user.id)
        )
        
    notes = result.scalars().all()
    return notes

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_in: NoteUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalars().first()
    
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        
    subject_result = await db.execute(select(Subject).where(Subject.id == note.subject_id))
    subject = subject_result.scalars().first()
    
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this note")
        
    if note_in.note_name is not None:
        note.note_name = note_in.note_name
    if note_in.note_link is not None:
        note.note_link = note_in.note_link
    if note_in.note_type is not None:
        note.note_type = note_in.note_type
        
    await db.commit()
    await db.refresh(note)
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalars().first()
    
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        
    subject_result = await db.execute(select(Subject).where(Subject.id == note.subject_id))
    subject = subject_result.scalars().first()
    
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this note")
        
    await db.delete(note)
    await db.commit()
    return None
