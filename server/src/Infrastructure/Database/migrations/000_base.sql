-- 000_base.sql: base tables for a FRESH database

-- Compatibility for migration 002 (uuid_generate_v4 is not available by default on Supabase)
CREATE OR REPLACE FUNCTION public.uuid_generate_v4() RETURNS uuid
LANGUAGE sql VOLATILE AS $$ SELECT gen_random_uuid() $$;

CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username   TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'TODO',
    priority    TEXT,
    due_date    TIMESTAMPTZ,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id  UUID,                      -- FK added in 009 (projects table is created by 001)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    UUID NOT NULL,              -- FK added by 002
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    text       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    UUID,                       -- FK added by 004
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    action     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    role            TEXT NOT NULL DEFAULT 'member',
    status          TEXT NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
