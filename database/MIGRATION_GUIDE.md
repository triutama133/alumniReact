# Migration Execution Guide

**Date:** 2026-06-13  
**Status:** Ready to Execute  
**Estimated Time:** 30-60 minutes

---

## 📋 Pre-Migration Checklist

- [ ] **Backup Database** - Download full snapshot from Supabase
- [ ] **Review Migration Scripts** - Read `migration_001` and `migration_002`
- [ ] **Schedule Maintenance** - Pick low-traffic time (optional for non-breaking changes)
- [ ] **Team Notification** - Inform team about migration (if applicable)

---

## 🚀 Migration Steps

### **Step 1: Database Backup (CRITICAL)**

1. Go to Supabase Dashboard → Your Project
2. Settings → Database → Backups
3. Click "Create Backup" or download latest backup
4. **DO NOT PROCEED WITHOUT BACKUP**

### **Step 2: Run Migration 001 - Add Missing Fields**

**File:** `database/migration_001_add_missing_fields.sql`

**What it does:**
- ✅ Adds 7 missing columns to `alumni_db`
- ✅ Adds timestamps to all 9 conditional tables
- ✅ Creates triggers for auto-update timestamps
- ✅ Creates trigger for auto-update `gabungan_data`
- ✅ Backfills `gabungan_data` for existing users
- ✅ Creates performance indexes

**Risk Level:** LOW (only ADD COLUMN, non-breaking)

**Instructions:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire content of `migration_001_add_missing_fields.sql`
3. Paste into SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for completion (should take 10-30 seconds)
6. Check for errors (green checkmark = success)

**Verify Success:**
```sql
-- Run these verification queries at the end of migration_001
-- Should see all new columns listed
SELECT column_name FROM information_schema.columns
WHERE table_name = 'alumni_db'
AND column_name IN ('jenis_kelamin', 'bahasa_dikuasai', 'sertifikasi', 'portofolio_link');

-- Should return 100% or close to it
SELECT 
  COUNT(*) as total,
  COUNT(gabungan_data) as has_gabungan_data,
  ROUND(COUNT(gabungan_data) * 100.0 / COUNT(*), 2) as percentage
FROM alumni_db;
```

### **Step 3: Run Migration 002 - Create New Tables**

**File:** `database/migration_002_create_new_tables.sql`

**What it does:**
- ✅ Creates `posts` table (for home feed)
- ✅ Creates `ai_recommendations` table (for AI caching)
- ✅ Extends `project_applications` table (adds role, updated_at)
- ✅ Creates helper functions for AI cache
- ✅ Creates views for common queries
- ✅ Sets up Row Level Security (RLS) on posts

**Risk Level:** LOW (new tables, no impact on existing data)

**Instructions:**
1. In Supabase SQL Editor
2. Copy entire content of `migration_002_create_new_tables.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for completion (should take 10-30 seconds)
6. Check for errors

**Verify Success:**
```sql
-- Should return posts, ai_recommendations
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('posts', 'ai_recommendations');

-- Should return project_members, posts_feed
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('project_members', 'posts_feed');
```

### **Step 4: Deploy Code Updates**

**Files Modified:**
- ✅ `app/api/complete-profile/route.ts` - Handle bigint ID
- ✅ `app/api/get-profile/route.ts` - Handle bigint ID
- ✅ `lib/types.ts` - Updated ID types to number

**No deployment needed!** Changes are already in codebase, just commit:

```bash
git add .
git commit -m "fix: Update API routes to handle bigint IDs from database

- Convert string userId from headers to number for database operations
- Update TypeScript types to reflect bigint → number mapping
- Add missing field validations
"
git push
```

Vercel/deployment platform will auto-deploy.

### **Step 5: Verify End-to-End**

**Test Complete Profile Flow:**

1. Login to app
2. Navigate to `/complete-profile`
3. Fill out form with new fields (jenis_kelamin, bahasa_dikuasai, etc.)
4. Submit
5. Check profile page - new fields should display
6. Check database - `alumni_db` should have new data

**Test Get Profile:**

1. Navigate to `/profile/[userId]`
2. Verify all fields display correctly
3. Check browser console - no errors

**Check Database:**

```sql
-- Sample user with new fields
SELECT 
  id, 
  nama_lengkap, 
  jenis_kelamin, 
  kota_domisili,
  bahasa_dikuasai,
  gabungan_data,
  created_at,
  updated_at
FROM alumni_db
LIMIT 5;
```

---

## 🔍 Post-Migration Monitoring

### **Day 1: Monitor Errors**

Check logs for:
- Database errors
- API errors (500s)
- Client-side errors (browser console)

**Supabase Logs:**
- Dashboard → Logs → Database Logs
- Look for migration-related errors

**Vercel/App Logs:**
- Check for API route errors
- Monitor error rates

### **Day 2-7: Monitor Performance**

- Database query performance (EXPLAIN ANALYZE slow queries)
- API response times
- User feedback

### **Week 2: Cleanup**

If everything stable:

```sql
-- Optional: Drop old data type columns (after verifying migration success)
-- ALTER TABLE alumni_db DROP COLUMN nomor_handphone; -- Keep old bigint version
-- ALTER TABLE alumni_db DROP COLUMN tahun_lahir; -- Keep old text version

-- Rename new columns to replace old ones (advanced, optional)
-- ALTER TABLE alumni_db RENAME COLUMN nomor_handphone_varchar TO nomor_handphone;
-- ALTER TABLE alumni_db RENAME COLUMN tahun_lahir_int TO tahun_lahir;
```

---

## 🚨 Rollback Plan

### **If Migration 001 Fails:**

```sql
-- Drop added columns
ALTER TABLE alumni_db
  DROP COLUMN IF EXISTS jenis_kelamin,
  DROP COLUMN IF EXISTS bahasa_dikuasai,
  DROP COLUMN IF EXISTS sertifikasi,
  DROP COLUMN IF EXISTS portofolio_link,
  DROP COLUMN IF EXISTS jenis_dukungan_dibutuhkan,
  DROP COLUMN IF EXISTS bidang_kontribusi_minat,
  DROP COLUMN IF EXISTS fakultas_jurusan,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS nomor_handphone_varchar,
  DROP COLUMN IF EXISTS tahun_lahir_int;

-- Drop triggers
DROP TRIGGER IF EXISTS set_updated_at_alumni_db ON alumni_db;
DROP TRIGGER IF EXISTS set_gabungan_data ON alumni_db;

-- Restore from backup
-- (Use Supabase Dashboard → Settings → Database → Restore)
```

### **If Migration 002 Fails:**

```sql
-- Drop new tables
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS ai_recommendations;

-- Drop views
DROP VIEW IF EXISTS project_members;
DROP VIEW IF EXISTS posts_feed;

-- Drop functions
DROP FUNCTION IF EXISTS get_ai_recommendation;
DROP FUNCTION IF EXISTS save_ai_recommendation;
DROP FUNCTION IF EXISTS cleanup_expired_ai_recommendations;

-- Restore from backup (if needed)
```

### **If Code Deployment Fails:**

```bash
# Revert git commit
git revert HEAD
git push

# Or manual rollback in Vercel dashboard
```

---

## ✅ Success Criteria

Migration is successful if:

- [ ] All verification queries pass
- [ ] No database errors in logs
- [ ] Complete profile flow works end-to-end
- [ ] Get profile API returns correct data
- [ ] No increase in error rates
- [ ] TypeScript compilation passes (no type errors)
- [ ] Existing users can still login and view profiles
- [ ] New users can register and complete profile

---

## 📊 Expected Results

### **Before Migration:**
```
alumni_db columns: ~10 fields
Conditional tables: No timestamps
Feature tables: None (posts, ai_recommendations missing)
Profile completeness: ~40-60%
```

### **After Migration:**
```
alumni_db columns: ~20 fields
Conditional tables: All have created_at, updated_at
Feature tables: posts, ai_recommendations created
Profile completeness: Same (users need to re-onboard)
gabungan_data: 100% populated for existing users
```

---

## 📞 Support

**If you encounter issues:**

1. **Check migration logs** - Copy error message
2. **Check database state** - Run verification queries
3. **Rollback if critical** - Use rollback scripts above
4. **Review documentation** - Re-read migration files
5. **Contact team** - Share error logs and context

**Common Issues:**

**Issue:** "Column already exists"  
**Solution:** Safe to ignore if using `IF NOT EXISTS`, or skip that column

**Issue:** "Trigger already exists"  
**Solution:** Script uses `DROP TRIGGER IF EXISTS` before CREATE, should be safe

**Issue:** "Timeout during migration"  
**Solution:** Run migration in smaller batches, increase timeout in Supabase settings

**Issue:** "Type mismatch in API"  
**Solution:** Verify code deployed correctly, check userId parsing logic

---

## 🎯 Next Steps After Migration

1. ✅ **Update Profile Form** - Add UI for new fields
2. ✅ **User Re-Onboarding** - Banner/notification for existing users
3. ✅ **AI Service Migration** - Move FastAPI to Next.js or re-deploy
4. ✅ **Build New Features** - Home feed, AI search, project discovery
5. ✅ **Testing** - Full end-to-end testing with real users

---

**Migration prepared by:** AI Assistant  
**Ready to execute:** Yes  
**Backup required:** CRITICAL  
**Estimated duration:** 30-60 minutes  
**Risk level:** LOW (non-breaking changes)

🚀 **Good luck with the migration!**
