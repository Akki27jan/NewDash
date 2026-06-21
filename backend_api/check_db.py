import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def check_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT * FROM subjects WHERE student_id = 'AKS01';"))
        subjects = result.fetchall()
        for sub in subjects:
            print(sub)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_data())
