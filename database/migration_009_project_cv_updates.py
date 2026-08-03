# talenthub/database/migration_009_project_cv_updates.py
import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv("/home/lightman/Documents/Project/alumni_RESTAPI/.env")
load_dotenv("/home/lightman/Documents/Project/talenthub/.env")

async def run_migration():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        print("Error: SUPABASE_DB_URL tidak ditemukan.")
        return
        
    print("Menghubungkan ke database Supabase untuk menjalankan migrasi...")
    try:
        conn = await asyncpg.connect(db_url)
        print("Koneksi berhasil. Menjalankan DDL untuk proyek, log harian, dan draf CV...")
        
        # Alter projects table
        await conn.execute("""
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT '';
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;
        """)
        print("- Kolom baru pada tabel 'projects' berhasil ditambahkan.")

        # Create project_updates table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS public.project_updates (
                id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                created_at timestamp with time zone NOT NULL DEFAULT now(),
                project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author_id bigint NOT NULL REFERENCES public.alumni_db(id)
            );
        """)
        print("- Tabel 'project_updates' berhasil diverifikasi/dibuat.")

        # Create user_cvs table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS public.user_cvs (
                user_id bigint PRIMARY KEY REFERENCES public.user(id) ON DELETE CASCADE,
                cv_data JSONB NOT NULL DEFAULT '{}'::jsonb,
                updated_at timestamp with time zone NOT NULL DEFAULT now()
            );
        """)
        print("- Tabel 'user_cvs' berhasil diverifikasi/dibuat.")
        
        await conn.close()
        print("Migrasi database berhasil diselesaikan!")
    except Exception as e:
        print(f"Terjadi kesalahan saat migrasi database: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
