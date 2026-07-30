import asyncio
import asyncpg

import os
from dotenv import load_dotenv

async def main():
    load_dotenv()
    load_dotenv("../.env")
    load_dotenv("../alumni_RESTAPI/.env")
    
    db_url = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: Database connection URL not found in .env")
        return
        
    print("Connecting to Supabase PostgreSQL...")
    conn = await asyncpg.connect(db_url)
    try:
        sql = """
        ALTER TABLE public.alumni_bisnis
          ADD COLUMN IF NOT EXISTS kolaborasi_terbuka TEXT,
          ADD COLUMN IF NOT EXISTS keahlian_dibagikan TEXT;
        """
        print("Running SQL: ALTER TABLE public.alumni_bisnis ADD COLUMN...")
        await conn.execute(sql)
        print("Migration 007 (alumni_bisnis fields) completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
