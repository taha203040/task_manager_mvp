-- Mission 3: Tasks collaboration enhancements

-- assignee_id: nullable FK; membership is validated in the application layer before writing.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_labels ON tasks USING gin (labels);

-- The legacy constraint rejected 'COMPLETED'. Widen it to the collaborative status set while
-- keeping every previously permitted value so existing rows stay valid (no data rewrite needed).
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED', 'DONE', 'ARCHIVED', 'CANCELED'));

-- Comments already existed but were not tied to tasks; enforce scope integrity.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_task_id_fkey') THEN
        ALTER TABLE comments ADD CONSTRAINT comments_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_task_created ON comments(task_id, created_at);

-- Attachments: metadata rows pointing at the existing storage URL abstraction.
CREATE TABLE IF NOT EXISTS task_attachments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
