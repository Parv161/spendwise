import { Transaction, Budget, SavingsGoal, RecurringTransaction, FinancialHealthBreakdown } from '@/types';

/**
 * Calculates a transparent, explainable Financial Health Score (0-100).
 *
 * Weights:
 * - Savings Rate: 25%
 * - Budget Adherence: 25%
 * - Emergency Fund Readiness: 20%
 * - Fixed Obligation (Recurring) Burden: 15%
 * - Spending Stability (MoM): 15%
 */
export function calculateFinancialHealth(params: {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurring: RecurringTransaction[];
  monthlyIncomePaise: number;
  currentMonthStr: string;
}): FinancialHealthBreakdown {
  const { transactions, budgets, goals, recurring, monthlyIncomePaise, currentMonthStr } = params;

  // 1. Transactions in current month
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;
  let needsExpensePaise = 0;
  let wantsExpensePaise = 0;

  for (const tx of currentMonthTx) {
    if (tx.type === 'income') {
      totalIncomePaise += tx.amount_paise;
    } else if (tx.type === 'expense') {
      totalExpensePaise += tx.amount_paise;
      // Heuristic: rent, groceries, transport, utilities, health are needs
      const desc = tx.description.toLowerCase();
      if (
        desc.includes('rent') ||
        desc.includes('grocer') ||
        desc.includes('bill') ||
        desc.includes('metro') ||
        desc.includes('wifi') ||
        desc.includes('med')
      ) {
        needsExpensePaise += tx.amount_paise;
      } else {
        wantsExpensePaise += tx.amount_paise;
      }
    }
  }

  // Effective income: user profile income or recorded income
  const effectiveIncomePaise = Math.max(monthlyIncomePaise, totalIncomePaise);

  const explanations: string[] = [];

  // ==========================================
  // METRIC 1: Savings Rate (25 points max)
  // Benchmark: 20%+ gets 25 pts, 10-20% gets 15-24 pts, <0% gets 0 pts
  // ==========================================
  let savingsRateScore = 15; // default moderate score if income unknown
  let savingsRatePct = 0;

  if (effectiveIncomePaise > 0) {
    const netSavingsPaise = Math.max(0, effectiveIncomePaise - totalExpensePaise);
    savingsRatePct = Math.round((netSavingsPaise / effectiveIncomePaise) * 100);

    if (savingsRatePct >= 30) {
      savingsRateScore = 25;
      explanations.push(`Outstanding savings rate of ${savingsRatePct}% (target: 20%+).`);
    } else if (savingsRatePct >= 20) {
      savingsRateScore = 22;
      explanations.push(`Strong savings rate of ${savingsRatePct}%, adhering well to standard 50/30/20 guidelines.`);
    } else if (savingsRatePct >= 10) {
      savingsRateScore = 16;
      explanations.push(`Moderate savings rate of ${savingsRatePct}%. Aiming for 20% will build greater resilience.`);
    } else if (savingsRatePct > 0) {
      savingsRateScore = 10;
      explanations.push(`Low savings rate of ${savingsRatePct}%. Expenses are consuming almost all incoming funds.`);
    } else {
      savingsRateScore = 4;
      explanations.push('Negative cash flow this month: expenses currently exceed incoming funds.');
    }
  } else {
    explanations.push('No regular income recorded yet. Savings rate evaluated on net inflow baseline.');
  }

  // ==========================================
  // METRIC 2: Budget Adherence (25 points max)
  // Overall spending vs overall budget
  // ==========================================
  let budgetAdherenceScore = 20;
  let budgetUtilizationPct = 0;

  const overallBudget = budgets.find((b) => b.category_id === null);
  const totalBudgetPaise = overallBudget
    ? overallBudget.amount_paise
    : budgets.reduce((acc, b) => acc + b.amount_paise, 0);

  if (totalBudgetPaise > 0) {
    budgetUtilizationPct = Math.round((totalExpensePaise / totalBudgetPaise) * 100);

    if (budgetUtilizationPct <= 80) {
      budgetAdherenceScore = 25;
      explanations.push(`Excellent budget discipline: utilized ${budgetUtilizationPct}% of allocated monthly limit.`);
    } else if (budgetUtilizationPct <= 95) {
      budgetAdherenceScore = 20;
      explanations.push(`Good budget utilization at ${budgetUtilizationPct}%. Approaching monthly limits.`);
    } else if (budgetUtilizationPct <= 105) {
      budgetAdherenceScore = 12;
      explanations.push(`At the limit (${budgetUtilizationPct}%). Review discretionary purchases.`);
    } else {
      budgetAdherenceScore = 5;
      explanations.push(`Over budget at ${budgetUtilizationPct}%. Limits exceeded.`);
    }
  } else {
    explanations.push('Create monthly or category budgets to activate full budget adherence tracking.');
  }

  // ==========================================
  // METRIC 3: Emergency Fund Readiness (20 points max)
  // Progress on emergency fund goal vs estimated monthly expenses
  // ==========================================
  let emergencyFundScore = 12;
  let emergencyMonthsCovered = 0;

  const emergencyGoal = goals.find(
    (g) =>
      g.name.toLowerCase().includes('emergency') ||
      g.name.toLowerCase().includes('rainy') ||
      g.priority === 'high'
  );

  const baselineMonthlyExpensePaise = totalExpensePaise > 0 ? totalExpensePaise : 3000000; // fallback ₹30,000

  if (emergencyGoal) {
    emergencyMonthsCovered = Number(
      (emergencyGoal.current_amount_paise / baselineMonthlyExpensePaise).toFixed(1)
    );

    if (emergencyMonthsCovered >= 6) {
      emergencyFundScore = 20;
      explanations.push(`Robust emergency buffer: ~${emergencyMonthsCovered} months of living expenses secured.`);
    } else if (emergencyMonthsCovered >= 3) {
      emergencyFundScore = 16;
      explanations.push(`Solid emergency cushion: ~${emergencyMonthsCovered} months covered (target: 6 months).`);
    } else if (emergencyMonthsCovered >= 1) {
      emergencyFundScore = 11;
      explanations.push(`Foundational emergency reserve: ~${emergencyMonthsCovered} month covered.`);
    } else {
      emergencyFundScore = 6;
      explanations.push('Emergency fund started. Prioritizing at least 3 months is advised.');
    }
  } else {
    explanations.push('Consider creating an dedicated Emergency Fund savings goal.');
  }

  // ==========================================
  // METRIC 4: Fixed Obligation Burden (15 points max)
  // Ratio of recurring commitments to income (lower is healthier)
  // ==========================================
  let recurringBurdenScore = 12;
  let fixedObligationRatioPct = 0;

  const totalMonthlyRecurringExpensePaise = recurring
    .filter((r) => r.is_active && r.type === 'expense')
    .reduce((acc, r) => {
      // normalize to monthly
      if (r.frequency === 'monthly') return acc + r.amount_paise;
      if (r.frequency === 'weekly') return acc + r.amount_paise * 4;
      if (r.frequency === 'yearly') return acc + Math.round(r.amount_paise / 12);
      return acc + r.amount_paise;
    }, 0);

  if (effectiveIncomePaise > 0) {
    fixedObligationRatioPct = Math.round(
      (totalMonthlyRecurringExpensePaise / effectiveIncomePaise) * 100
    );

    if (fixedObligationRatioPct <= 30) {
      recurringBurdenScore = 15;
      explanations.push(`Low fixed commitment ratio (${fixedObligationRatioPct}% of income), providing high flexibility.`);
    } else if (fixedObligationRatioPct <= 50) {
      recurringBurdenScore = 12;
      explanations.push(`Moderate fixed commitments (${fixedObligationRatioPct}%). Safe financial room.`);
    } else {
      recurringBurdenScore = 6;
      explanations.push(`High fixed commitment burden (${fixedObligationRatioPct}%). Subscriptions or bills leave little margin.`);
    }
  }

  // ==========================================
  // METRIC 5: Spending Stability (15 points max)
  // Month-over-month trend
  // ==========================================
  let spendingStabilityScore = 12;
  let monthOverMonthDeltaPct = 0;

  // Previous month transactions
  const [currY, currM] = currentMonthStr.split('-').map(Number);
  const prevDate = new Date(currY, currM - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthExpenses = transactions
    .filter((t) => t.date.startsWith(prevMonthStr) && t.type === 'expense')
    .reduce((acc, t) => acc + t.amount_paise, 0);

  if (prevMonthExpenses > 0 && totalExpensePaise > 0) {
    monthOverMonthDeltaPct = Math.round(
      ((totalExpensePaise - prevMonthExpenses) / prevMonthExpenses) * 100
    );

    if (monthOverMonthDeltaPct <= 0) {
      spendingStabilityScore = 15;
      explanations.push(`Disciplined trend: spending is ${Math.abs(monthOverMonthDeltaPct)}% lower than last month.`);
    } else if (monthOverMonthDeltaPct <= 15) {
      spendingStabilityScore = 12;
      explanations.push(`Stable spending: slight ${monthOverMonthDeltaPct}% increase compared to last month.`);
    } else {
      spendingStabilityScore = 7;
      explanations.push(`Spending surged ${monthOverMonthDeltaPct}% higher than previous month.`);
    }
  }

  // Calculate final score
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      savingsRateScore +
        budgetAdherenceScore +
        emergencyFundScore +
        recurringBurdenScore +
        spendingStabilityScore
    )
  );

  let rating: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent' = 'Good';
  if (totalScore >= 85) rating = 'Excellent';
  else if (totalScore >= 70) rating = 'Very Good';
  else if (totalScore >= 55) rating = 'Good';
  else if (totalScore >= 40) rating = 'Fair';
  else rating = 'Poor';

  return {
    score: totalScore,
    rating,
    metrics: {
      savingsRateScore,
      budgetAdherenceScore,
      emergencyFundScore,
      recurringBurdenScore,
      spendingStabilityScore,
    },
    details: {
      savingsRatePct,
      budgetUtilizationPct,
      emergencyMonthsCovered,
      fixedObligationRatioPct,
      monthOverMonthDeltaPct,
    },
    explanations,
  };
}
