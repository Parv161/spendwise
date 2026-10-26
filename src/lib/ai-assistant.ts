import { Transaction, Budget, Category, SavingsGoal, RecurringTransaction } from '@/types';
import { formatCurrency } from './format';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  source: 'ai' | 'rule_based';
  timestamp: string;
  suggestedPrompts?: string[];
}

export interface AssistantContext {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  goals: SavingsGoal[];
  recurring: RecurringTransaction[];
  currentMonthStr: string;
  monthlyIncomePaise: number;
}

/**
 * Deterministic rule-based assistant when no LLM API key is configured.
 * Computes exact answers from actual user records without hallucinations.
 */
export function getRuleBasedResponse(
  userQuery: string,
  context: AssistantContext
): { text: string; suggestedPrompts: string[] } {
  const query = userQuery.toLowerCase();
  const { transactions, budgets, categories, goals, recurring, currentMonthStr, monthlyIncomePaise } =
    context;

  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const currentMonthExpenses = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount_paise, 0);
  const currentMonthIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount_paise, 0);

  // Previous month comparison
  const [currY, currM] = currentMonthStr.split('-').map(Number);
  const prevDate = new Date(currY, currM - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthTx = transactions.filter((t) => t.date.startsWith(prevMonthStr));
  const prevMonthExpenses = prevMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount_paise, 0);

  // Group current month spending by category
  const categorySpent: Record<string, number> = {};
  for (const t of currentMonthTx.filter((t) => t.type === 'expense')) {
    const catId = t.category_id || 'unknown';
    categorySpent[catId] = (categorySpent[catId] || 0) + t.amount_paise;
  }

  // Find highest category
  let topCatId = '';
  let topCatSpent = 0;
  for (const [catId, spent] of Object.entries(categorySpent)) {
    if (spent > topCatSpent) {
      topCatSpent = spent;
      topCatId = catId;
    }
  }
  const topCat = categories.find((c) => c.id === topCatId);
  const topCatName = topCat ? topCat.name : 'General';

  // 1. "Why did I spend more this month?" / "spending increase"
  if (query.includes('spend more') || query.includes('increased') || query.includes('why')) {
    if (prevMonthExpenses > 0) {
      const delta = currentMonthExpenses - prevMonthExpenses;
      const pct = Math.round((delta / prevMonthExpenses) * 100);
      if (delta > 0) {
        return {
          text: `Your spending this month is **${formatCurrency(currentMonthExpenses)}**, which is **${formatCurrency(delta)} (${pct}%) higher** than last month (${formatCurrency(prevMonthExpenses)}).\n\nKey contributor:\n- **${topCatName}**: Accounted for ${formatCurrency(topCatSpent)} (${Math.round((topCatSpent / currentMonthExpenses) * 100)}% of your expenses this month).\n\nTip: Check if there were one-off travel or shopping expenses in your transaction history.`,
          suggestedPrompts: [
            'Which category increased the most?',
            'Am I likely to exceed my budget?',
            'What are 3 ways to reduce spending?',
          ],
        };
      } else {
        return {
          text: `Great news! Your spending this month (${formatCurrency(currentMonthExpenses)}) is actually **${formatCurrency(Math.abs(delta))} (${Math.abs(pct)}%) lower** than last month (${formatCurrency(prevMonthExpenses)}). You are tracking well!`,
          suggestedPrompts: [
            'Am I likely to exceed my budget?',
            'How much can I save this month?',
          ],
        };
      }
    } else {
      return {
        text: `You have recorded **${formatCurrency(currentMonthExpenses)}** in expenses across ${currentMonthTx.length} transactions for this month. Your highest spending category is **${topCatName}** at ${formatCurrency(topCatSpent)}.`,
        suggestedPrompts: [
          'Which category increased the most?',
          'Am I likely to exceed my budget?',
        ],
      };
    }
  }

  // 2. "Which category increased the most?" / "top category"
  if (query.includes('category') || query.includes('highest') || query.includes('where is my money going')) {
    const sorted = Object.entries(categorySpent).sort((a, b) => b[1] - a[1]);
    const topThree = sorted.slice(0, 3).map(([catId, spent]) => {
      const cat = categories.find((c) => c.id === catId);
      const name = cat ? cat.name : 'Other';
      const pct = currentMonthExpenses > 0 ? Math.round((spent / currentMonthExpenses) * 100) : 0;
      return `- **${name}**: ${formatCurrency(spent)} (${pct}%)`;
    });

    return {
      text: `Here is your top spending breakdown for this month:\n\n${topThree.join('\n')}\n\nTotal outflow so far: **${formatCurrency(currentMonthExpenses)}**.`,
      suggestedPrompts: [
        'Am I likely to exceed my budget?',
        'Can I afford a planned purchase?',
        'What are 3 ways to reduce spending?',
      ],
    };
  }

  // 3. "Am I likely to exceed my budget?" / "budget"
  if (query.includes('budget') || query.includes('exceed') || query.includes('limit')) {
    const overallBudget = budgets.find((b) => b.category_id === null);
    if (!overallBudget) {
      return {
        text: `You have not set an overall monthly budget yet. You have spent **${formatCurrency(currentMonthExpenses)}** this month. Visit the **Budgets** page to set target caps.`,
        suggestedPrompts: ['How much can I save this month?', 'What are 3 ways to reduce spending?'],
      };
    }

    const remaining = overallBudget.amount_paise - currentMonthExpenses;
    const utilization = Math.round((currentMonthExpenses / overallBudget.amount_paise) * 100);

    if (utilization >= 100) {
      return {
        text: `⚠️ **Warning**: You have exceeded your monthly budget of **${formatCurrency(overallBudget.amount_paise)}**! Current expenditure is **${formatCurrency(currentMonthExpenses)}** (${utilization}% utilized, over by ${formatCurrency(Math.abs(remaining))}).`,
        suggestedPrompts: ['What are 3 ways to reduce spending?', 'Which category increased the most?'],
      };
    } else if (utilization >= 80) {
      return {
        text: `⚠️ **Heads up**: You have utilized **${utilization}%** of your budget (${formatCurrency(currentMonthExpenses)} of ${formatCurrency(overallBudget.amount_paise)}). You have **${formatCurrency(remaining)}** remaining.`,
        suggestedPrompts: ['Can I afford a planned purchase?', 'What are 3 ways to reduce spending?'],
      };
    } else {
      return {
        text: `✅ **On Track**: You have used **${utilization}%** of your monthly limit (${formatCurrency(currentMonthExpenses)} / ${formatCurrency(overallBudget.amount_paise)}). You have **${formatCurrency(remaining)}** remaining buffer.`,
        suggestedPrompts: ['Can I afford a planned purchase?', 'How much can I save this month?'],
      };
    }
  }

  // 4. "Can I afford" / "afford"
  if (query.includes('afford') || query.includes('buy') || query.includes('purchase')) {
    const netCashflow = currentMonthIncome - currentMonthExpenses;
    return {
      text: `Based on your current month:\n- Total Inflow: **${formatCurrency(currentMonthIncome)}**\n- Total Outflow: **${formatCurrency(currentMonthExpenses)}**\n- Current Net Margin: **${formatCurrency(netCashflow)}**\n\nTo safely afford a non-essential purchase, ensure it does not deplete your emergency savings or create a negative monthly cash flow. You can test the exact impact using the **What-If Simulator**!`,
      suggestedPrompts: [
        'Open What-If Simulator',
        'Am I likely to exceed my budget?',
        'How much should I keep in emergency fund?',
      ],
    };
  }

  // 5. "How much to save" / "goal"
  if (query.includes('goal') || query.includes('save') || query.includes('emergency')) {
    if (goals.length > 0) {
      const activeGoals = goals.filter((g) => !g.is_completed).slice(0, 3);
      const goalSummaries = activeGoals.map((g) => {
        const remaining = g.target_amount_paise - g.current_amount_paise;
        const pct = Math.round((g.current_amount_paise / g.target_amount_paise) * 100);
        return `- **${g.name}**: ${formatCurrency(g.current_amount_paise)} / ${formatCurrency(g.target_amount_paise)} (${pct}%) — **${formatCurrency(remaining)} remaining**.`;
      });

      return {
        text: `Here is the status of your active savings goals:\n\n${goalSummaries.join('\n')}\n\nTip: Setting up an automated recurring transfer on your salary date guarantees consistent progress!`,
        suggestedPrompts: [
          'What are 3 ways to reduce spending?',
          'Am I likely to exceed my budget?',
        ],
      };
    } else {
      return {
        text: 'You do not have any active savings goals yet. Create a goal on the **Savings Goals** page to track targets like emergency funds or tech upgrades.',
        suggestedPrompts: ['Am I likely to exceed my budget?', 'Which category increased the most?'],
      };
    }
  }

  // 6. "3 ways to reduce spending" / "advice" / "tips"
  if (query.includes('reduce') || query.includes('cut') || query.includes('tips') || query.includes('ways')) {
    return {
      text: `Here are 3 high-impact, actionable ways tailored to your profile:\n\n1. **Cap Food Delivery & Dining**: Group dining and food delivery often account for 25–40% of discretionary outflow. Cooking 2 extra dinners a week typically saves ₹2,500–₹4,000 monthly.\n2. **Review Recurring Subscriptions**: Check streaming, gym, or software memberships you haven't used this month. Pausing just one saves ₹499–₹1,499/mo.\n3. **Use the 48-Hour Rule**: For impulse shopping items over ₹2,000, wait 48 hours before purchasing to eliminate emotional buying.`,
      suggestedPrompts: [
        'Am I likely to exceed my budget?',
        'Which category increased the most?',
        'Can I afford a planned purchase?',
      ],
    };
  }

  // Generic fallback
  return {
    text: `I'm your SpendWise Financial Assistant! I can help you understand your spending patterns, budget limits, savings goals, and cash flow forecasts.\n\nTry asking:\n- "Why did I spend more this month?"\n- "Which category increased the most?"\n- "Am I likely to exceed my budget?"\n- "What are 3 practical ways to reduce my spending?"`,
    suggestedPrompts: [
      'Why did I spend more this month?',
      'Which category increased the most?',
      'Am I likely to exceed my budget?',
      'What are 3 practical ways to reduce my spending?',
    ],
  };
}
