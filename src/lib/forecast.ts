import { Transaction, Budget, RecurringTransaction, Account } from '@/types';

export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  spentSoFarPaise: number;
  scheduledRemainingPaise: number;
  projectedDiscretionaryPaise: number;
  projectedTotalMonthEndPaise: number;
  budgetLimitPaise: number | null;
  projectedOverBudgetPaise: number;
  isAtRisk: boolean;
}

export interface MonthEndForecast {
  daysInMonth: number;
  daysElapsed: number;
  daysRemaining: number;
  totalIncomeSoFarPaise: number;
  totalExpenseSoFarPaise: number;
  scheduledUpcomingIncomePaise: number;
  scheduledUpcomingExpensePaise: number;
  projectedDiscretionaryExpensePaise: number;
  projectedTotalExpensePaise: number;
  projectedTotalIncomePaise: number;
  projectedMonthEndNetPaise: number;
  currentAvailableBalancePaise: number;
  projectedMonthEndBalancePaise: number;
  categoryForecasts: CategoryForecast[];
  hasSufficientData: boolean;
  confidenceRating: 'Low' | 'Moderate' | 'High';
}

export interface WhatIfInput {
  incomeDeltaPaise: number; // e.g. +₹10,000 or -₹5,000
  discretionarySpendFactor: number; // e.g. 0.8 (20% cut) or 1.2 (20% increase)
  plannedPurchasePaise: number; // one-time planned purchase
  extraSavingsContributionPaise: number; // extra monthly savings
}

export interface WhatIfSimulationResult {
  baselineMonthEndNetPaise: number;
  simulatedMonthEndNetPaise: number;
  netImpactPaise: number;
  baselineMonthEndBalancePaise: number;
  simulatedMonthEndBalancePaise: number;
  simulatedSavingsTotalPaise: number;
  projectedRunwayMonths: number;
  advice: string[];
}

/**
 * Calculates end-of-month projections using daily burn rate + scheduled recurring commitments.
 */
export function calculateMonthEndForecast(params: {
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  budgets: Budget[];
  categories: { id: string; name: string }[];
  accounts: Account[];
  targetYearMonth: string; // YYYY-MM
  todayOverride?: Date;
}): MonthEndForecast {
  const {
    transactions,
    recurring,
    budgets,
    categories,
    accounts,
    targetYearMonth,
    todayOverride,
  } = params;

  const [yearStr, monthStr] = targetYearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const now = todayOverride || new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let daysElapsed = daysInMonth;
  let daysRemaining = 0;

  if (targetYearMonth === currentMonthStr) {
    daysElapsed = Math.min(now.getDate(), daysInMonth);
    daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  } else if (targetYearMonth > currentMonthStr) {
    daysElapsed = 0;
    daysRemaining = daysInMonth;
  }

  // Filter transactions for this month
  const monthTx = transactions.filter((t) => t.date.startsWith(targetYearMonth));

  let totalIncomeSoFarPaise = 0;
  let totalExpenseSoFarPaise = 0;

  const categorySpentMap: Record<string, number> = {};

  for (const tx of monthTx) {
    if (tx.type === 'income') {
      totalIncomeSoFarPaise += tx.amount_paise;
    } else if (tx.type === 'expense') {
      totalExpenseSoFarPaise += tx.amount_paise;
      const catId = tx.category_id || 'uncategorized';
      categorySpentMap[catId] = (categorySpentMap[catId] || 0) + tx.amount_paise;
    }
  }

  // Scheduled recurring transactions remaining in the month
  let scheduledUpcomingIncomePaise = 0;
  let scheduledUpcomingExpensePaise = 0;
  const scheduledCategoryMap: Record<string, number> = {};

  for (const rec of recurring) {
    if (!rec.is_active) continue;
    // Check if next_run_date falls within remaining days of target month
    if (rec.next_run_date >= `${targetYearMonth}-01` && rec.next_run_date <= `${targetYearMonth}-${daysInMonth}`) {
      // If it's the current month, only count if next_run_date >= today
      const recDate = new Date(rec.next_run_date);
      if (targetYearMonth !== currentMonthStr || recDate.getDate() >= daysElapsed) {
        if (rec.type === 'income') {
          scheduledUpcomingIncomePaise += rec.amount_paise;
        } else {
          scheduledUpcomingExpensePaise += rec.amount_paise;
          const catId = rec.category_id || 'uncategorized';
          scheduledCategoryMap[catId] = (scheduledCategoryMap[catId] || 0) + rec.amount_paise;
        }
      }
    }
  }

  // Current balance across accounts
  const currentAvailableBalancePaise = accounts.reduce((acc, a) => acc + (a.balance_paise || 0), 0);

  // Daily discretionary spend rate so far
  const effectiveDaysElapsed = Math.max(1, daysElapsed);
  const dailyDiscretionaryBurnPaise = Math.max(
    0,
    (totalExpenseSoFarPaise - (daysElapsed > 0 ? 0 : 0)) / effectiveDaysElapsed
  );

  const projectedDiscretionaryExpensePaise = Math.round(dailyDiscretionaryBurnPaise * daysRemaining);

  const projectedTotalExpensePaise =
    totalExpenseSoFarPaise + scheduledUpcomingExpensePaise + projectedDiscretionaryExpensePaise;

  const projectedTotalIncomePaise = totalIncomeSoFarPaise + scheduledUpcomingIncomePaise;
  const projectedMonthEndNetPaise = projectedTotalIncomePaise - projectedTotalExpensePaise;
  const projectedMonthEndBalancePaise = currentAvailableBalancePaise + projectedMonthEndNetPaise;

  // Category level forecasts
  const categoryForecasts: CategoryForecast[] = categories.map((cat) => {
    const spentSoFar = categorySpentMap[cat.id] || 0;
    const scheduled = scheduledCategoryMap[cat.id] || 0;
    const dailyCatRate = spentSoFar / effectiveDaysElapsed;
    const projectedDiscretionary = Math.round(dailyCatRate * daysRemaining);
    const projectedTotal = spentSoFar + scheduled + projectedDiscretionary;

    const budget = budgets.find((b) => b.category_id === cat.id);
    const budgetLimit = budget ? budget.amount_paise : null;
    const isAtRisk = budgetLimit !== null && projectedTotal > budgetLimit;
    const projectedOverBudgetPaise = budgetLimit !== null ? Math.max(0, projectedTotal - budgetLimit) : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      spentSoFarPaise: spentSoFar,
      scheduledRemainingPaise: scheduled,
      projectedDiscretionaryPaise: projectedDiscretionary,
      projectedTotalMonthEndPaise: projectedTotal,
      budgetLimitPaise: budgetLimit,
      projectedOverBudgetPaise,
      isAtRisk,
    };
  });

  const hasSufficientData = monthTx.length >= 3 && daysElapsed >= 3;
  let confidenceRating: 'Low' | 'Moderate' | 'High' = 'Moderate';
  if (!hasSufficientData || daysElapsed < 5) {
    confidenceRating = 'Low';
  } else if (daysElapsed > 20 && monthTx.length > 10) {
    confidenceRating = 'High';
  }

  return {
    daysInMonth,
    daysElapsed,
    daysRemaining,
    totalIncomeSoFarPaise,
    totalExpenseSoFarPaise,
    scheduledUpcomingIncomePaise,
    scheduledUpcomingExpensePaise,
    projectedDiscretionaryExpensePaise,
    projectedTotalExpensePaise,
    projectedTotalIncomePaise,
    projectedMonthEndNetPaise,
    currentAvailableBalancePaise,
    projectedMonthEndBalancePaise,
    categoryForecasts,
    hasSufficientData,
    confidenceRating,
  };
}

/**
 * Runs a real-time What-If simulation without modifying database records.
 */
export function simulateWhatIfScenario(
  baseline: MonthEndForecast,
  inputs: WhatIfInput
): WhatIfSimulationResult {
  const simulatedIncomePaise = baseline.projectedTotalIncomePaise + inputs.incomeDeltaPaise;

  const baselineDiscretionary = baseline.projectedDiscretionaryExpensePaise;
  const simulatedDiscretionary = Math.round(baselineDiscretionary * inputs.discretionarySpendFactor);

  const discretionaryDelta = simulatedDiscretionary - baselineDiscretionary;

  const simulatedExpensePaise =
    baseline.projectedTotalExpensePaise +
    discretionaryDelta +
    inputs.plannedPurchasePaise +
    inputs.extraSavingsContributionPaise;

  const baselineMonthEndNetPaise = baseline.projectedMonthEndNetPaise;
  const simulatedMonthEndNetPaise = simulatedIncomePaise - simulatedExpensePaise;
  const netImpactPaise = simulatedMonthEndNetPaise - baselineMonthEndNetPaise;

  const baselineMonthEndBalancePaise = baseline.projectedMonthEndBalancePaise;
  const simulatedMonthEndBalancePaise = baselineMonthEndBalancePaise + netImpactPaise;

  // Monthly burn rate for runway estimation
  const monthlyBurnPaise = Math.max(1000, simulatedExpensePaise);
  const projectedRunwayMonths =
    simulatedMonthEndBalancePaise > 0
      ? Number((simulatedMonthEndBalancePaise / monthlyBurnPaise).toFixed(1))
      : 0;

  const advice: string[] = [];

  if (inputs.discretionarySpendFactor < 1.0) {
    const savedPaise = Math.round(baselineDiscretionary * (1 - inputs.discretionarySpendFactor));
    advice.push(
      `Cutting discretionary expenses by ${Math.round((1 - inputs.discretionarySpendFactor) * 100)}% preserves ₹${(savedPaise / 100).toLocaleString('en-IN')} this month.`
    );
  }

  if (inputs.plannedPurchasePaise > 0) {
    if (simulatedMonthEndBalancePaise < 0) {
      advice.push(
        `Warning: This planned purchase of ₹${(inputs.plannedPurchasePaise / 100).toLocaleString('en-IN')} creates a negative month-end balance.`
      );
    } else {
      advice.push(
        `The purchase of ₹${(inputs.plannedPurchasePaise / 100).toLocaleString('en-IN')} leaves you with ₹${(simulatedMonthEndBalancePaise / 100).toLocaleString('en-IN')} in available liquidity.`
      );
    }
  }

  if (simulatedMonthEndNetPaise > 0) {
    advice.push(
      `Healthy surplus of ₹${(simulatedMonthEndNetPaise / 100).toLocaleString('en-IN')} projected for this scenario.`
    );
  }

  return {
    baselineMonthEndNetPaise,
    simulatedMonthEndNetPaise,
    netImpactPaise,
    baselineMonthEndBalancePaise,
    simulatedMonthEndBalancePaise,
    simulatedSavingsTotalPaise: inputs.extraSavingsContributionPaise,
    projectedRunwayMonths,
    advice,
  };
}
