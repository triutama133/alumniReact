-- ================================================================
-- MIGRATION 002: Create New Feature Tables
-- ================================================================
-- Purpose: Create posts, ai_recommendations tables
-- Date: 2026-06-13
-- Risk Level: LOW (new tables, no impact on existing data)
-- Rollback: DROP TABLE (if needed)
-- ================================================================

-- Run this in Supabase SQL Editor

BEGIN;

-- ================================================================
-- SECTION 1: Create posts Table (for Home Feed)
-- ================================================================

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  media_url VARCHAR(500),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES alumni_db(id) ON DELETE CASCADE,
  CONSTRAINT posts_likes_count_check CHECK (likes_count >= 0),
  CONSTRAINT posts_comments_count_check CHECK (comments_count >= 0)
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Full-text search on post content
CREATE INDEX IF NOT EXISTS idx_posts_content_fts 
  ON posts USING GIN (to_tsvector('indonesian', content));

-- Trigger for auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at_posts ON posts;
CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SECTION 2: Create ai_recommendations Table (for AI Caching)
-- ================================================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL,
  input_prompt TEXT NOT NULL,
  output_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES alumni_db(id) ON DELETE CASCADE,
  CONSTRAINT ai_rec_type_check CHECK (recommendation_type IN ('collaboration', 'project_match', 'talent_search', 'project_discovery')),
  CONSTRAINT ai_rec_expires_check CHECK (expires_at > created_at)
);

-- Indexes for ai_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_rec_user ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_rec_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_rec_expires ON ai_recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_rec_created ON ai_recommendations(created_at DESC);

-- Composite index for cache lookups.
-- Note: partial index predicates cannot use NOW() because index predicates
-- must be immutable in PostgreSQL.
CREATE INDEX IF NOT EXISTS idx_ai_rec_cache_lookup 
  ON ai_recommendations(user_id, recommendation_type, expires_at, created_at DESC);

-- ================================================================
-- SECTION 3: Extend project_applications to Support More Statuses
-- ================================================================

-- Note: project_applications already exists, we're just adding more functionality
-- This table can serve as both "applications" and "members"

-- Add role column to track member roles
ALTER TABLE project_applications
  ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'collaborator';

-- Add updated_at timestamp
ALTER TABLE project_applications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update constraint to support more statuses
-- Note: Can't directly modify CHECK constraint, need to drop and recreate
-- First, check if constraint exists
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_applications_status_check' 
    AND table_name = 'project_applications'
  ) THEN
    ALTER TABLE project_applications DROP CONSTRAINT project_applications_status_check;
  END IF;
  
  -- Add new constraint with more statuses
  ALTER TABLE project_applications 
    ADD CONSTRAINT project_applications_status_check 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'invited', 'active', 'completed'));
END $$;

-- Add comment to clarify table usage
COMMENT ON TABLE project_applications IS 'Stores both project applications and active project members. Status progression: invited/pending → accepted → active → completed/rejected';

-- Trigger for auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at_project_applications ON project_applications;
CREATE TRIGGER set_updated_at_project_applications
  BEFORE UPDATE ON project_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON project_applications(status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_project_applications_project_status 
  ON project_applications(project_id, status);

-- ================================================================
-- SECTION 4: Create Helper Functions for Common Operations
-- ================================================================

-- Function to get unexpired AI recommendations
CREATE OR REPLACE FUNCTION get_ai_recommendation(
  p_user_id BIGINT,
  p_recommendation_type VARCHAR(50),
  p_cache_duration_hours INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT output_result INTO result
  FROM ai_recommendations
  WHERE user_id = p_user_id
    AND recommendation_type = p_recommendation_type
    AND expires_at > NOW()
    AND created_at > NOW() - (p_cache_duration_hours || ' hours')::INTERVAL
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to save AI recommendation with auto-expiry
CREATE OR REPLACE FUNCTION save_ai_recommendation(
  p_user_id BIGINT,
  p_recommendation_type VARCHAR(50),
  p_input_prompt TEXT,
  p_output_result JSONB,
  p_cache_duration_hours INTEGER DEFAULT 1
)
RETURNS BIGINT AS $$
DECLARE
  new_id BIGINT;
BEGIN
  INSERT INTO ai_recommendations (
    user_id,
    recommendation_type,
    input_prompt,
    output_result,
    expires_at
  ) VALUES (
    p_user_id,
    p_recommendation_type,
    p_input_prompt,
    p_output_result,
    NOW() + (p_cache_duration_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired AI recommendations (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_recommendations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_recommendations
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SECTION 5: Create Views for Common Queries
-- ================================================================

-- View: Active project members (accepted applications)
CREATE OR REPLACE VIEW project_members AS
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
FROM project_applications pa
JOIN auth.users au ON pa.user_id = au.id
LEFT JOIN alumni_db ad ON LOWER(ad.email) = LOWER(au.email)
WHERE pa.status IN ('accepted', 'active');

-- View: Recent posts feed (with user info)
CREATE OR REPLACE VIEW posts_feed AS
SELECT 
  p.id,
  p.user_id,
  p.content,
  p.media_url,
  p.likes_count,
  p.comments_count,
  p.created_at,
  p.updated_at,
  ad.nama_lengkap,
  ad.nama_panggilan,
  ad.aktivitas
FROM posts p
JOIN alumni_db ad ON p.user_id = ad.id
ORDER BY p.created_at DESC;

-- ================================================================
-- SECTION 6: Setup Row Level Security (RLS) - Optional
-- ================================================================

-- Enable RLS on posts (users can only edit their own posts)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all posts
CREATE POLICY posts_select_policy ON posts
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own posts
CREATE POLICY posts_insert_policy ON posts
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::BIGINT);

-- Policy: Users can update their own posts
CREATE POLICY posts_update_policy ON posts
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::BIGINT);

-- Policy: Users can delete their own posts
CREATE POLICY posts_delete_policy ON posts
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::BIGINT);

-- Note: RLS requires setting current_user_id in database session
-- Example from API: 
-- SET LOCAL app.current_user_id = '123';

COMMIT;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- 1. Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('posts', 'ai_recommendations');

-- 2. Check views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('project_members', 'posts_feed');

-- 3. Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%ai_recommendation%'
OR routine_name LIKE 'cleanup_%';

-- 4. Check RLS policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'posts';

-- 5. Test AI recommendation functions
-- Example usage:
-- SELECT save_ai_recommendation(1, 'collaboration', 'Test prompt', '{"result": "test"}'::JSONB, 1);
-- SELECT get_ai_recommendation(1, 'collaboration');

-- ================================================================
-- END OF MIGRATION 002
-- ================================================================
