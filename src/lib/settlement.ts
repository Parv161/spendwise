import { GroupMember, GroupExpense, Settlement, SplitType } from '@/types';

export interface MemberBalanceSummary {
  memberId: string;
  displayName: string;
  totalPaidPaise: number;
  totalOwedPaise: number; // Share of group expenses allocated to this member
  settledPaidPaise: number; // Repayments made to others
  settledReceivedPaise: number; // Repayments received from others
  netBalancePaise: number; // Positive = should receive money; Negative = owes money
}

export interface SuggestedSettlement {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amountPaise: number;
}

/**
 * Calculates equal splits for a list of member IDs.
 * Handles remainder paise deterministically so the sum of all shares
 * equals the total amount exactly with zero leakage.
 */
export function calculateEqualSplit(
  totalAmountPaise: number,
  memberIds: string[]
): { memberId: string; sharePaise: number }[] {
  if (memberIds.length === 0) return [];
  if (totalAmountPaise <= 0) {
    return memberIds.map((id) => ({ memberId: id, sharePaise: 0 }));
  }

  const n = memberIds.length;
  const baseShare = Math.floor(totalAmountPaise / n);
  const remainder = totalAmountPaise % n;

  // Distribute 1 remainder paise to the first `remainder` members
  return memberIds.map((memberId, index) => ({
    memberId,
    sharePaise: baseShare + (index < remainder ? 1 : 0),
  }));
}

/**
 * Calculates percentage splits with paise rounding and remainder adjustment.
 */
export function calculatePercentageSplit(
  totalAmountPaise: number,
  splits: { memberId: string; percentage: number }[]
): { memberId: string; sharePaise: number }[] {
  if (splits.length === 0) return [];

  const totalPct = splits.reduce((acc, s) => acc + s.percentage, 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new Error(`Total percentage must sum to 100%, got ${totalPct.toFixed(2)}%`);
  }

  let allocatedSum = 0;
  const result = splits.map((s) => {
    const share = Math.round((totalAmountPaise * s.percentage) / 100);
    allocatedSum += share;
    return { memberId: s.memberId, sharePaise: share };
  });

  // Adjust any rounding delta against the largest percentage share
  const delta = totalAmountPaise - allocatedSum;
  if (delta !== 0 && result.length > 0) {
    // Find index of highest share
    let maxIdx = 0;
    for (let i = 1; i < result.length; i++) {
      if (result[i].sharePaise > result[maxIdx].sharePaise) {
        maxIdx = i;
      }
    }
    result[maxIdx].sharePaise += delta;
  }

  return result;
}

/**
 * Calculates weighted shares (e.g. Member A: 2 shares, Member B: 1 share).
 */
export function calculateWeightedSplit(
  totalAmountPaise: number,
  shares: { memberId: string; units: number }[]
): { memberId: string; sharePaise: number }[] {
  const totalUnits = shares.reduce((acc, s) => acc + s.units, 0);
  if (totalUnits <= 0) {
    throw new Error('Total share units must be greater than 0');
  }

  let allocatedSum = 0;
  const result = shares.map((s) => {
    const share = Math.floor((totalAmountPaise * s.units) / totalUnits);
    allocatedSum += share;
    return { memberId: s.memberId, sharePaise: share };
  });

  // Distribute remaining paise to members with positive units
  let remainder = totalAmountPaise - allocatedSum;
  let idx = 0;
  while (remainder > 0 && idx < result.length) {
    result[idx].sharePaise += 1;
    remainder--;
    idx++;
  }

  return result;
}

/**
 * Calculates net balance for every member in an expense group.
 *
 * Balance Formula for Member M:
 *   Net = (Direct Expenses Paid by M + Settlements Paid by M)
 *       - (Allocated Expense Shares of M + Settlements Received by M)
 *
 * A positive net balance indicates M is a net creditor (should receive money).
 * A negative net balance indicates M is a net debtor (owes money).
 */
export function calculateGroupBalances(
  members: GroupMember[],
  expenses: GroupExpense[],
  settlements: Settlement[]
): Record<string, MemberBalanceSummary> {
  const summaries: Record<string, MemberBalanceSummary> = {};

  for (const m of members) {
    summaries[m.id] = {
      memberId: m.id,
      displayName: m.display_name,
      totalPaidPaise: 0,
      totalOwedPaise: 0,
      settledPaidPaise: 0,
      settledReceivedPaise: 0,
      netBalancePaise: 0,
    };
  }

  // 1. Process Expenses
  for (const exp of expenses) {
    // Add amount paid to the payer
    if (summaries[exp.payer_member_id]) {
      summaries[exp.payer_member_id].totalPaidPaise += exp.total_amount_paise;
    }

    // Add allocated share to each participant
    if (exp.shares) {
      for (const share of exp.shares) {
        if (summaries[share.member_id]) {
          summaries[share.member_id].totalOwedPaise += share.allocated_share_paise;
        }
      }
    }
  }

  // 2. Process Settlements (Recorded direct repayments)
  for (const st of settlements) {
    if (summaries[st.from_member_id]) {
      summaries[st.from_member_id].settledPaidPaise += st.amount_paise;
    }
    if (summaries[st.to_member_id]) {
      summaries[st.to_member_id].settledReceivedPaise += st.amount_paise;
    }
  }

  // 3. Compute Final Net Balances
  for (const mId in summaries) {
    const s = summaries[mId];
    s.netBalancePaise =
      s.totalPaidPaise + s.settledPaidPaise - (s.totalOwedPaise + s.settledReceivedPaise);
  }

  return summaries;
}

/**
 * Deterministic Greedy Settlement Algorithm
 * ----------------------------------------
 * Simplifies group debts into a minimum number of transfers.
 *
 * How it works:
 * 1. Filter out participants whose net balance is 0.
 * 2. Separate members into two priority heaps/sorted lists:
 *    - Debtors: netBalance < 0 (sorted ascending by balance, most negative first)
 *    - Creditors: netBalance > 0 (sorted descending by balance, highest positive first)
 * 3. In each greedy step, pair the maximum debtor with the maximum creditor.
 * 4. Transfer min(|debt|, credit), which completely eliminates at least one participant's balance.
 * 5. Update remaining balances and repeat until all balances reach 0.
 *
 * Properties & Complexity:
 * - Time Complexity: O(N log N) where N is number of members (due to sorting at each pairing or heap operations).
 * - Space Complexity: O(N) auxiliary space.
 * - Guarantee: Guaranteed to settle all debts in at most (N - 1) transactions while preserving exact net balances.
 * - Limitations: While the greedy heuristic produces near-optimal transaction counts in O(N log N),
 *   the absolute minimum transaction problem is a variation of the NP-Complete Subset Sum problem.
 *   For group expense apps (N < 100), the greedy method is the industry standard (used by Splitwise)
 *   because it is fast, deterministic, and avoids quadratic complexity.
 */
export function optimizeSettlements(
  balances: Record<string, MemberBalanceSummary>
): SuggestedSettlement[] {
  interface Participant {
    id: string;
    name: string;
    balance: number;
  }

  const debtors: Participant[] = [];
  const creditors: Participant[] = [];

  for (const id in balances) {
    const b = balances[id];
    if (b.netBalancePaise < 0) {
      debtors.push({ id: b.memberId, name: b.displayName, balance: b.netBalancePaise });
    } else if (b.netBalancePaise > 0) {
      creditors.push({ id: b.memberId, name: b.displayName, balance: b.netBalancePaise });
    }
  }

  // Sort debtors most negative first
  debtors.sort((a, b) => a.balance - b.balance);
  // Sort creditors most positive first
  creditors.sort((a, b) => b.balance - a.balance);

  const transactions: SuggestedSettlement[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const debtOwed = Math.abs(debtor.balance);
    const creditDue = creditor.balance;

    const settlementAmount = Math.min(debtOwed, creditDue);

    if (settlementAmount > 0) {
      transactions.push({
        fromMemberId: debtor.id,
        fromName: debtor.name,
        toMemberId: creditor.id,
        toName: creditor.name,
        amountPaise: settlementAmount,
      });
    }

    debtor.balance += settlementAmount;
    creditor.balance -= settlementAmount;

    if (debtor.balance === 0) dIdx++;
    if (creditor.balance === 0) cIdx++;
  }

  return transactions;
}
