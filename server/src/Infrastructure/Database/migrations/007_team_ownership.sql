-- Mission: Team ownership, membership and retrieval consistency.
-- 1) teams never had a created_at column, yet TeamRepo.update()/getByUserId() referenced it (42703).
-- 2) Team creators were never registered in team_members, so no team had an OWNER row.
--    Backfill every creator as OWNER, promoting existing 'member' rows instead of duplicating them.

ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- Backfill creator ownership. team_members primary key (team_id, user_id) makes this idempotent
-- and prevents duplicate rows; existing non-owner creator rows are promoted, never duplicated.
INSERT INTO team_members (team_id, user_id, role)
SELECT t.id, t.created_by, 'owner'
FROM teams t
ON CONFLICT (team_id, user_id) DO UPDATE SET role = 'owner'
WHERE team_members.role <> 'owner';
