import asyncio
from app.services.reddit_service import fetch_reddit_posts

async def main():
    posts = await fetch_reddit_posts()
    print(f"Fetched {len(posts)} posts")
    for p in posts[:3]:
        print(p)

if __name__ == "__main__":
    asyncio.run(main())
