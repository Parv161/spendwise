'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSpendwise } from '@/hooks/use-spendwise';
import { GroupMember, GroupExpense, SplitType, ExpenseShare } from '@/types';
import { rupeesToPaise, paiseToRupees, formatCurrency } from '@/lib/format';
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateWeightedSplit,
} from '@/lib/settlement';
import { spendwiseStore } from '@/lib/storage';

interface AddGroupExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMember[];
}

export function AddGroupExpenseModal({
  isOpen,
  onClose,
  groupId,
  members,
}: AddGroupExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [totalRupees, setTotalRupees] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.id || '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    members.map((m) => m.id)
  );

  // Exact split state: memberId -> rupees string
  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  // Percentage split state: memberId -> pct string
  const [percentageShares, setPercentageShares] = useState<Record<string, string>>({});
  // Weighted shares state: memberId -> units string
  const [weightedShares, setWeightedShares] = useState<Record<string, string>>({});

  const [error, setError] = useState('');

  // Update defaults when members change
  useEffect(() => {
    if (members.length > 0 && !payerId) {
      setPayerId(members[0].id);
    }
    const initialExact: Record<string, string> = {};
    const initialPct: Record<string, string> = {};
    const initialUnits: Record<string, string> = {};
    const evenPct = (100 / members.length).toFixed(1);

    members.forEach((m) => {
      initialExact[m.id] = '0';
      initialPct[m.id] = evenPct;
      initialUnits[m.id] = '1';
    });
    setExactShares(initialExact);
    setPercentageShares(initialPct);
    setWeightedShares(initialUnits);
  }, [members]);

  const toggleMemberSelection = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length === 1) return; // at least 1 participant
      setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedTotal = parseFloat(totalRupees);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      setError('Please provide a valid total expense amount.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an expense title.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Select at least one participant.');
      return;
    }

    const totalPaise = rupeesToPaise(parsedTotal);
    let calculatedShares: { memberId: string; sharePaise: number }[] = [];

    try {
      if (splitType === 'equal') {
        calculatedShares = calculateEqualSplit(totalPaise, selectedMemberIds);
      } else if (splitType === 'percentage') {
        const splits = selectedMemberIds.map((mId) => ({
          memberId: mId,
          percentage: parseFloat(percentageShares[mId] || '0'),
        }));
        calculatedShares = calculatePercentageSplit(totalPaise, splits);
      } else if (splitType === 'shares') {
        const shares = selectedMemberIds.map((mId) => ({
          memberId: mId,
          units: parseInt(weightedShares[mId] || '1', 10),
        }));
        calculatedShares = calculateWeightedSplit(totalPaise, shares);
      } else if (splitType === 'exact') {
        let sum = 0;
        calculatedShares = selectedMemberIds.map((mId) => {
          const paise = rupeesToPaise(parseFloat(exactShares[mId] || '0'));
          sum += paise;
          return { memberId: mId, sharePaise: paise };
        });

        if (sum !== totalPaise) {
          setError(
            `Sum of exact shares (${formatCurrency(sum)}) does not equal total amount (${formatCurrency(totalPaise)}). Difference: ${formatCurrency(Math.abs(sum - totalPaise))}`
          );
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error validating expense shares.');
      return;
    }

    // Verify share sum strictly equals totalPaise
    const checkSum = calculatedShares.reduce((acc, s) => acc + s.sharePaise, 0);
    if (checkSum !== totalPaise) {
      setError('Split calculation rounding error. Sum of shares must equal total.');
      return;
    }

    const expenseId = `gexp_${Date.now()}`;
    const finalShares: ExpenseShare[] = calculatedShares.map((s, idx) => ({
      id: `esh_${expenseId}_${idx}`,
      expense_id: expenseId,
      member_id: s.memberId,
      allocated_share_paise: s.sharePaise,
    }));

    const groupExpense: GroupExpense = {
      id: expenseId,
      group_id: groupId,
      payer_member_id: payerId,
      title: title.trim(),
      total_amount_paise: totalPaise,
      split_type: splitType,
      date,
      notes: notes.trim() || null,
      shares: finalShares,
      created_at: new Date().toISOString(),
    };

    spendwiseStore.addGroupExpense(groupExpense);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Shared Expense"
      description="Split group bill among members fairly using equal, exact, percentage, or weighted shares."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Title & Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Expense Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Villa Booking, Dinner, Fuel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Total Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={totalRupees}
              onChange={(e) => setTotalRupees(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Paid By & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Paid By *
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name} {m.user_id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Split Method Toggle */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Split Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
            {(['equal', 'exact', 'percentage', 'shares'] as SplitType[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSplitType(st)}
                className={`rounded-md py-1.5 font-medium capitalize transition-all ${
                  splitType === st
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Participants & Detailed Shares */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
          <p className="text-xs font-semibold text-slate-200">
            Split Breakdown ({selectedMemberIds.length} Participants)
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {members.map((m) => {
              const isSelected = selectedMemberIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-lg border p-2 text-xs transition-colors ${
                    isSelected
                      ? 'border-slate-800 bg-slate-900/60'
                      : 'border-slate-800/40 opacity-50'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMemberSelection(m.id)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="font-medium text-slate-200">{m.display_name}</span>
                  </label>

                  {/* Input according to splitType */}
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      {splitType === 'equal' && (
                        <span className="text-slate-400 font-mono">
                          {totalRupees && !isNaN(parseFloat(totalRupees))
                            ? `~₹${(parseFloat(totalRupees) / selectedMemberIds.length).toFixed(2)}`
                            : 'Equal'}
                        </span>
                      )}

                      {splitType === 'exact' && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={exactShares[m.id] || ''}
                            onChange={(e) =>
                              setExactShares({ ...exactShares, [m.id]: e.target.value })
                            }
                            className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs text-white"
                          />
                        </div>
                      )}

                      {splitType === 'percentage' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={percentageShares[m.id] || ''}
                            onChange={(e) =>
                              setPercentageShares({
                                ...percentageShares,
                                [m.id]: e.target.value,
                              })
                            }
                            className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs text-white"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      )}

                      {splitType === 'shares' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={weightedShares[m.id] || '1'}
                            onChange={(e) =>
                              setWeightedShares({
                                ...weightedShares,
                                [m.id]: e.target.value,
                              })
                            }
                            className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs text-white"
                          />
                          <span className="text-slate-400">parts</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
          >
            Save Shared Expense
          </button>
        </div>
      </form>
    </Modal>
  );
}
