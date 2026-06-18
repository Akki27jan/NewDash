from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.schemas.user import UserCreate, UserResponse, Login
from app.schemas.token import Token
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(deps.get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    # Generate alphanumeric user ID
    all_users_result = await db.execute(select(User.id))
    all_ids = all_users_result.scalars().all()
    max_num = 0
    for user_id in all_ids:
        if user_id and len(user_id) > 3:
            try:
                num_part = int(user_id[3:])
                if num_part > max_num:
                    max_num = num_part
            except ValueError:
                pass
    next_num = max_num + 1

    prefix = user_in.first_name[:2].upper()
    if len(prefix) == 1:
        prefix += 'X'
    elif len(prefix) == 0:
        prefix = 'XX'
    
    new_id = f"{prefix}S{next_num:02d}"

    # Hash the password and create the user
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        id=new_id,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.post("/login")
async def login(login_data: Login, response: Response, db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[ERROR] user does not exist sign up first"
        )
        
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    access_token = create_access_token(subject=user.id)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="none",
        secure=True,
        max_age=1440 * 60
    )
    return {"message": "Successfully logged in"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(deps.get_current_user)):
    return current_user

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", samesite="none", secure=True)
    return {"message": "Successfully logged out"}
