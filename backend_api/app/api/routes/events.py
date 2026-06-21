from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from app.api import deps
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.models.event import Event
from app.models.user import User

router = APIRouter()

from datetime import timedelta

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    first_event = None
    # event_in.recurring_weeks defines the TOTAL occurrences (e.g., 4 means original + 3 extra)
    # If 0 or 1, it just creates the original.
    occurrences = max(1, event_in.recurring_weeks) if event_in.recurring_weeks else 1
    
    for i in range(occurrences):
        new_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        
        current_start = event_in.start_time + timedelta(weeks=i)
        current_end = event_in.end_time + timedelta(weeks=i)

        new_event = Event(
            id=new_id,
            student_id=current_user.id,
            title=event_in.title,
            description=event_in.description,
            start_time=current_start,
            end_time=current_end,
            is_all_day=event_in.is_all_day,
            color_code=event_in.color_code
        )
        db.add(new_event)
        
        if i == 0:
            first_event = new_event

    await db.commit()
    await db.refresh(first_event)
    
    return first_event

@router.get("", response_model=List[EventResponse])
async def read_events(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Event).where(Event.student_id == current_user.id))
    events = result.scalars().all()
    return events

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    if event.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this event")
        
    if event_in.title is not None:
        event.title = event_in.title
    if event_in.description is not None:
        event.description = event_in.description
    if event_in.start_time is not None:
        event.start_time = event_in.start_time
    if event_in.end_time is not None:
        event.end_time = event_in.end_time
    if event_in.is_all_day is not None:
        event.is_all_day = event_in.is_all_day
    if event_in.color_code is not None:
        event.color_code = event_in.color_code
        
    await db.commit()
    await db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    if event.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this event")
        
    await db.delete(event)
    await db.commit()
    return None
