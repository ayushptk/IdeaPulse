import asyncio
from app.database.db import async_session_factory
from app.models.idea_model import Idea
from sqlalchemy import delete, select

async def clear_linkedin():
    async with async_session_factory() as session:
        res = await session.execute(select(Idea).where(Idea.platform == 'linkedin'))
        ideas = res.scalars().all()
        print(f"Found {len(ideas)} existing LinkedIn ideas")
        await session.execute(delete(Idea).where(Idea.platform == 'linkedin'))
        await session.commit()
        print("Deleted LinkedIn ideas from DB.")

if __name__ == "__main__":
    asyncio.run(clear_linkedin())
