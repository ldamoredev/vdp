CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS core.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON core.users(email);

INSERT INTO core.users (id, email, display_name, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'legacy-owner@vdp.local',
  'Legacy Owner',
  'legacy-password-hash',
  'admin',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS core.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON core.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON core.sessions(expires_at);

CREATE TABLE IF NOT EXISTS core.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  actor_session_id UUID REFERENCES core.sessions(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(120) NOT NULL,
  resource_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON core.audit_logs(actor_user_id, created_at);

ALTER TABLE core.agent_conversations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;

UPDATE core.agent_conversations
SET user_id = COALESCE(user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE user_id IS NULL;

ALTER TABLE core.agent_conversations
  ALTER COLUMN user_id SET NOT NULL;

DROP INDEX IF EXISTS agent_conv_domain_updated_idx;
CREATE INDEX IF NOT EXISTS agent_conv_domain_updated_idx
  ON core.agent_conversations(user_id, domain, updated_at);

ALTER TABLE tasks.tasks
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;

UPDATE tasks.tasks
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL;

ALTER TABLE tasks.tasks
  ALTER COLUMN owner_user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS tasks_owner_user_idx ON tasks.tasks(owner_user_id);

ALTER TABLE tasks.task_notes
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;

ALTER TABLE tasks.task_notes
  ADD COLUMN IF NOT EXISTS author_user_id UUID REFERENCES core.users(id) ON DELETE RESTRICT;

UPDATE tasks.task_notes
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid),
    author_user_id = COALESCE(author_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL OR author_user_id IS NULL;

ALTER TABLE tasks.task_notes
  ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE tasks.task_notes
  ALTER COLUMN author_user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS task_notes_owner_user_idx ON tasks.task_notes(owner_user_id);

ALTER TABLE wallet.accounts
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;
UPDATE wallet.accounts
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL;
ALTER TABLE wallet.accounts
  ALTER COLUMN owner_user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS accounts_owner_user_idx ON wallet.accounts(owner_user_id);

ALTER TABLE wallet.categories
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;
UPDATE wallet.categories
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL;
ALTER TABLE wallet.categories
  ALTER COLUMN owner_user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS categories_owner_user_idx ON wallet.categories(owner_user_id);

ALTER TABLE wallet.transactions
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;
UPDATE wallet.transactions
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL;
ALTER TABLE wallet.transactions
  ALTER COLUMN owner_user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS tx_owner_user_idx ON wallet.transactions(owner_user_id);

ALTER TABLE wallet.savings_goals
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;
UPDATE wallet.savings_goals
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL;
ALTER TABLE wallet.savings_goals
  ALTER COLUMN owner_user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS savings_goals_owner_user_idx ON wallet.savings_goals(owner_user_id);

ALTER TABLE wallet.savings_contributions
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;
UPDATE wallet.savings_contributions
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL;
ALTER TABLE wallet.savings_contributions
  ALTER COLUMN owner_user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS savings_contributions_owner_user_idx ON wallet.savings_contributions(owner_user_id);

ALTER TABLE wallet.investments
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;
UPDATE wallet.investments
SET owner_user_id = COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE owner_user_id IS NULL;
ALTER TABLE wallet.investments
  ALTER COLUMN owner_user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS investments_owner_user_idx ON wallet.investments(owner_user_id);
