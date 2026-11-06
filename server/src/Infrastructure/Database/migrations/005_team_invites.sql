-- Mission 6: Invitation workflow hardening
ALTER TABLE team_invites ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill without dropping rows: existing invites expire 7 days after they were created.
UPDATE team_invites SET expires_at = created_at + INTERVAL '7 days' WHERE expires_at IS NULL;
ALTER TABLE team_invites ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '7 days');

CREATE INDEX IF NOT EXISTS idx_team_invites_invited_user ON team_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

-- At most one pending invite per invitee/team; verified conflict-free before applying.
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_invites_pending
    ON team_invites(team_id, invited_user_id) WHERE status = 'pending';
