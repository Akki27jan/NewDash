from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.schemas.subtask import SubTaskCreate, SubTaskResponse, SubTaskUpdate
from app.models.subtask import SubTask
from app.models.todo import Todo
from app.models.user import User

router = APIRouter()

@router.post("", response_model=SubTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_subtask(
    subtask_in: SubTaskCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Validate that the task exists and belongs to the student
    task_result = await db.execute(select(Todo).where(Todo.id == subtask_in.task_id))
    task = task_result.scalars().first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if task.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add a sub-task to this task")

    # Generate STSK{Number} ID
    result = await db.execute(select(SubTask.id).where(SubTask.id.like("STSK%")))
    all_ids = result.scalars().all()
    max_num = 0
    for st_id in all_ids:
        if len(st_id) > 4:
            try:
                num_part = int(st_id[4:])
                if num_part > max_num:
                    max_num = num_part
            except ValueError:
                pass
    next_num = max_num + 1
    new_id = f"STSK{next_num:02d}"

    # Create new subtask
    new_subtask = SubTask(
        id=new_id,
        task_id=subtask_in.task_id,
        sub_task_name=subtask_in.sub_task_name,
        due=subtask_in.due,
        priority=subtask_in.priority,
        status=False
    )
    
    db.add(new_subtask)
    await db.commit()
    await db.refresh(new_subtask)
    
    return new_subtask

@router.get("", response_model=List[SubTaskResponse])
async def read_subtasks(
    task_id: Optional[str] = Query(None, description="Filter sub-tasks by task ID"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if task_id:
        # Validate that the task belongs to the user
        task_result = await db.execute(select(Todo).where(Todo.id == task_id))
        task = task_result.scalars().first()
        
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
        if task.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access sub-tasks for this task")
            
        result = await db.execute(select(SubTask).where(SubTask.task_id == task_id))
    else:
        # Get all sub-tasks for all tasks of the user
        result = await db.execute(
            select(SubTask).join(Todo, SubTask.task_id == Todo.id).where(Todo.student_id == current_user.id)
        )
        
    subtasks = result.scalars().all()
    return subtasks

@router.put("/{subtask_id}", response_model=SubTaskResponse)
async def update_subtask(
    subtask_id: str,
    subtask_in: SubTaskUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(SubTask).join(Todo, SubTask.task_id == Todo.id).where(SubTask.id == subtask_id)
    )
    subtask = result.scalars().first()
    
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sub-task not found")
        
    # Validation that parent task belongs to user is implicitly done if we check the related task
    task_result = await db.execute(select(Todo).where(Todo.id == subtask.task_id))
    task = task_result.scalars().first()
    if task.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this sub-task")
        
    if subtask_in.sub_task_name is not None:
        subtask.sub_task_name = subtask_in.sub_task_name
    if subtask_in.status is not None:
        subtask.status = subtask_in.status
    if subtask_in.due is not None:
        subtask.due = subtask_in.due
    if subtask_in.priority is not None:
        subtask.priority = subtask_in.priority
        
    await db.commit()
    await db.refresh(subtask)
    return subtask

@router.delete("/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
    subtask_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(SubTask).where(SubTask.id == subtask_id))
    subtask = result.scalars().first()
    
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sub-task not found")
        
    task_result = await db.execute(select(Todo).where(Todo.id == subtask.task_id))
    task = task_result.scalars().first()
    if task.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this sub-task")
        
    await db.delete(subtask)
    await db.commit()
    return None
