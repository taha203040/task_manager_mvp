-- Mission 5: Workspace activity / notifications
-- activity_logs already existed (id, task_id, user_id, action, created_at) with no writer.

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE activity_logs SET text = action WHERE text IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_task_id_fkey') THEN
        ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_unread ON activity_logs(user_id) WHERE read = FALSE;
