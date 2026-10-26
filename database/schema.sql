-- ==============================================================================
-- SPENDWISE — PostgreSQL Schema (Supabase compatible)
-- Advanced Personal Budgeting, Expense Splitting & Financial Intelligence Platform
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  monthly_income_paise BIGINT DEFAULT 0,
  needs_pct NUMERIC(5,2) DEFAULT 50.00,
  wants_pct NUMERIC(5,2) DEFAULT 30.00,
  savings_pct NUMERIC(5,2) DEFAULT 20.00,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Accounts Table (Bank, Cash, UPI, Credit Card, Wallet)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('savings', 'current', 'cash', 'upi', 'credit_card', 'investment')),
  balance_paise BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Categories Table (System defaults and user custom categories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL means global system category
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  classification TEXT NOT NULL DEFAULT 'needs' CHECK (classification IN ('needs', 'wants', 'savings', 'income')),
  color TEXT NOT NULL DEFAULT '#10b981',
  icon TEXT NOT NULL DEFAULT 'Tag',
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount_paise BIGINT NOT NULL, -- Integer minor unit (1 INR = 100 paise)
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  merchant TEXT,
  notes TEXT,
  receipt_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Recurring Transactions Table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount_paise BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_run_date DATE NOT NULL,
  last_generated_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- NULL indicates overall monthly budget
  amount_paise BIGINT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'weekly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  alert_threshold_pct INT NOT NULL DEFAULT 80, -- e.g. 75, 80, 90, 100
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Savings Goals Table
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount_paise BIGINT NOT NULL,
  current_amount_paise BIGINT NOT NULL DEFAULT 0,
  target_date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT DEFAULT 'general',
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Savings Contributions Table
CREATE TABLE IF NOT EXISTS savings_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Savings Challenges Table
CREATE TABLE IF NOT EXISTS savings_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_days INT NOT NULL,
  target_amount_paise BIGINT NOT NULL,
  badge_icon TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('weekly_target', 'no_spend_discretionary', 'stay_in_budget', 'fixed_streak')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Challenge Progress Table
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES savings_challenges(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  current_amount_paise BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- 12. Expense Groups Table (For Shared Expense Splitting)
CREATE TABLE IF NOT EXISTS expense_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  group_type TEXT NOT NULL DEFAULT 'trip' CHECK (group_type IN ('trip', 'housemates', 'outing', 'project', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL if placeholder member
  display_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, email),
  UNIQUE(group_id, user_id)
);

-- 14. Group Expenses Table
CREATE TABLE IF NOT EXISTS group_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  payer_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  total_amount_paise BIGINT NOT NULL,
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'exact', 'percentage', 'shares')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Expense Shares Table
CREATE TABLE IF NOT EXISTS expense_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  allocated_share_paise BIGINT NOT NULL,
  percentage NUMERIC(5,2),
  share_units INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Settlements Table (Recorded repayments between members)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
  to_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
  amount_paise BIGINT NOT NULL,
  payment_method TEXT DEFAULT 'UPI',
  reference_note TEXT,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget_warning', 'budget_exceeded', 'savings_milestone', 'upcoming_bill', 'settlement_update', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. What-If Forecast Scenarios Table
CREATE TABLE IF NOT EXISTS forecast_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  income_delta_paise BIGINT DEFAULT 0,
  discretionary_spend_factor NUMERIC(4,2) DEFAULT 1.0,
  planned_purchase_paise BIGINT DEFAULT 0,
  planned_purchase_month INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_group ON group_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense ON expense_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_scenarios ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select, insert, update only their own profile
CREATE POLICY "Users access own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Accounts: Users access own accounts
CREATE POLICY "Users access own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

-- Categories: Users access system categories (user_id IS NULL) or their own
CREATE POLICY "Users access public or own categories" ON categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users manage own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- Transactions: Users manage own transactions
CREATE POLICY "Users access own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Recurring Transactions
CREATE POLICY "Users access own recurring transactions" ON recurring_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users access own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

-- Savings
CREATE POLICY "Users access own savings goals" ON savings_goals
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own savings contributions" ON savings_contributions
  FOR ALL USING (auth.uid() = user_id);

-- Savings Challenges: Everyone can view challenges; progress is user-specific
CREATE POLICY "Public view challenges" ON savings_challenges
  FOR SELECT USING (true);
CREATE POLICY "Users access own challenge progress" ON challenge_progress
  FOR ALL USING (auth.uid() = user_id);

-- Groups: Members can view and edit group resources
CREATE POLICY "Group creators or members access group" ON expense_groups
  FOR ALL USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM group_members WHERE group_id = expense_groups.id AND user_id = auth.uid())
  );

CREATE POLICY "Group members access members list" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM expense_groups eg
      WHERE eg.id = group_members.group_id
      AND (eg.created_by = auth.uid() OR EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = eg.id AND gm2.user_id = auth.uid()))
    )
  );

CREATE POLICY "Group members access group expenses" ON group_expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM expense_groups eg
      WHERE eg.id = group_expenses.group_id
      AND (eg.created_by = auth.uid() OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = eg.id AND gm.user_id = auth.uid()))
    )
  );

CREATE POLICY "Group members access expense shares" ON expense_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_expenses ge
      JOIN expense_groups eg ON ge.group_id = eg.id
      WHERE ge.id = expense_shares.expense_id
      AND (eg.created_by = auth.uid() OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = eg.id AND gm.user_id = auth.uid()))
    )
  );

CREATE POLICY "Group members access settlements" ON settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM expense_groups eg
      WHERE eg.id = settlements.group_id
      AND (eg.created_by = auth.uid() OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = eg.id AND gm.user_id = auth.uid()))
    )
  );

-- Notifications
CREATE POLICY "Users access own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Forecast Scenarios
CREATE POLICY "Users access own forecast scenarios" ON forecast_scenarios
  FOR ALL USING (auth.uid() = user_id);
