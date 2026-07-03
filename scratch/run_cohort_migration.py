import asyncio
import asyncpg
import os

async def migrate():
    print("Connecting to database...")
    conn = await asyncpg.connect(
        user="postgres.uubgqbzeowuwnqufcpha",
        password="133133raitO!@#",
        host="aws-0-ap-southeast-1.pooler.supabase.com",
        port=6543,
        database="postgres",
        statement_cache_size=0
    )
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
