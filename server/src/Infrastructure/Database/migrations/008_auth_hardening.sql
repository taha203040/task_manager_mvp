-- TM-02: per-account progressive throttling state.
-- The base schema (users/teams/tasks/...) is not tracked in this repository, so every
-- statement here is additive and guarded: applying it twice is a no-op.

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ;
