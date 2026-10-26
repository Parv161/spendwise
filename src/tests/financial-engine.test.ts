import { describe, it, expect } from 'vitest';
import {
  rupeesToPaise,
  paiseToRupees,
  formatCurrency,
} from '@/lib/format';
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateWeightedSplit,
  calculateGroupBalances,
  optimizeSettlements,
} from '@/lib/settlement';
import {
  calculateMonthEndForecast,
  simulateWhatIfScenario,
} from '@/lib/forecast';
import { GroupMember, GroupExpense, Settlement, Transaction, Budget, Account } from '@/types';

describe('1. Currency & Paise Minor Unit Arithmetic', () => {
  it('converts rupees to paise without floating-point precision glitches', () => {
    expect(rupeesToPaise(19.99)).toBe(1999);
    expect(rupeesToPaise(0.01)).toBe(1);
    expect(rupeesToPaise(1500)).toBe(150000);
    expect(rupeesToPaise('₹2,450.50')).toBe(245050);
  });

  it('converts paise to rupees accurately', () => {
    expect(paiseToRupees(1999)).toBe(19.99);
    expect(paiseToRupees(150000)).toBe(1500);
  });

  it('formats INR using Indian numbering system (Lakhs and Crores)', () => {
    const formatted = formatCurrency(15000000, 'INR', false); // ₹1,50,000
    expect(formatted).toContain('1,50,000');
  });
});

describe('2. Group Expense Splitting & Paise Precision', () => {
  it('calculates equal splits with remainder paise distribution (Zero Leakage)', () => {
    // ₹100.00 (10000 paise) split among 3 people: 3334, 3333, 3333
    const members = ['user_1', 'user_2', 'user_3'];
    const shares = calculateEqualSplit(10000, members);

    expect(shares).toHaveLength(3);
    const sum = shares.reduce((acc, s) => acc + s.sharePaise, 0);
    expect(sum).toBe(10000);
    expect(shares[0].sharePaise).toBe(3334);
    expect(shares[1].sharePaise).toBe(3333);
    expect(shares[2].sharePaise).toBe(3333);
  });

  it('calculates percentage splits with exact total verification', () => {
    // 50%, 30%, 20% of ₹500.00 (50000 paise)
    const splits = [
      { memberId: 'm1', percentage: 50 },
      { memberId: 'm2', percentage: 30 },
      { memberId: 'm3', percentage: 20 },
    ];
    const shares = calculatePercentageSplit(50000, splits);

    expect(shares).toHaveLength(3);
    expect(shares[0].sharePaise).toBe(25000);
    expect(shares[1].sharePaise).toBe(15000);
    expect(shares[2].sharePaise).toBe(10000);
    expect(shares.reduce((a, s) => a + s.sharePaise, 0)).toBe(50000);
  });

  it('throws error when percentage splits do not sum to 100%', () => {
    const invalidSplits = [
      { memberId: 'm1', percentage: 40 },
      { memberId: 'm2', percentage: 40 },
    ];
    expect(() => calculatePercentageSplit(10000, invalidSplits)).toThrow();
  });

  it('calculates weighted custom shares correctly', () => {
    // Member 1 has 2 parts, Member 2 has 1 part of ₹300.00
    const shares = calculateWeightedSplit(30000, [
      { memberId: 'm1', units: 2 },
      { memberId: 'm2', units: 1 },
    ]);
    expect(shares[0].sharePaise).toBe(20000);
    expect(shares[1].sharePaise).toBe(10000);
  });
});

describe('3. Group Balances & Deterministic Greedy Settlement Optimizer', () => {
  const members: GroupMember[] = [
    { id: 'm1', group_id: 'g1', display_name: 'Parv', role: 'admin' },
    { id: 'm2', group_id: 'g1', display_name: 'Rahul', role: 'member' },
    { id: 'm3', group_id: 'g1', display_name: 'Aditi', role: 'member' },
    { id: 'm4', group_id: 'g1', display_name: 'Vikram', role: 'member' },
  ];

  it('calculates member net balances across multiple payers and bills', () => {
    // Bill 1: Parv pays ₹24,000 for villa (equal split among all 4 = ₹6,000 each)
    const exp1: GroupExpense = {
      id: 'e1',
      group_id: 'g1',
      payer_member_id: 'm1',
      title: 'Villa',
      total_amount_paise: 2400000,
      split_type: 'equal',
      date: '2026-10-01',
      shares: [
        { id: 's1', expense_id: 'e1', member_id: 'm1', allocated_share_paise: 600000 },
        { id: 's2', expense_id: 'e1', member_id: 'm2', allocated_share_paise: 600000 },
        { id: 's3', expense_id: 'e1', member_id: 'm3', allocated_share_paise: 600000 },
        { id: 's4', expense_id: 'e1', member_id: 'm4', allocated_share_paise: 600000 },
      ],
    };

    // Bill 2: Rahul pays ₹12,000 for car (equal split among all 4 = ₹3,000 each)
    const exp2: GroupExpense = {
      id: 'e2',
      group_id: 'g1',
      payer_member_id: 'm2',
      title: 'Car Rental',
      total_amount_paise: 1200000,
      split_type: 'equal',
      date: '2026-10-02',
      shares: [
        { id: 's5', expense_id: 'e2', member_id: 'm1', allocated_share_paise: 300000 },
        { id: 's6', expense_id: 'e2', member_id: 'm2', allocated_share_paise: 300000 },
        { id: 's7', expense_id: 'e2', member_id: 'm3', allocated_share_paise: 300000 },
        { id: 's8', expense_id: 'e2', member_id: 'm4', allocated_share_paise: 300000 },
      ],
    };

    const balances = calculateGroupBalances(members, [exp1, exp2], []);

    // Net check:
    // Total spent = 36,000. Each owes 9,000.
    // Parv paid 24,000 -> owes 9,000 -> net +15,000 (creditor)
    // Rahul paid 12,000 -> owes 9,000 -> net +3,000 (creditor)
    // Aditi paid 0 -> owes 9,000 -> net -9,000 (debtor)
    // Vikram paid 0 -> owes 9,000 -> net -9,000 (debtor)
    expect(balances['m1'].netBalancePaise).toBe(1500000);
    expect(balances['m2'].netBalancePaise).toBe(300000);
    expect(balances['m3'].netBalancePaise).toBe(-900000);
    expect(balances['m4'].netBalancePaise).toBe(-900000);

    // Sum of all net balances must equal 0 (Conservation of Money)
    const netSum = Object.values(balances).reduce((sum, b) => sum + b.netBalancePaise, 0);
    expect(netSum).toBe(0);
  });

  it('optimizes settlements to minimal number of transactions (at most N-1)', () => {
    // Parv (+15,000), Rahul (+3,000), Aditi (-9,000), Vikram (-9,000)
    const balances = {
      m1: { memberId: 'm1', displayName: 'Parv', totalPaidPaise: 2400000, totalOwedPaise: 900000, settledPaidPaise: 0, settledReceivedPaise: 0, netBalancePaise: 1500000 },
      m2: { memberId: 'm2', displayName: 'Rahul', totalPaidPaise: 1200000, totalOwedPaise: 900000, settledPaidPaise: 0, settledReceivedPaise: 0, netBalancePaise: 300000 },
      m3: { memberId: 'm3', displayName: 'Aditi', totalPaidPaise: 0, totalOwedPaise: 900000, settledPaidPaise: 0, settledReceivedPaise: 0, netBalancePaise: -900000 },
      m4: { memberId: 'm4', displayName: 'Vikram', totalPaidPaise: 0, totalOwedPaise: 900000, settledPaidPaise: 0, settledReceivedPaise: 0, netBalancePaise: -900000 },
    };

    const settlements = optimizeSettlements(balances);

    // Should require at most 3 transactions (N-1)
    expect(settlements.length).toBeLessThanOrEqual(3);

    // Total settled volume must equal sum of positive credits (18,000)
    const totalSettled = settlements.reduce((sum, s) => sum + s.amountPaise, 0);
    expect(totalSettled).toBe(1800000);
  });

  it('updates net balances correctly when direct repayments are recorded', () => {
    // Rahul pays Parv ₹3,000 via UPI
    const exp: GroupExpense = {
      id: 'e1',
      group_id: 'g1',
      payer_member_id: 'm1',
      title: 'Dinner',
      total_amount_paise: 600000,
      split_type: 'equal',
      date: '2026-10-01',
      shares: [
        { id: 's1', expense_id: 'e1', member_id: 'm1', allocated_share_paise: 300000 },
        { id: 's2', expense_id: 'e1', member_id: 'm2', allocated_share_paise: 300000 },
      ],
    };

    const stl: Settlement = {
      id: 'stl_1',
      group_id: 'g1',
      from_member_id: 'm2',
      to_member_id: 'm1',
      amount_paise: 300000,
      settled_at: '2026-10-02',
    };

    const balances = calculateGroupBalances([members[0], members[1]], [exp], [stl]);
    expect(balances['m1'].netBalancePaise).toBe(0);
    expect(balances['m2'].netBalancePaise).toBe(0);
  });
});

describe('4. Forecasting & What-If Simulator Integrity', () => {
  it('forecasts month end and handles confidence ratings', () => {
    const dummyAccounts: Account[] = [
      { id: 'a1', user_id: 'u1', name: 'Savings', account_type: 'savings', balance_paise: 5000000, currency: 'INR', is_default: true },
    ];
    const dummyBudgets: Budget[] = [
      { id: 'b1', user_id: 'u1', category_id: null, amount_paise: 4000000, period: 'monthly', start_date: '2026-10-01', end_date: '2026-10-31', alert_threshold_pct: 80 },
    ];
    const dummyCategories = [{ id: 'cat1', name: 'Food' }];

    const forecast = calculateMonthEndForecast({
      transactions: [],
      recurring: [],
      budgets: dummyBudgets,
      categories: dummyCategories,
      accounts: dummyAccounts,
      targetYearMonth: '2026-10',
      todayOverride: new Date('2026-10-15'),
    });

    expect(forecast.hasSufficientData).toBe(false);
    expect(forecast.confidenceRating).toBe('Low');
    expect(forecast.currentAvailableBalancePaise).toBe(5000000);
  });

  it('what-if simulation calculates correct net impact without mutating baseline', () => {
    const baseline = {
      daysInMonth: 30,
      daysElapsed: 15,
      daysRemaining: 15,
      totalIncomeSoFarPaise: 6000000,
      totalExpenseSoFarPaise: 2000000,
      scheduledUpcomingIncomePaise: 0,
      scheduledUpcomingExpensePaise: 500000,
      projectedDiscretionaryExpensePaise: 2000000,
      projectedTotalExpensePaise: 4500000,
      projectedTotalIncomePaise: 6000000,
      projectedMonthEndNetPaise: 1500000,
      currentAvailableBalancePaise: 5000000,
      projectedMonthEndBalancePaise: 6500000,
      categoryForecasts: [],
      hasSufficientData: true,
      confidenceRating: 'High' as const,
    };

    // Simulate adding ₹10,000 income and a planned purchase of ₹20,000
    const sim = simulateWhatIfScenario(baseline, {
      incomeDeltaPaise: 1000000,
      discretionarySpendFactor: 1.0,
      plannedPurchasePaise: 2000000,
      extraSavingsContributionPaise: 0,
    });

    // Net impact: +10,000 income - 20,000 purchase = -10,000 (-1000000 paise)
    expect(sim.netImpactPaise).toBe(-1000000);
    expect(sim.simulatedMonthEndNetPaise).toBe(500000);
    // Baseline was not mutated
    expect(baseline.projectedMonthEndNetPaise).toBe(1500000);
  });
});
