import asyncio
import asyncpg

import os
from dotenv import load_dotenv

async def check():
    load_dotenv()
    load_dotenv("../.env")
    load_dotenv("../alumni_RESTAPI/.env")
    db_url = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: DB connection URL not found in .env")
        return
    conn = await asyncpg.connect(db_url)
    try:
        count = await conn.fetchval("SELECT COUNT(*) FROM auth.users")
        print(f"Total users in auth.users: {count}")
        
        # Let's check project_applications structure to see if user_id references something else, or if it can be modified.
        # Wait, if project_applications.user_id is uuid, how can a bigint user_id be stored? It cannot be stored without conversion or changing type!
        # Let's check if we can write a script to look at the exact columns of project_applications.
    except Exception as e:
        print(f"Error checking auth.users: {e}")
    finally:
        await conn.close()

asyncio.run(check())
