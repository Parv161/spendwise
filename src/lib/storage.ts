'use client';

import {
  Profile,
  Account,
  Category,
  Transaction,
  RecurringTransaction,
  Budget,
  SavingsGoal,
  SavingsContribution,
  SavingsChallenge,
  ChallengeProgress,
  ExpenseGroup,
  GroupMember,
  GroupExpense,
  Settlement,
  AppNotification,
  ForecastScenario,
} from '@/types';

import {
  INITIAL_PROFILE,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_BUDGETS,
  INITIAL_TRANSACTIONS,
  INITIAL_RECURRING,
  INITIAL_SAVINGS_GOALS,
  INITIAL_SAVINGS_CONTRIBUTIONS,
  INITIAL_CHALLENGES,
  INITIAL_CHALLENGE_PROGRESS,
  INITIAL_EXPENSE_GROUPS,
  INITIAL_GROUP_MEMBERS,
  INITIAL_GROUP_EXPENSES,
  INITIAL_SETTLEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_FORECAST_SCENARIOS,
} from './demo-data';

const STORAGE_KEYS = {
  PROFILE: 'spendwise_profile_v1',
  ACCOUNTS: 'spendwise_accounts_v1',
  CATEGORIES: 'spendwise_categories_v1',
  TRANSACTIONS: 'spendwise_transactions_v1',
  RECURRING: 'spendwise_recurring_v1',
  BUDGETS: 'spendwise_budgets_v1',
  GOALS: 'spendwise_goals_v1',
  CONTRIBUTIONS: 'spendwise_contributions_v1',
  CHALLENGES: 'spendwise_challenges_v1',
  CHALLENGE_PROGRESS: 'spendwise_cp_v1',
  GROUPS: 'spendwise_groups_v1',
  GROUP_MEMBERS: 'spendwise_members_v1',
  GROUP_EXPENSES: 'spendwise_gexpenses_v1',
  SETTLEMENTS: 'spendwise_settlements_v1',
  NOTIFICATIONS: 'spendwise_notifications_v1',
  SCENARIOS: 'spendwise_scenarios_v1',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in storage listener', e);
    }
  });
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Failed to read from localStorage key ${key}`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notify();
  } catch (e) {
    console.error(`Failed to write to localStorage key ${key}`, e);
  }
}

// ==========================================
// STORE API
// ==========================================
export const spendwiseStore = {
  // Reset all to demo state
  resetToDemo(): void {
    if (typeof window === 'undefined') return;
    setItem(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
    setItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setItem(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
    setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    setItem(STORAGE_KEYS.RECURRING, INITIAL_RECURRING);
    setItem(STORAGE_KEYS.GOALS, INITIAL_SAVINGS_GOALS);
    setItem(STORAGE_KEYS.CONTRIBUTIONS, INITIAL_SAVINGS_CONTRIBUTIONS);
    setItem(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
    setItem(STORAGE_KEYS.CHALLENGE_PROGRESS, INITIAL_CHALLENGE_PROGRESS);
    setItem(STORAGE_KEYS.GROUPS, INITIAL_EXPENSE_GROUPS);
    setItem(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
    setItem(STORAGE_KEYS.GROUP_EXPENSES, INITIAL_GROUP_EXPENSES);
    setItem(STORAGE_KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setItem(STORAGE_KEYS.SCENARIOS, INITIAL_FORECAST_SCENARIOS);
    notify();
  },

  // Initialize store if empty
  init(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      this.resetToDemo();
    }
  },

  // Profile
  getProfile(): Profile {
    return getItem(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
  },
  updateProfile(profile: Partial<Profile>): void {
    const current = this.getProfile();
    setItem(STORAGE_KEYS.PROFILE, { ...current, ...profile });
  },

  // Accounts
  getAccounts(): Account[] {
    return getItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  },
  saveAccount(acc: Account): void {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === acc.id);
    if (idx >= 0) {
      accounts[idx] = acc;
    } else {
      accounts.push(acc);
    }
    setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  },

  // Categories
  getCategories(): Category[] {
    return getItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  addCategory(category: Category): void {
    const categories = this.getCategories();
    categories.push(category);
    setItem(STORAGE_KEYS.CATEGORIES, categories);
  },

  // Transactions
  getTransactions(): Transaction[] {
    return getItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  },
  addTransaction(tx: Transaction): void {
    const txs = this.getTransactions();
    txs.unshift(tx);
    setItem(STORAGE_KEYS.TRANSACTIONS, txs);

    // Update account balance
    if (tx.account_id) {
      const accounts = this.getAccounts();
      const acc = accounts.find((a) => a.id === tx.account_id);
      if (acc) {
        if (tx.type === 'income') {
          acc.balance_paise += tx.amount_paise;
        } else if (tx.type === 'expense') {
          acc.balance_paise -= tx.amount_paise;
        }
        this.saveAccount(acc);
      }
    }
  },
  updateTransaction(tx: Transaction): void {
    const txs = this.getTransactions();
    const idx = txs.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      txs[idx] = tx;
      setItem(STORAGE_KEYS.TRANSACTIONS, txs);
    }
  },
  deleteTransaction(id: string): void {
    const txs = this.getTransactions();
    const filtered = txs.filter((t) => t.id !== id);
    setItem(STORAGE_KEYS.TRANSACTIONS, filtered);
  },

  // Recurring Transactions
  getRecurring(): RecurringTransaction[] {
    return getItem(STORAGE_KEYS.RECURRING, INITIAL_RECURRING);
  },
  saveRecurring(rec: RecurringTransaction): void {
    const list = this.getRecurring();
    const idx = list.findIndex((r) => r.id === rec.id);
    if (idx >= 0) {
      list[idx] = rec;
    } else {
      list.push(rec);
    }
    setItem(STORAGE_KEYS.RECURRING, list);
  },
  deleteRecurring(id: string): void {
    const list = this.getRecurring().filter((r) => r.id !== id);
    setItem(STORAGE_KEYS.RECURRING, list);
  },

  // Budgets
  getBudgets(): Budget[] {
    return getItem(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
  },
  saveBudget(budget: Budget): void {
    const budgets = this.getBudgets();
    const idx = budgets.findIndex((b) => b.id === budget.id);
    if (idx >= 0) {
      budgets[idx] = budget;
    } else {
      budgets.push(budget);
    }
    setItem(STORAGE_KEYS.BUDGETS, budgets);
  },
  deleteBudget(id: string): void {
    const budgets = this.getBudgets().filter((b) => b.id !== id);
    setItem(STORAGE_KEYS.BUDGETS, budgets);
  },

  // Savings Goals & Contributions
  getGoals(): SavingsGoal[] {
    return getItem(STORAGE_KEYS.GOALS, INITIAL_SAVINGS_GOALS);
  },
  saveGoal(goal: SavingsGoal): void {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      goals[idx] = goal;
    } else {
      goals.push(goal);
    }
    setItem(STORAGE_KEYS.GOALS, goals);
  },
  deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    setItem(STORAGE_KEYS.GOALS, goals);
  },
  getContributions(): SavingsContribution[] {
    return getItem(STORAGE_KEYS.CONTRIBUTIONS, INITIAL_SAVINGS_CONTRIBUTIONS);
  },
  addContribution(c: SavingsContribution): void {
    const list = this.getContributions();
    list.unshift(c);
    setItem(STORAGE_KEYS.CONTRIBUTIONS, list);

    // Update goal amount
    const goals = this.getGoals();
    const g = goals.find((goal) => goal.id === c.goal_id);
    if (g) {
      if (c.type === 'deposit') {
        g.current_amount_paise += c.amount_paise;
      } else {
        g.current_amount_paise = Math.max(0, g.current_amount_paise - c.amount_paise);
      }
      if (g.current_amount_paise >= g.target_amount_paise) {
        g.is_completed = true;
      }
      this.saveGoal(g);
    }
  },

  // Challenges
  getChallenges(): SavingsChallenge[] {
    return getItem(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
  },
  getChallengeProgress(): ChallengeProgress[] {
    return getItem(STORAGE_KEYS.CHALLENGE_PROGRESS, INITIAL_CHALLENGE_PROGRESS);
  },
  saveChallengeProgress(cp: ChallengeProgress): void {
    const list = this.getChallengeProgress();
    const idx = list.findIndex((p) => p.id === cp.id);
    if (idx >= 0) {
      list[idx] = cp;
    } else {
      list.push(cp);
    }
    setItem(STORAGE_KEYS.CHALLENGE_PROGRESS, list);
  },

  // Expense Groups & Split
  getGroups(): ExpenseGroup[] {
    const groups = getItem<ExpenseGroup[]>(STORAGE_KEYS.GROUPS, INITIAL_EXPENSE_GROUPS);
    const members = getItem<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
    const expenses = getItem<GroupExpense[]>(STORAGE_KEYS.GROUP_EXPENSES, INITIAL_GROUP_EXPENSES);

    return groups.map((g) => ({
      ...g,
      members: members.filter((m) => m.group_id === g.id),
      expenses: expenses.filter((e) => e.group_id === g.id),
    }));
  },
  saveGroup(group: ExpenseGroup, members: GroupMember[]): void {
    const groups = getItem<ExpenseGroup[]>(STORAGE_KEYS.GROUPS, INITIAL_EXPENSE_GROUPS);
    const currentMembers = getItem<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);

    const gIdx = groups.findIndex((g) => g.id === group.id);
    if (gIdx >= 0) {
      groups[gIdx] = group;
    } else {
      groups.push(group);
    }
    setItem(STORAGE_KEYS.GROUPS, groups);

    // Save members
    const otherMembers = currentMembers.filter((m) => m.group_id !== group.id);
    setItem(STORAGE_KEYS.GROUP_MEMBERS, [...otherMembers, ...members]);
  },
  getGroupMembers(groupId: string): GroupMember[] {
    const members = getItem<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
    return members.filter((m) => m.group_id === groupId);
  },
  getGroupExpenses(groupId: string): GroupExpense[] {
    const expenses = getItem<GroupExpense[]>(STORAGE_KEYS.GROUP_EXPENSES, INITIAL_GROUP_EXPENSES);
    return expenses.filter((e) => e.group_id === groupId);
  },
  addGroupExpense(expense: GroupExpense): void {
    const expenses = getItem<GroupExpense[]>(STORAGE_KEYS.GROUP_EXPENSES, INITIAL_GROUP_EXPENSES);
    expenses.unshift(expense);
    setItem(STORAGE_KEYS.GROUP_EXPENSES, expenses);
  },
  getSettlements(groupId?: string): Settlement[] {
    const list = getItem<Settlement[]>(STORAGE_KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
    return groupId ? list.filter((s) => s.group_id === groupId) : list;
  },
  addSettlement(settlement: Settlement): void {
    const list = this.getSettlements();
    list.unshift(settlement);
    setItem(STORAGE_KEYS.SETTLEMENTS, list);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const n = notifs.find((item) => item.id === id);
    if (n) {
      n.is_read = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },
  markAllNotificationsRead(): void {
    const notifs = this.getNotifications().map((n) => ({ ...n, is_read: true }));
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  // Forecast Scenarios
  getScenarios(): ForecastScenario[] {
    return getItem(STORAGE_KEYS.SCENARIOS, INITIAL_FORECAST_SCENARIOS);
  },
  saveScenario(s: ForecastScenario): void {
    const list = this.getScenarios();
    const idx = list.findIndex((item) => item.id === s.id);
    if (idx >= 0) {
      list[idx] = s;
    } else {
      list.push(s);
    }
    setItem(STORAGE_KEYS.SCENARIOS, list);
  },
};
