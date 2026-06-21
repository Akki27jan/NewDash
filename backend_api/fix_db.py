import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def fix_schema():
    print(f"Connecting to {settings.DATABASE_URL}...")
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE subjects ADD COLUMN expected_gpa FLOAT;"))
            print("Added expected_gpa")
        except Exception as e:
            print(f"Skipping expected_gpa: {e}")

    await engine.dispose()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(fix_schema())
