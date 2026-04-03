-- Manual migration: Wallet schema setup
-- This migration creates the wallet schema and all tables with proper indexes and constraints.
-- Run manually: psql $DATABASE_URL -f 0005_wallet_schema.sql
-- NOT managed by drizzle-kit (not in _journal.json).

CREATE SCHEMA IF NOT EXISTS wallet;

-- Accounts
CREATE TABLE IF NOT EXISTS wallet.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  type VARCHAR(20) NOT NULL,
  initial_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS wallet.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) NOT NULL,
  type VARCHAR(10) NOT NULL,
  icon VARCHAR(30),
  parent_id UUID REFERENCES wallet.categories(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_parent_id_idx
  ON wallet.categories (parent_id);

-- Transactions
CREATE TABLE IF NOT EXISTS wallet.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES wallet.accounts(id),
  category_id UUID REFERENCES wallet.categories(id),
  type VARCHAR(10) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  description VARCHAR(255),
  date DATE NOT NULL,
  transfer_to_account_id UUID REFERENCES wallet.accounts(id),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tx_account_date_idx
  ON wallet.transactions (account_id, date);

CREATE INDEX IF NOT EXISTS tx_category_date_idx
  ON wallet.transactions (category_id, date);

CREATE INDEX IF NOT EXISTS tx_transfer_to_account_idx
  ON wallet.transactions (transfer_to_account_id);

-- Savings Goals
CREATE TABLE IF NOT EXISTS wallet.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL,
  deadline DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Savings Contributions
CREATE TABLE IF NOT EXISTS wallet.savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES wallet.savings_goals(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES wallet.transactions(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  note VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS sc_goal_id_idx
  ON wallet.savings_contributions (goal_id);

CREATE INDEX IF NOT EXISTS sc_transaction_id_idx
  ON wallet.savings_contributions (transaction_id);

-- Investments
CREATE TABLE IF NOT EXISTS wallet.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL,
  account_id UUID REFERENCES wallet.accounts(id),
  currency VARCHAR(3) NOT NULL,
  invested_amount DECIMAL(15, 2) NOT NULL,
  current_value DECIMAL(15, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  rate DECIMAL(6, 4),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS investments_account_id_idx
  ON wallet.investments (account_id);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS wallet.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(15, 4) NOT NULL,
  type VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS exchange_rate_unique_idx
  ON wallet.exchange_rates (from_currency, to_currency, type, date);
