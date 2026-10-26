'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSpendwise } from '@/hooks/use-spendwise';
import { SavingsGoal, GoalPriority } from '@/types';
import { rupeesToPaise, paiseToRupees } from '@/lib/format';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: SavingsGoal | null;
}

export function AddGoalModal({
  isOpen,
  onClose,
  editingGoal,
}: AddGoalModalProps) {
  const { saveGoal } = useSpendwise();

  const [name, setName] = useState(editingGoal?.name || '');
  const [targetRupees, setTargetRupees] = useState(
    editingGoal ? paiseToRupees(editingGoal.target_amount_paise).toString() : ''
  );
  const [currentRupees, setCurrentRupees] = useState(
    editingGoal ? paiseToRupees(editingGoal.current_amount_paise).toString() : '0'
  );
  const [targetDate, setTargetDate] = useState(
    editingGoal?.target_date ||
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState<GoalPriority>(editingGoal?.priority || 'medium');
  const [category, setCategory] = useState(editingGoal?.category || 'General');
  const [description, setDescription] = useState(editingGoal?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetParsed = parseFloat(targetRupees);
    const currentParsed = parseFloat(currentRupees) || 0;

    if (isNaN(targetParsed) || targetParsed <= 0) {
      setError('Please specify a valid target amount.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a goal name.');
      return;
    }

    const goal: SavingsGoal = {
      id: editingGoal ? editingGoal.id : `goal_${Date.now()}`,
      user_id: 'usr_demo_001',
      name: name.trim(),
      target_amount_paise: rupeesToPaise(targetParsed),
      current_amount_paise: rupeesToPaise(currentParsed),
      target_date: targetDate,
      priority,
      category,
      description: description.trim() || null,
      is_completed: currentParsed >= targetParsed,
      updated_at: new Date().toISOString(),
    };

    saveGoal(goal);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
      description="Track milestone savings for an emergency fund, device, travel, or education."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Goal Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. MacBook Pro, Emergency Reserve, Bike Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Amount (₹) *
            </label>
            <input
              type="number"
              step="100"
              required
              placeholder="e.g. 100000"
              value={targetRupees}
              onChange={(e) => setTargetRupees(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Already Saved (₹)
            </label>
            <input
              type="number"
              step="100"
              value={currentRupees}
              onChange={(e) => setCurrentRupees(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Completion Date *
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as GoalPriority)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="high">High (Essential)</option>
              <option value="medium">Medium (Target)</option>
              <option value="low">Low (Discretionary)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Category / Purpose
          </label>
          <input
            type="text"
            placeholder="e.g. Tech Upgrade, Travel, Safety Net"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Description / Motivation
          </label>
          <textarea
            rows={2}
            placeholder="Why are you saving for this?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
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
            {editingGoal ? 'Save Changes' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
