'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Receipt,
  CreditCard,
  Info,
  Calendar,
  Share2,
  Trash2,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  calculateGroupBalances,
  optimizeSettlements,
  MemberBalanceSummary,
  SuggestedSettlement,
} from '@/lib/settlement';
import { ExpenseGroup, GroupMember, Settlement } from '@/types';
import { AddGroupExpenseModal } from '@/components/modals/AddGroupExpenseModal';
import { Modal } from '@/components/ui/Modal';
import { spendwiseStore } from '@/lib/storage';

export default function SplitExpensesPage() {
  const { groups, settlements } = useSpendwise();

  // Selected Group
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups[0]?.id || ''
  );

  // Modals state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleDetails, setSettleDetails] = useState<SuggestedSettlement | null>(null);

  // New Group Form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupMembersText, setNewGroupMembersText] = useState('Rahul, Aditi, Vikram');

  // Currently selected group object
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0];
  }, [groups, selectedGroupId]);

  const groupMembers = activeGroup?.members || [];
  const groupExpenses = activeGroup?.expenses || [];
  const groupSettlements = useMemo(() => {
    return settlements.filter((s) => s.group_id === activeGroup?.id);
  }, [settlements, activeGroup]);

  // Compute Balances and Greedy Settlement Optimization
  const memberBalances = useMemo(() => {
    if (!activeGroup || groupMembers.length === 0) return {};
    return calculateGroupBalances(groupMembers, groupExpenses, groupSettlements);
  }, [activeGroup, groupMembers, groupExpenses, groupSettlements]);

  const suggestedSettlements = useMemo(() => {
    if (Object.keys(memberBalances).length === 0) return [];
    return optimizeSettlements(memberBalances);
  }, [memberBalances]);

  // Total Group Spending
  const totalGroupSpentPaise = useMemo(() => {
    return groupExpenses.reduce((sum, e) => sum + e.total_amount_paise, 0);
  }, [groupExpenses]);

  // Handle Create Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const gId = `grp_${Date.now()}`;
    const myMemberId = `mem_me_${Date.now()}`;

    const membersList: GroupMember[] = [
      {
        id: myMemberId,
        group_id: gId,
        user_id: 'usr_demo_001',
        display_name: 'You',
        role: 'admin',
      },
    ];

    const extraNames = newGroupMembersText.split(',').map((n) => n.trim()).filter(Boolean);
    extraNames.forEach((name, idx) => {
      membersList.push({
        id: `mem_${gId}_${idx}`,
        group_id: gId,
        user_id: null,
        display_name: name,
        role: 'member',
      });
    });

    const newGroup: ExpenseGroup = {
      id: gId,
      created_by: 'usr_demo_001',
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || null,
      currency: 'INR',
      group_type: 'trip',
      created_at: new Date().toISOString(),
    };

    spendwiseStore.saveGroup(newGroup, membersList);
    setSelectedGroupId(gId);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  // Handle Record Settlement Payment
  const handleRecordSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleDetails || !activeGroup) return;

    const newSettlement: Settlement = {
      id: `stl_${Date.now()}`,
      group_id: activeGroup.id,
      from_member_id: settleDetails.fromMemberId,
      to_member_id: settleDetails.toMemberId,
      amount_paise: settleDetails.amountPaise,
      payment_method: 'UPI / Direct Payment',
      reference_note: 'Settled via SpendWise greedy optimizer',
      settled_at: new Date().toISOString(),
    };

    spendwiseStore.addSettlement(newSettlement);
    setShowSettleModal(false);
    setSettleDetails(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Shared Expense Splitting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fair group expense splitting with deterministic debt simplification for trips, roommates & events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all active:scale-95"
          >
            <Users className="h-3.5 w-3.5" />
            <span>New Group</span>
          </button>
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Shared Expense</span>
          </button>
        </div>
      </div>

      {/* Group Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroupId(g.id)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
              activeGroup?.id === g.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'border border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{g.name}</span>
            <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
              {g.members?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* GROUP OVERVIEW & OPTIMIZED SETTLEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Net Balances & Suggested Repayments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Net Balances */}
          <div className="fintech-card p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Group Member Balances</h3>
                <p className="text-xs text-slate-400">
                  Total Group Outflow: {formatCurrency(totalGroupSpentPaise)} across {groupExpenses.length} bills
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupMembers.map((m) => {
                const b = memberBalances[m.id];
                const net = b ? b.netBalancePaise : 0;
                const isCreditor = net > 0;
                const isDebtor = net < 0;

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border p-3.5 text-xs transition-colors ${
                      isCreditor
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : isDebtor
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-slate-800 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        {m.display_name} {m.user_id ? '(You)' : ''}
                      </span>
                      <span
                        className={`font-semibold font-mono text-sm ${
                          isCreditor
                            ? 'text-emerald-400'
                            : isDebtor
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCreditor
                          ? `+${formatCurrency(net)}`
                          : isDebtor
                          ? `-${formatCurrency(Math.abs(net))}`
                          : 'Settled'}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 flex justify-between border-t border-slate-800/60 pt-2">
                      <span>Paid: {formatCurrency(b?.totalPaidPaise || 0)}</span>
                      <span>Share: {formatCurrency(b?.totalOwedPaise || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Optimal Repayments (Greedy Settlement Algorithm) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>Optimized Settlement Plan (Greedy Algorithm)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Debt simplification engine pairs maximum debtors with maximum creditors in O(N log N) time.
                </p>
              </div>
            </div>

            {suggestedSettlements.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <span>All balances in this group are completely settled!</span>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {suggestedSettlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-rose-300">{s.fromName}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-semibold text-emerald-300">{s.toName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-white">
                        {formatCurrency(s.amountPaise)}
                      </span>
                      <button
                        onClick={() => {
                          setSettleDetails(s);
                          setShowSettleModal(true);
                        }}
                        className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all"
                      >
                        Record Repayment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Expense History & Personal Integration Note */}
        <div className="space-y-6">
          {/* Group Expenses List */}
          <div className="fintech-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Group Expense History</h3>

            {groupExpenses.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No shared expenses recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {groupExpenses.map((e) => {
                  const payer = groupMembers.find((m) => m.id === e.payer_member_id);
                  return (
                    <div
                      key={e.id}
                      className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-slate-200">{e.title}</span>
                        <span className="font-bold font-mono text-white">
                          {formatCurrency(e.total_amount_paise)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Paid by {payer?.display_name || 'Someone'}</span>
                        <span className="capitalize text-emerald-400 font-medium">
                          {e.split_type} split
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {formatDate(e.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personal Accounting Integration Policy Note */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Info className="h-4 w-4 text-emerald-400" />
              <span>Personal Finance Integration Policy</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              To prevent double-counting, SpendWise treats the full paid bill as cash outflow on the payer&apos;s account, while only your allocated consumption share counts toward your personal expense metrics. Settlements reconcile your cash-flow balance automatically.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: Add Group Expense */}
      {showAddExpenseModal && activeGroup && (
        <AddGroupExpenseModal
          isOpen={true}
          onClose={() => setShowAddExpenseModal(false)}
          groupId={activeGroup.id}
          members={groupMembers}
        />
      )}

      {/* MODAL: Create New Group */}
      {showCreateGroupModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateGroupModal(false)}
          title="Create Shared Expense Group"
          description="Create a group for an upcoming trip, flatmates, or shared project."
        >
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Manali Vacation, Apartment 302, Office Lunch"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Flatmates utility splitting"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Other Members (Comma separated)
              </label>
              <input
                type="text"
                value={newGroupMembersText}
                onChange={(e) => setNewGroupMembersText(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                You will automatically be added as the group administrator.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Create Group
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Record Settlement */}
      {showSettleModal && settleDetails && (
        <Modal
          isOpen={true}
          onClose={() => setShowSettleModal(false)}
          title="Record Repayment Settlement"
          description="Confirm that repayment has been executed via UPI or bank transfer."
        >
          <form onSubmit={handleRecordSettlement} className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <span className="text-xs text-slate-400">Settlement Amount</span>
              <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(settleDetails.amountPaise)}
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                From <span className="font-bold text-white">{settleDetails.fromName}</span> to{' '}
                <span className="font-bold text-white">{settleDetails.toName}</span>
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Confirm Settlement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
