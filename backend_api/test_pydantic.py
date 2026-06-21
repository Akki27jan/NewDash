import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from app.schemas.subject import SubjectResponse

async def test_validation():
    print(f"Connecting to {settings.DATABASE_URL}...")
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT * FROM subjects WHERE student_id = 'AKS01';"))
        subjects = result.fetchall()
        
        for row in subjects:
            try:
                # Row mapping: id, student_id, subject_name, credits, description, expected_gpa
                sub_dict = {
                    "id": row[0],
                    "student_id": row[1],
                    "subject_name": row[2],
                    "credits": row[3],
                    "description": row[4],
                    "expected_gpa": row[5]
                }
                SubjectResponse(**sub_dict)
                print(f"Row {row[0]} is VALID!")
            except Exception as e:
                print(f"Row {row[0]} FAILED: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_validation())
