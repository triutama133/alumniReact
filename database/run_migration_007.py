import asyncio
import asyncpg

async def main():
    db_url = "postgresql://postgres.uubgqbzeowuwnqufcpha:133133raitO%21%40%23@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
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
