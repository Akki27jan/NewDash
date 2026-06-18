from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.database import engine, Base
from app.api.routes import auth, subject, todo
from app.core.config import settings
from app.models.subject import Subject
from app.models.todo import Todo

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Clean up if necessary

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="StudentDash Backend API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        settings.FRONTEND_URL
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(subject.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(todo.router, prefix="/api/todos", tags=["todos"])

@app.get("/")
async def root():
    return {"message": "Welcome to StudentDash Backend API"}
