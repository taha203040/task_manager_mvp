-- Fix: deleting a user whose team owns a project could fail with a foreign-key violation.
-- The same DELETE cascades into tasks twice (users -> teams -> projects -> tasks) while the
-- pre-existing tasks.user_id ON DELETE SET NULL updates the very same rows. PostgreSQL re-checked
-- tasks.project_id immediately, after the project row was already gone, and raised 23503.
-- Deferring the check to COMMIT lets the cascade settle first; semantics are unchanged.
-- The same pattern applies to task_attachments.task_id (sibling uploaded_by is ON DELETE SET NULL).

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_project_id_fkey' AND NOT condeferrable) THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_project_id_fkey;
        ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_attachments_task_id_fkey' AND NOT condeferrable) THEN
        ALTER TABLE task_attachments DROP CONSTRAINT task_attachments_task_id_fkey;
        ALTER TABLE task_attachments ADD CONSTRAINT task_attachments_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;
