-- ============================================================
-- FlowBoard — Upgraded Schema
-- Run this in your Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- ============================================================

-- ── Existing tables (unchanged) ───────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo','in_progress','in_review','done')),
  priority    text NOT NULL DEFAULT 'normal'
              CHECK (priority IN ('low','normal','high')),
  due_date    date,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS labels (
  id      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name    text NOT NULL,
  color   text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id  uuid REFERENCES tasks(id) ON DELETE CASCADE,
  label_id uuid REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     text NOT NULL,
  from_value text,
  to_value   text,
  created_at timestamptz DEFAULT now()
);

-- ── NEW: Team members ─────────────────────────────────────────
-- Each anonymous user can create "members" for their board.
-- display_name is freely typed; avatar_color is a hex string.

CREATE TABLE IF NOT EXISTS team_members (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_color text NOT NULL DEFAULT '#6366F1',
  created_at   timestamptz DEFAULT now()
);

-- ── NEW: Task assignees ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id   uuid REFERENCES tasks(id) ON DELETE CASCADE,
  member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, member_id)
);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- Tasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Users manage own tasks'
  ) THEN
    CREATE POLICY "Users manage own tasks" ON tasks
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Labels
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='labels' AND policyname='Users manage own labels'
  ) THEN
    CREATE POLICY "Users manage own labels" ON labels
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Task labels
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='task_labels' AND policyname='Users access own task_labels'
  ) THEN
    CREATE POLICY "Users access own task_labels" ON task_labels
      FOR ALL USING (
        EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = auth.uid())
      );
  END IF;
END $$;

-- Comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Users manage own comments'
  ) THEN
    CREATE POLICY "Users manage own comments" ON comments
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Activity log
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='activity_log' AND policyname='Users manage own activity'
  ) THEN
    CREATE POLICY "Users manage own activity" ON activity_log
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Team members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='team_members' AND policyname='Users manage own team members'
  ) THEN
    CREATE POLICY "Users manage own team members" ON team_members
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Task assignees
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='task_assignees' AND policyname='Users access own task assignees'
  ) THEN
    CREATE POLICY "Users access own task assignees" ON task_assignees
      FOR ALL USING (
        EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = auth.uid())
      );
  END IF;
END $$;

-- ── Indexes for performance ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tasks_user_status
  ON tasks (user_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_position
  ON tasks (user_id, position);

CREATE INDEX IF NOT EXISTS idx_comments_task
  ON comments (task_id);

CREATE INDEX IF NOT EXISTS idx_activity_task
  ON activity_log (task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_user
  ON team_members (user_id);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task
  ON task_assignees (task_id);

-- ── Enable Realtime ───────────────────────────────────────────
-- Run these in Supabase Dashboard → Database → Replication
-- OR uncomment and run here:

-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE task_assignees;
