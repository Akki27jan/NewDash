import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.future import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.db.database import AsyncSessionLocal
from app.models.todo import Todo
from app.models.user import User
from app.core.email import send_email_sync

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def check_expiring_tasks():
    logger.info("Running expiring tasks check...")
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        
        # Get all pending tasks
        stmt = select(Todo, User).join(User, Todo.student_id == User.id).where(Todo.status == False)
        result = await db.execute(stmt)
        tasks_with_users = result.all()
        
        for task, user in tasks_with_users:
            if not task.due:
                continue
                
            delta_minutes = (task.due - now).total_seconds() / 60.0
            
            # Helper to run email sending in background thread
            def send_alert(subject: str, body: str):
                asyncio.create_task(asyncio.to_thread(send_email_sync, user.email, subject, body))
                
            if delta_minutes <= 0 and not task.email_notified_0m:
                send_alert(
                    f"NewDash Alert: Task Expired - {task.task_name}",
                    f"Hello {user.first_name},\n\nYour task '{task.task_name}' has just expired!"
                )
                task.email_notified_0m = True
                task.email_notified_5m = True
                task.email_notified_10m = True
                
            elif 0 < delta_minutes <= 5 and not task.email_notified_5m:
                send_alert(
                    f"NewDash Warning: 5 mins left for {task.task_name}",
                    f"Hello {user.first_name},\n\nYour task '{task.task_name}' is due in less than 5 minutes!"
                )
                task.email_notified_5m = True
                task.email_notified_10m = True
                
            elif 5 < delta_minutes <= 10 and not task.email_notified_10m:
                send_alert(
                    f"NewDash Reminder: 10 mins left for {task.task_name}",
                    f"Hello {user.first_name},\n\nYour task '{task.task_name}' is due in 10 minutes."
                )
                task.email_notified_10m = True
                
        await db.commit()

def start_scheduler():
    scheduler.add_job(check_expiring_tasks, 'interval', seconds=60, id='check_expiring_tasks_job', replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shut down.")
