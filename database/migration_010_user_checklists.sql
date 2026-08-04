-- Menyimpan progres checklist learning path per user dan target role
CREATE TABLE IF NOT EXISTS public.user_checklists (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  target_role VARCHAR(255) NOT NULL,
  completed_tasks TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_role)
);

CREATE INDEX IF NOT EXISTS idx_user_checklists_user_id
  ON public.user_checklists(user_id);

CREATE INDEX IF NOT EXISTS idx_user_checklists_target_role
  ON public.user_checklists(target_role);
