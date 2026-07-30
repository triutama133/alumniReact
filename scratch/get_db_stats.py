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
        
    print("Connecting to DB...")
    conn = await asyncpg.connect(db_url)
    try:
        # Get count of total alumni
        total_alumni = await conn.fetchval("SELECT COUNT(*) FROM alumni_db")
        print(f"Total alumni in alumni_db: {total_alumni}")
        
        # Get activity distribution
        activities = await conn.fetch("SELECT aktivitas, COUNT(*) as count FROM alumni_db GROUP BY aktivitas")
        print("\nActivity distribution:")
        for act in activities:
            print(f"- {act['aktivitas']}: {act['count']}")
            
        # Get a list of cohorts
        cohorts = await conn.fetch("SELECT id, name FROM cohorts")
        print("\nCohorts:")
        for c in cohorts:
            member_count = await conn.fetchval("SELECT COUNT(*) FROM cohort_members WHERE cohort_id = $1", c['id'])
            print(f"- {c['name']} (ID: {c['id']}): {member_count} members")
            
            # For each cohort, get activity distribution
            cohort_activities = await conn.fetch("""
                SELECT ad.aktivitas, COUNT(*) as count 
                FROM alumni_db ad
                JOIN cohort_members cm ON cm.user_id = ad.id
                WHERE cm.cohort_id = $1
                GROUP BY ad.aktivitas
            """, c['id'])
            print("  Activity distribution in cohort:")
            for ca in cohort_activities:
                print(f"  - {ca['aktivitas']}: {ca['count']}")
                
    except Exception as e:
        print("Error:", e)
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
