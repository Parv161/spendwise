'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Trash2,
  Edit2,
  Info,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatMonthName, paiseToRupees } from '@/lib/format';
import { Budget } from '@/types';
import { AddBudgetModal } from '@/components/modals/AddBudgetModal';

export default function BudgetsPage() {
  const {
    budgets,
    categories,
    monthTransactions,
    selectedMonth,
    deleteBudget,
    profile,
    updateProfile,
    totalIncomePaise,
  } = useSpendwise();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Needs/Wants/Savings custom percentages
  const [needsPct, setNeedsPct] = useState(profile.needs_pct || 50);
  const [wantsPct, setWantsPct] = useState(profile.wants_pct || 30);
  const [savingsPct, setSavingsPct] = useState(profile.savings_pct || 20);
  const [allocationSaved, setAllocationSaved] = useState(false);

  // Calculate actual spending per category in selected month
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of monthTransactions.filter((t) => t.type === 'expense')) {
      const cId = t.category_id || 'uncategorized';
      map[cId] = (map[cId] || 0) + t.amount_paise;
    }
    return map;
  }, [monthTransactions]);

  const totalExpensePaise = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount_paise, 0);
  }, [monthTransactions]);

  // Actual classification breakdown (Needs vs Wants vs Savings)
  const actualAllocation = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let savings = 0;

    for (const t of monthTransactions.filter((t) => t.type === 'expense')) {
      const cat = categories.find((c) => c.id === t.category_id);
      if (cat) {
        if (cat.classification === 'needs') needs += t.amount_paise;
        else if (cat.classification === 'wants') wants += t.amount_paise;
        else if (cat.classification === 'savings') savings += t.amount_paise;
      } else {
        wants += t.amount_paise;
      }
    }

    const total = needs + wants + savings || 1;
    return {
      needsPaise: needs,
      wantsPaise: wants,
      savingsPaise: savings,
      needsPct: Math.round((needs / total) * 100),
      wantsPct: Math.round((wants / total) * 100),
      savingsPct: Math.round((savings / total) * 100),
    };
  }, [monthTransactions, categories]);

  const handleSaveAllocation = () => {
    updateProfile({
      needs_pct: needsPct,
      wants_pct: wantsPct,
      savings_pct: savingsPct,
    });
    setAllocationSaved(true);
    setTimeout(() => setAllocationSaved(false), 2000);
  };

  const effectiveMonthlyIncome = Math.max(profile.monthly_income_paise, totalIncomePaise);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Budget Planner & Allocation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set and monitor monthly ceilings for categories in {formatMonthName(selectedMonth)}.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBudget(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Budget Limit</span>
        </button>
      </div>

      {/* ACTIVE BUDGET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const isOverall = b.category_id === null;
          const cat = categories.find((c) => c.id === b.category_id);
          const spentPaise = isOverall
            ? totalExpensePaise
            : categorySpending[b.category_id || ''] || 0;
          const remainingPaise = b.amount_paise - spentPaise;
          const utilizationPct = Math.round((spentPaise / b.amount_paise) * 100);
          const isExceeded = utilizationPct > 100;
          const isWarning = utilizationPct >= b.alert_threshold_pct && !isExceeded;

          return (
            <div
              key={b.id}
              className={`fintech-card p-5 relative overflow-hidden transition-all ${
                isExceeded
                  ? 'border-rose-500/40'
                  : isWarning
                  ? 'border-amber-500/40'
                  : 'hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1 ${
                      isOverall
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isOverall ? 'Overall Cap' : cat?.name || 'Category'}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {formatCurrency(b.amount_paise)}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingBudget(b);
                      setShowAddModal(true);
                    }}
                    className="rounded p-1 text-slate-400 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this budget?')) {
                        deleteBudget(b.id);
                      }
                    }}
                    className="rounded p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Spent: {formatCurrency(spentPaise)}</span>
                  <span
                    className={`font-semibold font-mono ${
                      isExceeded
                        ? 'text-rose-400'
                        : isWarning
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {utilizationPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, utilizationPct)}%` }}
                  />
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                <span className="text-slate-400">Remaining</span>
                <span
                  className={`font-semibold font-mono ${
                    remainingPaise >= 0 ? 'text-slate-200' : 'text-rose-400'
                  }`}
                >
                  {remainingPaise >= 0
                    ? formatCurrency(remainingPaise)
                    : `-${formatCurrency(Math.abs(remainingPaise))}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 50/30/20 SMART ALLOCATION PLANNER */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Smart Needs / Wants / Savings Allocation Planner</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize your monthly target distribution across living essentials, lifestyle, and wealth building.
            </p>
          </div>
          <button
            onClick={handleSaveAllocation}
            className="self-start sm:self-auto rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all"
          >
            {allocationSaved ? 'Saved Preferences!' : 'Update Plan'}
          </button>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Needs */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Needs (Essentials)</span>
              <span className="font-mono text-emerald-400 font-bold">{needsPct}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="70"
              value={needsPct}
              onChange={(e) => setNeedsPct(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Rent, groceries, utilities, transit & health. Target: {formatCurrency((effectiveMonthlyIncome * needsPct) / 100)}.
            </p>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
              <span>Actual this month:</span>
              <span className="font-medium text-white">{actualAllocation.needsPct}% ({formatCurrency(actualAllocation.needsPaise)})</span>
            </div>
          </div>

          {/* Wants */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Wants (Discretionary)</span>
              <span className="font-mono text-amber-400 font-bold">{wantsPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={wantsPct}
              onChange={(e) => setWantsPct(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dining, entertainment, shopping, vacations. Target: {formatCurrency((effectiveMonthlyIncome * wantsPct) / 100)}.
            </p>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
              <span>Actual this month:</span>
              <span className="font-medium text-white">{actualAllocation.wantsPct}% ({formatCurrency(actualAllocation.wantsPaise)})</span>
            </div>
          </div>

          {/* Savings */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Savings & SIP</span>
              <span className="font-mono text-teal-400 font-bold">{savingsPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={savingsPct}
              onChange={(e) => setSavingsPct(parseInt(e.target.value, 10))}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mutual funds, emergency fund, investments. Target: {formatCurrency((effectiveMonthlyIncome * savingsPct) / 100)}.
            </p>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
              <span>Actual this month:</span>
              <span className="font-medium text-white">{actualAllocation.savingsPct}% ({formatCurrency(actualAllocation.savingsPaise)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Budget Modal */}
      {showAddModal && (
        <AddBudgetModal
          isOpen={true}
          onClose={() => {
            setShowAddModal(false);
            setEditingBudget(null);
          }}
          editingBudget={editingBudget}
        />
      )}
    </div>
  );
}
