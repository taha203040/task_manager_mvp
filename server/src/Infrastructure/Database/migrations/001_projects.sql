
BEGIN;

-- 1. Drop existing project tables
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 2. Recreate projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'Planning'
        CHECK (
            status IN (
                'Planning',
                'In Progress',
                'Paused',
                'Completed',
                'Canceled',
                'Active'
            )
        ),

    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_projects_team_id
    ON projects(team_id);

CREATE INDEX idx_projects_status
    ON projects(status);

-- 4. Recreate normalized project membership
CREATE TABLE project_members (
    project_id UUID NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_user_id
    ON project_members(user_id);

COMMIT;
