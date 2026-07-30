import asyncio
import asyncpg
import os

from dotenv import load_dotenv

async def migrate():
    load_dotenv()
    load_dotenv("../.env")
    load_dotenv("../alumni_RESTAPI/.env")
    db_url = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: DB connection URL not found in .env")
        return
    print("Connecting to database...")
    conn = await asyncpg.connect(db_url)
    try:
        print("Reading migration SQL file...")
        migration_file = "/Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/database/migration_003_cohorts.sql"
        with open(migration_file, "r") as f:
            sql = f.read()
            
        print("Executing SQL statements...")
        async with conn.transaction():
            await conn.execute(sql)
            
        print("Migration for cohorts completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

asyncio.run(migrate())
