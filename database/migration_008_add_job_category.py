# talenthub/database/migration_008_add_job_category.py
import os
import asyncio
import asyncpg
from dotenv import load_dotenv

# Load environment variables from different possible locations
load_dotenv("/home/lightman/Documents/Project/.env")
load_dotenv("/home/lightman/Documents/Project/alumni_RESTAPI/.env")
load_dotenv("/home/lightman/Documents/Project/talenthub/.env")

async def run_migration():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        print("Error: SUPABASE_DB_URL tidak ditemukan di variabel lingkungan.")
        return
        
    print(f"Menghubungkan ke database Supabase untuk menjalankan migrasi...")
    try:
        conn = await asyncpg.connect(db_url)
        print("Koneksi berhasil. Menambahkan kolom 'category' ke tabel 'jobs' jika belum ada...")
        
        # Execute DDL
        await conn.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Others / General';")
        print("Migrasi sukses: Kolom 'category' berhasil ditambahkan ke tabel 'jobs'.")
        
        await conn.close()
    except Exception as e:
        print(f"Terjadi kesalahan saat migrasi database: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
