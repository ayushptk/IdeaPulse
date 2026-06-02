import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        headers = {
            "User-Agent": "windows:IdeaForgeSaaS:v1.0.0 (by /u/Ayushptk)",
        }
        r = await client.get("https://www.reddit.com/r/SaaS/hot.json", headers=headers)
        print(f"proper user-agent: {r.status_code}")

if __name__ == "__main__":
    asyncio.run(main())
