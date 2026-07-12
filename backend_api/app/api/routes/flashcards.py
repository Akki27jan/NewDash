from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import asc, desc

from app.api import deps
from app.schemas.flashcard import FlashcardCreate, FlashcardResponse, FlashcardUpdate
from app.models.flashcard import Flashcard
from app.models.subject import Subject
from app.models.user import User

router = APIRouter()

@router.post("", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard(
    flashcard_in: FlashcardCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Validate that the subject exists and belongs to the student
    subject_result = await db.execute(select(Subject).where(Subject.id == flashcard_in.subject_id))
    subject = subject_result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add a flashcard to this subject")

    # Generate FLC{Number} ID
    result = await db.execute(select(Flashcard.id).where(Flashcard.id.like("FLC%")))
    all_ids = result.scalars().all()
    max_num = 0
    for flc_id in all_ids:
        if len(flc_id) > 3:
            try:
                num_part = int(flc_id[3:])
                if num_part > max_num:
                    max_num = num_part
            except ValueError:
                pass
    next_num = max_num + 1
    new_id = f"FLC{next_num:02d}"

    # Create new flashcard
    new_flashcard = Flashcard(
        id=new_id,
        title=flashcard_in.title,
        subject_id=flashcard_in.subject_id,
        topic=flashcard_in.topic,
        front=flashcard_in.front,
        back=flashcard_in.back
    )
    
    db.add(new_flashcard)
    await db.commit()
    await db.refresh(new_flashcard)
    
    response_data = FlashcardResponse.model_validate(new_flashcard)
    response_data.subject_name = subject.subject_name
    return response_data

@router.get("", response_model=List[FlashcardResponse])
async def read_flashcards(
    subject_id: Optional[str] = Query(None, description="Filter flashcards by subject ID"),
    topic: Optional[str] = Query(None, description="Filter flashcards by topic (case-insensitive partial match)"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Base query: join Subject to get the subject name and verify ownership
    query = select(Flashcard, Subject.subject_name).join(
        Subject, Flashcard.subject_id == Subject.id
    ).where(Subject.student_id == current_user.id)

    # Apply filters
    if subject_id:
        query = query.where(Flashcard.subject_id == subject_id)
    
    if topic:
        query = query.where(Flashcard.topic.ilike(f"%{topic}%"))

    # Apply sorting: By Subject name, then by Topic
    query = query.order_by(asc(Subject.subject_name), asc(Flashcard.topic))

    result = await db.execute(query)
    rows = result.all()

    # Construct the response
    flashcards_response = []
    for flashcard, subject_name in rows:
        resp = FlashcardResponse.model_validate(flashcard)
        resp.subject_name = subject_name
        flashcards_response.append(resp)

    return flashcards_response

@router.get("/{flashcard_id}", response_model=FlashcardResponse)
async def read_flashcard(
    flashcard_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    query = select(Flashcard, Subject.subject_name).join(
        Subject, Flashcard.subject_id == Subject.id
    ).where(Flashcard.id == flashcard_id, Subject.student_id == current_user.id)
    
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found or not authorized")
        
    flashcard, subject_name = row
        
    resp = FlashcardResponse.model_validate(flashcard)
    resp.subject_name = subject_name
    return resp

@router.put("/{flashcard_id}", response_model=FlashcardResponse)
async def update_flashcard(
    flashcard_id: str,
    flashcard_in: FlashcardUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Flashcard).where(Flashcard.id == flashcard_id))
    flashcard = result.scalars().first()
    
    if not flashcard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
        
    subject_result = await db.execute(select(Subject).where(Subject.id == flashcard.subject_id))
    subject = subject_result.scalars().first()
    
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this flashcard")
        
    if flashcard_in.subject_id is not None and flashcard_in.subject_id != flashcard.subject_id:
        new_subj_result = await db.execute(select(Subject).where(Subject.id == flashcard_in.subject_id))
        new_subj = new_subj_result.scalars().first()
        if not new_subj or new_subj.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to use the new subject")
        flashcard.subject_id = flashcard_in.subject_id
        subject = new_subj
        
    if flashcard_in.title is not None:
        flashcard.title = flashcard_in.title
    if flashcard_in.topic is not None:
        flashcard.topic = flashcard_in.topic
    if flashcard_in.front is not None:
        flashcard.front = flashcard_in.front
    if flashcard_in.back is not None:
        flashcard.back = flashcard_in.back
        
    await db.commit()
    await db.refresh(flashcard)
    
    resp = FlashcardResponse.model_validate(flashcard)
    resp.subject_name = subject.subject_name
    return resp

@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flashcard(
    flashcard_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Flashcard).where(Flashcard.id == flashcard_id))
    flashcard = result.scalars().first()
    
    if not flashcard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
        
    subject_result = await db.execute(select(Subject).where(Subject.id == flashcard.subject_id))
    subject = subject_result.scalars().first()
    
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this flashcard")
        
    await db.delete(flashcard)
    await db.commit()
    return None
