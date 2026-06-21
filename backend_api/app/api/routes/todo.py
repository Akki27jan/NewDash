from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.schemas.todo import TodoCreate, TodoResponse, TodoUpdate
from app.models.todo import Todo
from app.models.subject import Subject
from app.models.user import User

router = APIRouter()

@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_in: TodoCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Validate that the subject exists and belongs to the student
    subject_result = await db.execute(select(Subject).where(Subject.id == todo_in.subject_id))
    subject = subject_result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        
    if subject.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add a task to this subject")

    # Generate TSK{Number} ID
    result = await db.execute(select(Todo.id).where(Todo.id.like("TSK%")))
    all_ids = result.scalars().all()
    max_num = 0
    for todo_id in all_ids:
        if len(todo_id) > 3:
            try:
                num_part = int(todo_id[3:])
                if num_part > max_num:
                    max_num = num_part
            except ValueError:
                pass
    next_num = max_num + 1
    new_id = f"TSK{next_num:02d}"

    # Create new todo
    new_todo = Todo(
        id=new_id,
        student_id=current_user.id,
        subject_id=todo_in.subject_id,
        task_name=todo_in.task_name,
        due=todo_in.due,
        priority=todo_in.priority,
        status=False
    )
    
    db.add(new_todo)
    await db.commit()
    await db.refresh(new_todo)
    
    return new_todo

@router.get("", response_model=List[TodoResponse])
async def read_todos(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Todo).where(Todo.student_id == current_user.id))
    todos = result.scalars().all()
    return todos

@router.put("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: str,
    todo_in: TodoUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if todo.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this task")
        
    if todo_in.task_name is not None:
        todo.task_name = todo_in.task_name
    if todo_in.status is not None:
        todo.status = todo_in.status
    if todo_in.due is not None:
        todo.due = todo_in.due
    if todo_in.priority is not None:
        todo.priority = todo_in.priority
        
    await db.commit()
    await db.refresh(todo)
    return todo

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if todo.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this task")
        
    await db.delete(todo)
    await db.commit()
    return None


