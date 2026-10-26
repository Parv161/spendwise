'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSpendwise } from '@/hooks/use-spendwise';
import { Transaction, TransactionType } from '@/types';
import { rupeesToPaise, paiseToRupees } from '@/lib/format';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction,
}: AddTransactionModalProps) {
  const { categories, accounts, addTransaction, updateTransaction } = useSpendwise();

  const [type, setType] = useState<TransactionType>(
    editingTransaction ? editingTransaction.type : initialType
  );
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [amountRupees, setAmountRupees] = useState(
    editingTransaction ? paiseToRupees(editingTransaction.amount_paise).toString() : ''
  );
  const [categoryId, setCategoryId] = useState(
    editingTransaction?.category_id || categories[0]?.id || ''
  );
  const [accountId, setAccountId] = useState(
    editingTransaction?.account_id || accounts[0]?.id || ''
  );
  const [date, setDate] = useState(
    editingTransaction?.date || new Date().toISOString().slice(0, 10)
  );
  const [merchant, setMerchant] = useState(editingTransaction?.merchant || '');
  const [notes, setNotes] = useState(editingTransaction?.notes || '');
  const [error, setError] = useState('');

  // Filter categories by selected type
  const availableCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amountRupees);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description.');
      return;
    }

    const txData: Transaction = {
      id: editingTransaction ? editingTransaction.id : `tx_${Date.now()}`,
      user_id: 'usr_demo_001',
      account_id: accountId || null,
      category_id: categoryId || null,
      amount_paise: rupeesToPaise(parsedAmount),
      type,
      description: description.trim(),
      date,
      merchant: merchant.trim() || null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingTransaction) {
      updateTransaction(txData);
    } else {
      addTransaction(txData);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
      description="Add an income or expense with category and payment method."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
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

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Description *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Swiggy Biryani Dinner, Salary, Metro Pass"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Category & Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account / Method
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.account_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Merchant & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Merchant / Payee (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy, Amazon, DMart"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shared with team"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
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
            {editingTransaction ? 'Save Changes' : 'Record Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
