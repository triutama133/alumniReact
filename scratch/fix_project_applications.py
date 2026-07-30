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
        async with conn.transaction():
            print("1. Dropping existing view project_members...")
            await conn.execute("DROP VIEW IF EXISTS public.project_members;")
            
            print("2. Dropping dependent policies...")
            await conn.execute('DROP POLICY IF EXISTS "Users can create applications." ON public.project_applications;')
            await conn.execute('DROP POLICY IF EXISTS "Users can view their own applications." ON public.project_applications;')
            await conn.execute('DROP POLICY IF EXISTS "Project owners can update application status." ON public.project_applications;')
            await conn.execute('DROP POLICY IF EXISTS "Project owners can view applications for their projects." ON public.project_applications;')
            
            print("3. Dropping user_id column...")
            await conn.execute("ALTER TABLE public.project_applications DROP COLUMN IF EXISTS user_id;")
            
            print("4. Adding user_id as bigint...")
            await conn.execute("ALTER TABLE public.project_applications ADD COLUMN user_id bigint NOT NULL;")
            
            print("5. Adding foreign key constraint on user_id referencing public.user...")
            await conn.execute("""
                ALTER TABLE public.project_applications 
                ADD CONSTRAINT project_applications_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE CASCADE;
            """)
            
            print("6. Disabling RLS on project_applications table...")
            await conn.execute("ALTER TABLE public.project_applications DISABLE ROW LEVEL SECURITY;")
            
            print("7. Recreating project_members view...")
            await conn.execute("""
                CREATE OR REPLACE VIEW public.project_members AS
                SELECT 
                  pa.id,
                  pa.project_id,
                  pa.user_id,
                  pa.role,
                  pa.status,
                  pa.created_at as joined_at,
                  pa.updated_at,
                  ad.nama_lengkap,
                  ad.nama_panggilan,
                  ad.skill_gabungan,
                  ad.aktivitas
                FROM public.project_applications pa
                JOIN public.user au ON pa.user_id = au.id
                LEFT JOIN public.alumni_db ad ON ad.id = au.id
                WHERE pa.status IN ('accepted', 'active');
            """)
            print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

asyncio.run(migrate())
