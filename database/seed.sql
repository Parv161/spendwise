-- ==============================================================================
-- SPENDWISE — Seed Data (Realistic Fictional Indian Financial Records)
-- ==============================================================================

-- Standard Default Categories
INSERT INTO categories (id, user_id, name, type, classification, color, icon, is_custom) VALUES
  ('c0000000-0000-0000-0000-000000000001', NULL, 'Salary & Stipend', 'income', 'income', '#10b981', 'Briefcase', false),
  ('c0000000-0000-0000-0000-000000000002', NULL, 'Freelance & Projects', 'income', 'income', '#059669', 'Laptop', false),
  ('c0000000-0000-0000-0000-000000000003', NULL, 'Investment Returns', 'income', 'income', '#047857', 'TrendingUp', false),
  ('c0000000-0000-0000-0000-000000000010', NULL, 'Rent & Housing', 'expense', 'needs', '#6366f1', 'Home', false),
  ('c0000000-0000-0000-0000-000000000011', NULL, 'Groceries & Provisions', 'expense', 'needs', '#3b82f6', 'ShoppingCart', false),
  ('c0000000-0000-0000-0000-000000000012', NULL, 'Utilities & Wi-Fi', 'expense', 'needs', '#0ea5e9', 'Zap', false),
  ('c0000000-0000-0000-0000-000000000013', NULL, 'Transport & Metro', 'expense', 'needs', '#f59e0b', 'Bus', false),
  ('c0000000-0000-0000-0000-000000000014', NULL, 'Food Delivery & Dining', 'expense', 'wants', '#ef4444', 'Utensils', false),
  ('c0000000-0000-0000-0000-000000000015', NULL, 'Shopping & Apparel', 'expense', 'wants', '#ec4899', 'ShoppingBag', false),
  ('c0000000-0000-0000-0000-000000000016', NULL, 'Subscriptions & Entertainment', 'expense', 'wants', '#8b5cf6', 'Film', false),
  ('c0000000-0000-0000-0000-000000000017', NULL, 'Health & Medical', 'expense', 'needs', '#14b8a6', 'HeartPulse', false),
  ('c0000000-0000-0000-0000-000000000018', NULL, 'Travel & Vacations', 'expense', 'wants', '#f97316', 'Compass', false),
  ('c0000000-0000-0000-0000-000000000019', NULL, 'SIP & Mutual Funds', 'expense', 'savings', '#10b981', 'PiggyBank', false)
ON CONFLICT (id) DO NOTHING;

-- Standard Challenges
INSERT INTO savings_challenges (id, code, title, description, duration_days, target_amount_paise, badge_icon, rule_type) VALUES
  ('sc000000-0000-0000-0000-000000000001', 'CHAL_NO_DELIVERY_14', '14-Day Home Cook Sprint', 'Cut Swiggy/Zomato orders and save at least ₹3,500 over two weeks.', 14, 350000, 'ChefHat', 'no_spend_discretionary'),
  ('sc000000-0000-0000-0000-000000000002', 'CHAL_SIP_SPRINT_30', '₹10,000 Monthly Wealth Builder', 'Set aside ₹10,000 into liquid savings or index fund SIP this month.', 30, 1000000, 'TrendingUp', 'weekly_target'),
  ('sc000000-0000-0000-0000-000000000003', 'CHAL_METRO_STREAK_7', 'Public Transport Week', 'Cap commute costs below ₹600 by using Metro and electric buses instead of cabs.', 7, 60000, 'Train', 'stay_in_budget')
ON CONFLICT (id) DO NOTHING;
