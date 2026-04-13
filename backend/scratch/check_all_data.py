import asyncio
from app.database.db import init_db, close_db
from app.models import Idea, RawPost
from sqlalchemy import select, func

async def check():
    await init_db()
    from app.database.db import async_session_factory
    async with async_session_factory() as session:
        # Check Idea counts per platform
        idea_counts = await session.execute(
            select(Idea.platform, func.count(Idea.id)).group_by(Idea.platform)
        )
        print("--- Idea Counts ---")
        for platform, count in idea_counts:
            print(f"{platform}: {count}")
            
        # Check RawPost counts per platform
        raw_counts = await session.execute(
            select(RawPost.platform_id, func.count(RawPost.id)).group_by(RawPost.platform_id)
        )
        print("\n--- RawPost Counts ---")
        for platform, count in raw_counts:
            print(f"{platform}: {count}")
            
    await close_db()

if __name__ == "__main__":
    asyncio.run(check())
