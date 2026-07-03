import httpx
import asyncio
import os
from dotenv import load_dotenv

# Load env from Alumni AI/alumni_ai/.env
load_dotenv("Alumni AI/alumni_ai/.env")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

async def test_rekomendasi(nama_lengkap, source="home"):
    url = "http://127.0.0.1:8000/rekomendasi"
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": INTERNAL_API_KEY
    }
    body = {
        "nama_lengkap": nama_lengkap,
        "source": source,
        "language": "id"
    }
    print(f"\n--- Testing /rekomendasi for '{nama_lengkap}' with source='{source}' ---")
    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            res = await client.post(url, headers=headers, json=body)
            print("Status Code:", res.status_code)
            if res.status_code == 200:
                print("Response Recommendation:")
                print(res.json()["rekomendasi"])
            else:
                print("Error Response:", res.text)
        except Exception as e:
            print("Failed:", e)

async def test_proyek_rekomendasi(prompt):
    url = "http://127.0.0.1:8000/proyek_rekomendasi"
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": INTERNAL_API_KEY
    }
    body = {
        "ide_proyek": prompt,
        "language": "id"
    }
    print(f"\n--- Testing /proyek_rekomendasi with prompt '{prompt}' ---")
    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            res = await client.post(url, headers=headers, json=body)
            print("Status Code:", res.status_code)
            if res.status_code == 200:
                print("Response Recommendation Proyek:")
                print(res.json()["rekomendasi_proyek"])
            else:
                print("Error Response:", res.text)
        except Exception as e:
            print("Failed:", e)

async def main():
    # Let's get the first alumni name from DB to test
    import asyncpg
    db_url = os.getenv("SUPABASE_DB_URL")
    conn = await asyncpg.connect(db_url)
    try:
        row = await conn.fetchrow("SELECT nama_lengkap FROM alumni_db LIMIT 1")
        if row:
            nama = row["nama_lengkap"]
            await test_rekomendasi(nama, "home")
            await test_rekomendasi(nama, "profile")
        else:
            print("No alumni found in DB")
    finally:
        await conn.close()

    await test_proyek_rekomendasi("Butuh alumni yang bisa bantu produksi konten video kreatif untuk bisnis fashion")

if __name__ == "__main__":
    asyncio.run(main())
