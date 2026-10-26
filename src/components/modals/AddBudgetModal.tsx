'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSpendwise } from '@/hooks/use-spendwise';
import { Budget } from '@/types';
import { rupeesToPaise, paiseToRupees } from '@/lib/format';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBudget?: Budget | null;
}

export function AddBudgetModal({
  isOpen,
  onClose,
  editingBudget,
}: AddBudgetModalProps) {
  const { categories, selectedMonth, saveBudget } = useSpendwise();

  const [categoryId, setCategoryId] = useState<string>(
    editingBudget?.category_id || 'overall'
  );
  const [amountRupees, setAmountRupees] = useState(
    editingBudget ? paiseToRupees(editingBudget.amount_paise).toString() : ''
  );
  const [alertThreshold, setAlertThreshold] = useState<number>(
    editingBudget?.alert_threshold_pct || 80
  );
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(amountRupees);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please specify a valid budget amount.');
      return;
    }

    const budget: Budget = {
      id: editingBudget ? editingBudget.id : `bgt_${Date.now()}`,
      user_id: 'usr_demo_001',
      category_id: categoryId === 'overall' ? null : categoryId,
      amount_paise: rupeesToPaise(parsed),
      period: 'monthly',
      start_date: `${selectedMonth}-01`,
      end_date: `${selectedMonth}-31`,
      alert_threshold_pct: alertThreshold,
    };

    saveBudget(budget);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBudget ? 'Edit Budget' : 'Create Budget'}
      description="Set a monthly spending ceiling for overall expenses or a specific category."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Budget Scope *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="overall">Overall Monthly Budget (Total Cap)</option>
            <optgroup label="Specific Categories">
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Monthly Limit (₹) *
          </label>
          <input
            type="number"
            step="100"
            required
            placeholder="e.g. 15000"
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Warning Alert Threshold ({alertThreshold}%)
          </label>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>50%</span>
            <span>75%</span>
            <span>85%</span>
            <span>100% (Strict)</span>
          </div>
        </div>

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
            {editingBudget ? 'Save Changes' : 'Create Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
