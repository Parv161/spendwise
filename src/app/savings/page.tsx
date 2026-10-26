'use client';

import React, { useState } from 'react';
import {
  Target,
  Trophy,
  Plus,
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Trash2,
  Edit2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatDate, paiseToRupees, rupeesToPaise } from '@/lib/format';
import { SavingsGoal, SavingsContribution } from '@/types';
import { AddGoalModal } from '@/components/modals/AddGoalModal';
import { Modal } from '@/components/ui/Modal';
import { spendwiseStore } from '@/lib/storage';

export default function SavingsPage() {
  const { goals, deleteGoal, challenges, challengeProgress, addContribution } = useSpendwise();

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Contribution Modal
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<SavingsGoal | null>(null);
  const [contribType, setContribType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [contribRupees, setContribRupees] = useState('');
  const [contribNotes, setContribNotes] = useState('');

  const handleOpenContribute = (goal: SavingsGoal) => {
    setSelectedGoalForContribution(goal);
    setContribType('deposit');
    setContribRupees('');
    setContribNotes('');
    setShowContributeModal(true);
  };

  const handleRecordContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForContribution) return;

    const parsed = parseFloat(contribRupees);
    if (isNaN(parsed) || parsed <= 0) return;

    const contribution: SavingsContribution = {
      id: `sc_${Date.now()}`,
      goal_id: selectedGoalForContribution.id,
      user_id: 'usr_demo_001',
      amount_paise: rupeesToPaise(parsed),
      type: contribType,
      notes: contribNotes || undefined,
      date: new Date().toISOString().slice(0, 10),
    };

    addContribution(contribution);
    setShowContributeModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Savings Goals & Gamified Challenges
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turn aspirations into reachable targets with milestone tracking and habit-building sprints.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setShowAddGoalModal(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* SAVINGS GOALS GRID */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-400" />
          <span>Active Milestones ({goals.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current_amount_paise / g.target_amount_paise) * 100));
            const remainingPaise = Math.max(0, g.target_amount_paise - g.current_amount_paise);

            // Suggested monthly pace (months until target date)
            const today = new Date();
            const targetDate = new Date(g.target_date);
            const diffMonths = Math.max(
              1,
              (targetDate.getFullYear() - today.getFullYear()) * 12 +
                (targetDate.getMonth() - today.getMonth())
            );
            const suggestedMonthlyPacePaise = Math.round(remainingPaise / diffMonths);

            return (
              <div
                key={g.id}
                className="fintech-card fintech-card-hover p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1 ${
                          g.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : g.priority === 'medium'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {g.category || 'Goal'} • {g.priority} priority
                      </span>
                      <h4 className="text-base font-bold text-white">{g.name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(g);
                          setShowAddGoalModal(true);
                        }}
                        className="rounded p-1 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this savings goal?')) {
                            deleteGoal(g.id);
                          }
                        }}
                        className="rounded p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {g.description && (
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {g.description}
                    </p>
                  )}

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Saved</span>
                      <p className="text-lg font-bold text-white font-mono">
                        {formatCurrency(g.current_amount_paise)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Target</span>
                      <p className="text-sm font-semibold text-slate-300 font-mono">
                        {formatCurrency(g.target_amount_paise)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>{pct}% Completed</span>
                      <span>Target: {formatDate(g.target_date)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Pace Suggestion */}
                  {remainingPaise > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Suggested monthly rate:</span>
                      <span className="font-semibold text-emerald-400 font-mono">
                        {formatCurrency(suggestedMonthlyPacePaise)}/mo
                      </span>
                    </div>
                  )}
                </div>

                {/* Contribute Action */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenContribute(g)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Deposit / Withdraw Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GAMIFIED SAVINGS CHALLENGES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Gamified Financial Sprints & Badges</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Participate in structured, measurable challenges to cut discretionary leakage and accelerate wealth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges.map((c) => {
            const prog = challengeProgress.find((p) => p.challenge_id === c.id);
            const isCompleted = prog?.status === 'completed';
            const savedPaise = prog?.current_amount_paise || 0;
            const targetPaise = c.target_amount_paise;
            const pct = Math.min(100, Math.round((savedPaise / targetPaise) * 100));

            return (
              <div
                key={c.id}
                className={`rounded-xl border p-4 text-xs space-y-3 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-400/15 p-2 text-amber-400">
                      <Flame className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{c.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {c.duration_days} Days Sprint
                      </span>
                    </div>
                  </div>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Unlocked</span>
                    </span>
                  )}
                </div>

                <p className="text-slate-400 leading-relaxed text-[11px]">{c.description}</p>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span>{formatCurrency(savedPaise)} saved</span>
                    <span>Target: {formatCurrency(targetPaise)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Record Contribution */}
      {showContributeModal && selectedGoalForContribution && (
        <Modal
          isOpen={true}
          onClose={() => setShowContributeModal(false)}
          title={`Allocate to ${selectedGoalForContribution.name}`}
          description="Record a deposit or withdrawal from this savings goal allocation."
        >
          <form onSubmit={handleRecordContribution} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setContribType('deposit')}
                className={`rounded-md py-1.5 text-xs font-semibold ${
                  contribType === 'deposit'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400'
                }`}
              >
                Deposit / Add
              </button>
              <button
                type="button"
                onClick={() => setContribType('withdrawal')}
                className={`rounded-md py-1.5 text-xs font-semibold ${
                  contribType === 'withdrawal'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400'
                }`}
              >
                Withdraw Funds
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="100"
                required
                placeholder="e.g. 5000"
                value={contribRupees}
                onChange={(e) => setContribRupees(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Freelance bonus allocation"
                value={contribNotes}
                onChange={(e) => setContribNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowContributeModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Confirm Allocation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Add / Edit Goal */}
      {showAddGoalModal && (
        <AddGoalModal
          isOpen={true}
          onClose={() => {
            setShowAddGoalModal(false);
            setEditingGoal(null);
          }}
          editingGoal={editingGoal}
        />
      )}
    </div>
  );
}
