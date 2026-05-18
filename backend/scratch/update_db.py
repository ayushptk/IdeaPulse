import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:ayush123@localhost:5432/Productsearch')
    try:
        await conn.execute('ALTER TABLE users ADD COLUMN hashed_password VARCHAR;')
        print("Added hashed_password")
    except Exception as e:
        print(e)
    try:
        await conn.execute('ALTER TABLE users ALTER COLUMN provider DROP NOT NULL;')
        print("Altered provider")
    except Exception as e:
        print(e)
    try:
        await conn.execute('ALTER TABLE users ALTER COLUMN provider_id DROP NOT NULL;')
        print("Altered provider_id")
    except Exception as e:
        print(e)
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
