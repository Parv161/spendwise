'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { spendwiseStore, subscribeToStore } from '@/lib/storage';
import { getCurrentMonthStr } from '@/lib/format';
import { calculateFinancialHealth } from '@/lib/health';
import { generateContextualInsights } from '@/lib/insights';
import { calculateMonthEndForecast } from '@/lib/forecast';
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
  Settlement,
  AppNotification,
  ForecastScenario,
} from '@/types';

export function useSpendwise() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [tick, setTick] = useState<number>(0);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    spendwiseStore.init();
    const unsubscribe = subscribeToStore(() => {
      setTick((prev) => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all entities from store
  const profile: Profile = useMemo(() => spendwiseStore.getProfile(), [tick, isClient]);
  const accounts: Account[] = useMemo(() => spendwiseStore.getAccounts(), [tick, isClient]);
  const categories: Category[] = useMemo(() => spendwiseStore.getCategories(), [tick, isClient]);
  const transactions: Transaction[] = useMemo(() => spendwiseStore.getTransactions(), [tick, isClient]);
  const recurring: RecurringTransaction[] = useMemo(() => spendwiseStore.getRecurring(), [tick, isClient]);
  const budgets: Budget[] = useMemo(() => spendwiseStore.getBudgets(), [tick, isClient]);
  const goals: SavingsGoal[] = useMemo(() => spendwiseStore.getGoals(), [tick, isClient]);
  const contributions: SavingsContribution[] = useMemo(() => spendwiseStore.getContributions(), [tick, isClient]);
  const challenges: SavingsChallenge[] = useMemo(() => spendwiseStore.getChallenges(), [tick, isClient]);
  const challengeProgress: ChallengeProgress[] = useMemo(() => spendwiseStore.getChallengeProgress(), [tick, isClient]);
  const groups: ExpenseGroup[] = useMemo(() => spendwiseStore.getGroups(), [tick, isClient]);
  const settlements: Settlement[] = useMemo(() => spendwiseStore.getSettlements(), [tick, isClient]);
  const notifications: AppNotification[] = useMemo(() => spendwiseStore.getNotifications(), [tick, isClient]);
  const scenarios: ForecastScenario[] = useMemo(() => spendwiseStore.getScenarios(), [tick, isClient]);

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Aggregate monthly income, expense, and net cash flow
  const totalIncomePaise = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount_paise, 0);
  }, [monthTransactions]);

  const totalExpensePaise = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount_paise, 0);
  }, [monthTransactions]);

  const netCashFlowPaise = useMemo(() => {
    return totalIncomePaise - totalExpensePaise;
  }, [totalIncomePaise, totalExpensePaise]);

  // Available liquid balance across all accounts
  const totalAvailableBalancePaise = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balance_paise, 0);
  }, [accounts]);

  // Overall budget utilization
  const overallBudget = useMemo(() => {
    return budgets.find((b) => b.category_id === null);
  }, [budgets]);

  const budgetUtilizationPct = useMemo(() => {
    if (!overallBudget || overallBudget.amount_paise <= 0) return 0;
    return Math.round((totalExpensePaise / overallBudget.amount_paise) * 100);
  }, [overallBudget, totalExpensePaise]);

  // Total savings progress across goals
  const savingsSummary = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount_paise, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount_paise, 0);
    const progressPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    return { totalTarget, totalSaved, progressPct };
  }, [goals]);

  // Category breakdown for charts
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { name: string; color: string; amountPaise: number; count: number }> = {};
    for (const tx of monthTransactions.filter((t) => t.type === 'expense')) {
      const cat = categories.find((c) => c.id === tx.category_id);
      const name = cat ? cat.name : 'Other / Uncategorized';
      const color = cat ? cat.color : '#64748b';
      const catId = cat ? cat.id : 'other';

      if (!map[catId]) {
        map[catId] = { name, color, amountPaise: 0, count: 0 };
      }
      map[catId].amountPaise += tx.amount_paise;
      map[catId].count += 1;
    }
    return Object.values(map).sort((a, b) => b.amountPaise - a.amountPaise);
  }, [monthTransactions, categories]);

  // Contextual Insights
  const contextualInsights = useMemo(() => {
    return generateContextualInsights({
      transactions,
      budgets,
      categories,
      recurring,
      goals,
      currentMonthStr: selectedMonth,
    });
  }, [transactions, budgets, categories, recurring, goals, selectedMonth]);

  // Financial Health
  const financialHealth = useMemo(() => {
    return calculateFinancialHealth({
      transactions,
      budgets,
      goals,
      recurring,
      monthlyIncomePaise: profile.monthly_income_paise,
      currentMonthStr: selectedMonth,
    });
  }, [transactions, budgets, goals, recurring, profile, selectedMonth]);

  // Month End Forecast
  const monthEndForecast = useMemo(() => {
    return calculateMonthEndForecast({
      transactions,
      recurring,
      budgets,
      categories,
      accounts,
      targetYearMonth: selectedMonth,
    });
  }, [transactions, recurring, budgets, categories, accounts, selectedMonth]);

  // Mutator actions
  const addTransaction = useCallback((tx: Transaction) => {
    spendwiseStore.addTransaction(tx);
  }, []);

  const updateTransaction = useCallback((tx: Transaction) => {
    spendwiseStore.updateTransaction(tx);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    spendwiseStore.deleteTransaction(id);
  }, []);

  const saveBudget = useCallback((b: Budget) => {
    spendwiseStore.saveBudget(b);
  }, []);

  const deleteBudget = useCallback((id: string) => {
    spendwiseStore.deleteBudget(id);
  }, []);

  const saveGoal = useCallback((g: SavingsGoal) => {
    spendwiseStore.saveGoal(g);
  }, []);

  const deleteGoal = useCallback((id: string) => {
    spendwiseStore.deleteGoal(id);
  }, []);

  const addContribution = useCallback((c: SavingsContribution) => {
    spendwiseStore.addContribution(c);
  }, []);

  const resetToDemo = useCallback(() => {
    spendwiseStore.resetToDemo();
  }, []);

  const updateProfile = useCallback((p: Partial<Profile>) => {
    spendwiseStore.updateProfile(p);
  }, []);

  return {
    isClient,
    selectedMonth,
    setSelectedMonth,
    profile,
    accounts,
    categories,
    transactions,
    monthTransactions,
    recurring,
    budgets,
    goals,
    contributions,
    challenges,
    challengeProgress,
    groups,
    settlements,
    notifications,
    scenarios,
    totalIncomePaise,
    totalExpensePaise,
    netCashFlowPaise,
    totalAvailableBalancePaise,
    overallBudget,
    budgetUtilizationPct,
    savingsSummary,
    categoryBreakdown,
    contextualInsights,
    financialHealth,
    monthEndForecast,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    saveBudget,
    deleteBudget,
    saveGoal,
    deleteGoal,
    addContribution,
    resetToDemo,
    updateProfile,
  };
}
