import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect(
        user="postgres.uubgqbzeowuwnqufcpha",
        password="133133raitO!@#",
        host="aws-0-ap-southeast-1.pooler.supabase.com",
        port=6543,
        database="postgres",
        statement_cache_size=0
    )
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
