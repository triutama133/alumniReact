import asyncio
import asyncpg
import httpx
import os
from dotenv import load_dotenv

# Load .env from the alumni_ai directory
load_dotenv("/Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/Alumni AI/alumni_ai/.env")

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

async def test():
    print(f"Connecting to database: {SUPABASE_DB_URL[:30]}...")
    conn = await asyncpg.connect(SUPABASE_DB_URL, statement_cache_size=0)
    try:
        # Get some sample alumni names
        rows = await conn.fetch("SELECT id, nama_lengkap, aktivitas FROM alumni_db LIMIT 5")
        print("Sample Alumni from Database:")
        for r in rows:
            print(f"- ID: {r['id']}, Name: {r['nama_lengkap']}, Activity: {r['aktivitas']}")
        
        if not rows:
            print("No alumni found in database.")
            return

        test_name = rows[0]["nama_lengkap"]
        headers = {"X-API-KEY": INTERNAL_API_KEY}

        # Test root endpoint
        async with httpx.AsyncClient(timeout=30.0) as client:
            root_res = await client.get("http://127.0.0.1:8000/")
            print(f"Root response: {root_res.status_code} - {root_res.json()}")

            # Test new /wawasan endpoint (for home feed)
            payload_wawasan = {
                "nama_lengkap": test_name,
                "cohort_id": None,
                "language": "id"
            }
            print(f"\nTesting /wawasan with name: '{test_name}'")
            res_wawasan = await client.post("http://127.0.0.1:8000/wawasan", json=payload_wawasan, headers=headers)
            print(f"Response status: {res_wawasan.status_code}")
            if res_wawasan.status_code == 200:
                print("Wawasan output (Home):")
                print(res_wawasan.json().get("wawasan"))
            else:
                print(f"Error response: {res_wawasan.text}")

            # Test /rekomendasi endpoint (for profile page)
            payload_rekomendasi = {
                "nama_lengkap": test_name,
                "cohort_id": None,
                "language": "id"
            }
            print(f"\nTesting /rekomendasi with name: '{test_name}'")
            res_rekomendasi = await client.post("http://127.0.0.1:8000/rekomendasi", json=payload_rekomendasi, headers=headers)
            print(f"Response status: {res_rekomendasi.status_code}")
            if res_rekomendasi.status_code == 200:
                print("Rekomendasi output (Profile):")
                print(res_rekomendasi.json().get("rekomendasi")[:500] + "...")
            else:
                print(f"Error response: {res_rekomendasi.text}")

    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test())
