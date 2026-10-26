import { Transaction, Budget, Category, RecurringTransaction, SavingsGoal, AppNotification } from '@/types';
import { formatCurrency } from './format';

export interface InsightItem {
  id: string;
  type: 'warning' | 'alert' | 'success' | 'info';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  category?: string;
}

/**
 * Generates deterministic insights and alerts based on authoritative user records.
 */
export function generateContextualInsights(params: {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  recurring: RecurringTransaction[];
  goals: SavingsGoal[];
  currentMonthStr: string;
}): InsightItem[] {
  const { transactions, budgets, categories, recurring, goals, currentMonthStr } = params;
  const insights: InsightItem[] = [];

  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const [currY, currM] = currentMonthStr.split('-').map(Number);
  const prevDate = new Date(currY, currM - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthTx = transactions.filter((t) => t.date.startsWith(prevMonthStr));

  // 1. Budget Threshold Alerts
  for (const b of budgets) {
    let spentPaise = 0;
    let targetName = 'Overall Budget';

    if (b.category_id) {
      const cat = categories.find((c) => c.id === b.category_id);
      targetName = cat ? cat.name : 'Category';
      spentPaise = currentMonthTx
        .filter((t) => t.category_id === b.category_id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount_paise, 0);
    } else {
      spentPaise = currentMonthTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount_paise, 0);
    }

    if (b.amount_paise > 0) {
      const pct = Math.round((spentPaise / b.amount_paise) * 100);
      if (pct >= 100) {
        insights.push({
          id: `budget-exceeded-${b.id}`,
          type: 'alert',
          title: `${targetName} Exceeded Limit!`,
          message: `Spent ${formatCurrency(spentPaise)} out of ${formatCurrency(b.amount_paise)} (${pct}%). Limit surpassed.`,
          actionText: 'View Budgets',
          actionUrl: '/budgets',
        });
      } else if (pct >= b.alert_threshold_pct) {
        insights.push({
          id: `budget-warn-${b.id}`,
          type: 'warning',
          title: `${targetName} Nearing Limit`,
          message: `Spent ${formatCurrency(spentPaise)} of ${formatCurrency(b.amount_paise)} (${pct}% consumed). Threshold is ${b.alert_threshold_pct}%.`,
          actionText: 'Review Spending',
          actionUrl: '/budgets',
        });
      }
    }
  }

  // 2. Upcoming Recurring Bills (within next 7 days)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const todayIso = today.toISOString().slice(0, 10);
  const nextWeekIso = nextWeek.toISOString().slice(0, 10);

  for (const rec of recurring) {
    if (rec.is_active && rec.type === 'expense' && rec.next_run_date >= todayIso && rec.next_run_date <= nextWeekIso) {
      insights.push({
        id: `rec-upcoming-${rec.id}`,
        type: 'info',
        title: `Upcoming Payment: ${rec.description}`,
        message: `${formatCurrency(rec.amount_paise)} scheduled for ${rec.next_run_date}.`,
        actionText: 'View Cash Flow',
        actionUrl: '/cash-flow',
      });
    }
  }

  // 3. Category Surge vs Previous Month
  const foodCats = categories.filter((c) =>
    c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining') || c.name.toLowerCase().includes('grocer')
  );
  if (foodCats.length > 0) {
    const foodCatIds = new Set(foodCats.map((c) => c.id));
    const currFoodSpent = currentMonthTx
      .filter((t) => t.category_id && foodCatIds.has(t.category_id) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount_paise, 0);
    const prevFoodSpent = prevMonthTx
      .filter((t) => t.category_id && foodCatIds.has(t.category_id) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount_paise, 0);

    if (prevFoodSpent > 0 && currFoodSpent > prevFoodSpent * 1.25) {
      const surgePct = Math.round(((currFoodSpent - prevFoodSpent) / prevFoodSpent) * 100);
      insights.push({
        id: 'food-surge',
        type: 'warning',
        title: 'Food Spending is Higher',
        message: `Dining & Groceries spending is up ${surgePct}% (${formatCurrency(currFoodSpent)}) compared to last month at this stage.`,
        actionText: 'Inspect Transactions',
        actionUrl: '/transactions',
      });
    }
  }

  // 4. Savings Milestones
  for (const g of goals) {
    if (g.target_amount_paise > 0) {
      const pct = Math.round((g.current_amount_paise / g.target_amount_paise) * 100);
      if (pct >= 100 && !g.is_completed) {
        insights.push({
          id: `goal-complete-${g.id}`,
          type: 'success',
          title: `Milestone Achieved: ${g.name}!`,
          message: `Congratulations! Target of ${formatCurrency(g.target_amount_paise)} has been reached.`,
          actionText: 'View Goal',
          actionUrl: '/savings',
        });
      } else if (pct >= 50 && pct < 55) {
        insights.push({
          id: `goal-half-${g.id}`,
          type: 'success',
          title: `Halfway There: ${g.name}`,
          message: `You've achieved ${pct}% (${formatCurrency(g.current_amount_paise)}) of your goal!`,
          actionText: 'Contribute More',
          actionUrl: '/savings',
        });
      }
    }
  }

  return insights;
}
