-- database/migration_003_cohorts.sql

-- 1. Create cohorts table
CREATE TABLE IF NOT EXISTS public.cohorts (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL CHECK (char_length(name) > 0),
  description TEXT,
  owner_id BIGINT NOT NULL,
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT cohorts_pkey PRIMARY KEY (id),
  CONSTRAINT cohorts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.user(id) ON DELETE CASCADE
);

-- 2. Create cohort_members table
CREATE TABLE IF NOT EXISTS public.cohort_members (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  cohort_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT cohort_members_pkey PRIMARY KEY (id),
  CONSTRAINT cohort_members_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE,
  CONSTRAINT cohort_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE CASCADE,
  CONSTRAINT cohort_members_cohort_user_unique UNIQUE (cohort_id, user_id)
);

-- 3. Add cohort_id to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS cohort_id BIGINT,
  DROP CONSTRAINT IF EXISTS projects_cohort_id_fkey,
  ADD CONSTRAINT projects_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;

-- 4. Add cohort_id to posts table
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS cohort_id BIGINT,
  DROP CONSTRAINT IF EXISTS posts_cohort_id_fkey,
  ADD CONSTRAINT posts_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;

-- 5. Re-create view posts_feed to include cohort_id
DROP VIEW IF EXISTS public.posts_feed CASCADE;

CREATE OR REPLACE VIEW public.posts_feed AS
SELECT 
  p.id,
  p.user_id,
  p.content,
  p.media_url,
  p.likes_count,
  p.comments_count,
  p.created_at,
  p.updated_at,
  p.cohort_id,
  ad.nama_lengkap,
  ad.nama_panggilan,
  ad.aktivitas
FROM public.posts p
LEFT JOIN public.alumni_db ad ON ad.id = p.user_id;
