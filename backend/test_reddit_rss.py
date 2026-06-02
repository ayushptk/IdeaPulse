import asyncio
import httpx
import xml.etree.ElementTree as ET

async def main():
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        r = await client.get("https://www.reddit.com/r/SaaS/hot.rss", headers=headers)
        print(f"status: {r.status_code}")
        root = ET.fromstring(r.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        for entry in root.findall("atom:entry", ns)[:2]:
            title = entry.find("atom:title", ns).text
            content = entry.find("atom:content", ns).text
            link = entry.find("atom:link", ns).attrib["href"]
            updated = entry.find("atom:updated", ns).text
            print(f"Title: {title}")
            print(f"Link: {link}")
            print(f"Updated: {updated}")
            print("---")

if __name__ == "__main__":
    asyncio.run(main())
