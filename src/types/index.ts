export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  currency: CurrencyCode;
  monthly_income_paise: number;
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AccountType = 'savings' | 'current' | 'cash' | 'upi' | 'credit_card' | 'investment';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  balance_paise: number;
  currency: CurrencyCode;
  is_default: boolean;
  created_at?: string;
}

export type CategoryClassification = 'needs' | 'wants' | 'savings' | 'income';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  type: 'expense' | 'income';
  classification: CategoryClassification;
  color: string;
  icon: string;
  is_custom: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  amount_paise: number;
  type: TransactionType;
  description: string;
  date: string; // YYYY-MM-DD
  merchant?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  tags?: string[];
  is_recurring?: boolean;
  recurring_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  amount_paise: number;
  type: 'income' | 'expense';
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
  next_run_date: string;
  last_generated_date?: string | null;
  is_active: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null; // null = overall monthly budget
  amount_paise: number;
  period: 'monthly' | 'weekly' | 'custom';
  start_date: string;
  end_date: string;
  alert_threshold_pct: number;
  created_at?: string;
}

export type GoalPriority = 'low' | 'medium' | 'high';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount_paise: number;
  current_amount_paise: number;
  target_date: string;
  priority: GoalPriority;
  category?: string;
  description?: string | null;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SavingsContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount_paise: number;
  type: 'deposit' | 'withdrawal';
  notes?: string;
  date: string;
  created_at?: string;
}

export type ChallengeRuleType = 'weekly_target' | 'no_spend_discretionary' | 'stay_in_budget' | 'fixed_streak';

export interface SavingsChallenge {
  id: string;
  code: string;
  title: string;
  description: string;
  duration_days: number;
  target_amount_paise: number;
  badge_icon: string;
  rule_type: ChallengeRuleType;
}

export interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  start_date: string;
  end_date: string;
  current_amount_paise: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';
export type GroupType = 'trip' | 'housemates' | 'outing' | 'project' | 'other';

export interface ExpenseGroup {
  id: string;
  created_by: string;
  name: string;
  description?: string | null;
  currency: CurrencyCode;
  group_type: GroupType;
  created_at?: string;
  members?: GroupMember[];
  expenses?: GroupExpense[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id?: string | null;
  display_name: string;
  email?: string | null;
  role: 'admin' | 'member';
}

export interface GroupExpense {
  id: string;
  group_id: string;
  payer_member_id: string;
  title: string;
  total_amount_paise: number;
  split_type: SplitType;
  date: string;
  notes?: string | null;
  shares?: ExpenseShare[];
  created_at?: string;
}

export interface ExpenseShare {
  id: string;
  expense_id: string;
  member_id: string;
  allocated_share_paise: number;
  percentage?: number | null;
  share_units?: number | null;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_member_id: string;
  to_member_id: string;
  amount_paise: number;
  payment_method?: string;
  reference_note?: string;
  settled_at: string;
}

export type NotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'savings_milestone'
  | 'upcoming_bill'
  | 'settlement_update'
  | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface ForecastScenario {
  id: string;
  user_id: string;
  name: string;
  income_delta_paise: number;
  discretionary_spend_factor: number;
  planned_purchase_paise: number;
  planned_purchase_month?: number;
  notes?: string;
}

export interface FinancialHealthBreakdown {
  score: number; // 0-100
  rating: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  metrics: {
    savingsRateScore: number; // weight 25%
    budgetAdherenceScore: number; // weight 25%
    emergencyFundScore: number; // weight 20%
    recurringBurdenScore: number; // weight 15%
    spendingStabilityScore: number; // weight 15%
  };
  details: {
    savingsRatePct: number;
    budgetUtilizationPct: number;
    emergencyMonthsCovered: number;
    fixedObligationRatioPct: number;
    monthOverMonthDeltaPct: number;
  };
  explanations: string[];
}
