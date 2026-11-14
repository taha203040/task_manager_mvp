ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
