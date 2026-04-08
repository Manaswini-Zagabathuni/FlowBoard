-- ============================================================
-- FlowBoard — Supabase Schema
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- Tasks
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

-- Labels
CREATE TABLE IF NOT EXISTS labels (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name     text NOT NULL,
  color    text NOT NULL,
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Task ↔ Label junction
CREATE TABLE IF NOT EXISTS task_labels (
  task_id  uuid REFERENCES tasks(id) ON DELETE CASCADE,
  label_id uuid REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text NOT NULL,
  from_value  text,
  to_value    text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Tasks: users manage only their own
CREATE POLICY "Users manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Labels: users manage only their own
CREATE POLICY "Users manage own labels" ON labels
  FOR ALL USING (auth.uid() = user_id);

-- Task labels: access only via owned tasks
CREATE POLICY "Users access own task_labels" ON task_labels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = auth.uid())
  );

-- Comments: users see/write only their own
CREATE POLICY "Users manage own comments" ON comments
  FOR ALL USING (auth.uid() = user_id);

-- Activity log: users see only their own
CREATE POLICY "Users manage own activity" ON activity_log
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Enable anonymous sign-in (do this in Dashboard → Auth → Providers)
-- ============================================================
-- In Supabase Dashboard:
-- Authentication → Providers → Anonymous → Enable
