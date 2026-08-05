-- ================================================================
-- MIGRATION 014: Community Features (Likes, Comments, Notifications, Chat)
-- ================================================================
-- Purpose: Add post_likes, post_comments, notifications, conversations,
--          conversation_participants, messages tables
-- Date: 2026-08-05
-- Risk Level: LOW (new tables, no impact on existing data)
-- Run this in Supabase SQL Editor
-- ================================================================

BEGIN;

-- ================================================================
-- SECTION 1: post_likes (toggle like pada postingan)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.post_likes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.alumni_db(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);

-- ================================================================
-- SECTION 2: post_comments
-- ================================================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.alumni_db(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at ASC);

-- ================================================================
-- SECTION 3: notifications (notifikasi in-app)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.alumni_db(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  -- tipe valid: 'post_like' | 'post_comment' | 'project_apply' | 'project_status' | 'chat' | 'system'
  related_id BIGINT DEFAULT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

-- ================================================================
-- SECTION 4: Chat — conversations
-- ================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'direct',
  name VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peserta percakapan
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.alumni_db(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);

-- Pesan
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES public.alumni_db(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 10000),
  content_type VARCHAR(20) DEFAULT 'text',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages(conversation_id, created_at DESC);

-- Aktifkan Supabase Realtime untuk tabel messages
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- sudah ada
  END;
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('post_likes', 'post_comments', 'notifications', 'conversations', 'conversation_participants', 'messages');

COMMIT;