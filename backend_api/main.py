from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.database import engine, Base
from app.api.routes import auth, subject, todo, subtask, note, attendance, events, exams, flashcards
from app.core.config import settings
from app.models.subject import Subject
from app.models.todo import Todo
from app.models.subtask import SubTask
from app.models.note import Note
from app.models.attendance import Attendance
from app.models.event import Event
from app.models.exam import ExamPeriod, Exam
from app.models.flashcard import Flashcard

from app.core.scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    start_scheduler()
    yield
    # Shutdown: Clean up if necessary
    stop_scheduler()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="StudentDash Backend API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|exp://192\.168\..*|http://192\.168\..*|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(subject.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(todo.router, prefix="/api/todos", tags=["todos"])
app.include_router(subtask.router, prefix="/api/subtasks", tags=["subtasks"])
app.include_router(note.router, prefix="/api/notes", tags=["notes"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(exams.router, prefix="/api/exams", tags=["exams"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])

@app.get("/")
async def root():
    return {"message": "Welcome to StudentDash Backend API"}
