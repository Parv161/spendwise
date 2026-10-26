'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieIcon,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  Receipt,
  Plus,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatDate, formatMonthName } from '@/lib/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { ScanReceiptModal } from '@/components/modals/ScanReceiptModal';

export default function DashboardPage() {
  const {
    isClient,
    selectedMonth,
    totalIncomePaise,
    totalExpensePaise,
    netCashFlowPaise,
    totalAvailableBalancePaise,
    budgetUtilizationPct,
    overallBudget,
    savingsSummary,
    categoryBreakdown,
    monthTransactions,
    contextualInsights,
    monthEndForecast,
    accounts,
  } = useSpendwise();

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [showScanModal, setShowScanModal] = useState(false);

  if (!isClient) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Monthly Comparison Chart Data
  const comparisonData = [
    {
      name: 'Monthly Totals',
      Income: totalIncomePaise / 100,
      Expenses: totalExpensePaise / 100,
      'Net Cash Flow': netCashFlowPaise / 100,
    },
  ];

  // Category Pie Data
  const pieData = categoryBreakdown.slice(0, 5).map((item) => ({
    name: item.name,
    value: item.amountPaise / 100,
    color: item.color,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Contextual Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-slate-950 p-6 backdrop-blur-md">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Active Period: {formatMonthName(selectedMonth)}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Financial Health & Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time tracking of cash flow, category budgets, savings milestones, and debt settlements.
          </p>
        </div>

        {/* Quick Action Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setModalType('expense');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-all active:scale-95"
          >
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => {
              setModalType('income');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all active:scale-95"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Add Income</span>
          </button>
          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 transition-all active:scale-95"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Scan Receipt</span>
          </button>
        </div>
      </div>

      {/* 6 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Total Income */}
        <div className="fintech-card fintech-card-hover p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Inflow</span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {formatCurrency(totalIncomePaise)}
            </h3>
            <p className="mt-0.5 text-[11px] text-emerald-400/90 font-medium">
              Inflow this month
            </p>
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="fintech-card fintech-card-hover p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Outflow</span>
            <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {formatCurrency(totalExpensePaise)}
            </h3>
            <p className="mt-0.5 text-[11px] text-rose-400/90 font-medium">
              Expenses recorded
            </p>
          </div>
        </div>

        {/* 3. Net Cash Flow */}
        <div className="fintech-card fintech-card-hover p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Net Cash Flow</span>
            <div
              className={`rounded-lg p-1.5 ${
                netCashFlowPaise >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3
              className={`text-xl font-bold tracking-tight ${
                netCashFlowPaise >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(netCashFlowPaise)}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {netCashFlowPaise >= 0 ? 'Monthly surplus' : 'Monthly deficit'}
            </p>
          </div>
        </div>

        {/* 4. Available Balance */}
        <div className="fintech-card fintech-card-hover p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Available Balance</span>
            <div className="rounded-lg bg-sky-500/10 p-1.5 text-sky-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {formatCurrency(totalAvailableBalancePaise)}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Across {accounts.length} liquid accounts
            </p>
          </div>
        </div>

        {/* 5. Budget Utilization */}
        <div className="fintech-card fintech-card-hover p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Budget Utilized</span>
            <div className="rounded-lg bg-purple-500/10 p-1.5 text-purple-400">
              <PieIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {budgetUtilizationPct}%
            </h3>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetUtilizationPct > 100
                    ? 'bg-rose-500'
                    : budgetUtilizationPct > 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {overallBudget
                ? `Limit: ${formatCurrency(overallBudget.amount_paise)}`
                : 'No overall cap set'}
            </p>
          </div>
        </div>

        {/* 6. Savings Progress */}
        <div className="fintech-card fintech-card-hover p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Savings Progress</span>
            <div className="rounded-lg bg-teal-500/10 p-1.5 text-teal-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {savingsSummary.progressPct}%
            </h3>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-400 transition-all"
                style={{ width: `${Math.min(100, savingsSummary.progressPct)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {formatCurrency(savingsSummary.totalSaved)} of{' '}
              {formatCurrency(savingsSummary.totalTarget)}
            </p>
          </div>
        </div>
      </div>

      {/* CONTEXTUAL INSIGHTS STRIP */}
      {contextualInsights.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Smart Financial Insights</span>
            </h3>
            <Link
              href="/insights"
              className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Ask AI Assistant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {contextualInsights.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-3.5 text-xs transition-all ${
                  item.type === 'alert'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : item.type === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : item.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="mt-1 text-slate-400 leading-relaxed">{item.message}</p>
                {item.actionUrl && (
                  <Link
                    href={item.actionUrl}
                    className="mt-2 inline-block font-semibold text-emerald-400 hover:underline"
                  >
                    {item.actionText || 'Inspect details'} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISUALIZATION SECTION: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Cash Flow Comparison */}
        <div className="fintech-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Cash Flow</h3>
              <p className="text-xs text-slate-400">Inflow vs Outflow vs Net Margin</p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {formatMonthName(selectedMonth)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Cash Flow" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown Donut */}
        <div className="fintech-card p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Spending by Category</h3>
              <p className="text-xs text-slate-400">Top 5 expense areas</p>
            </div>
          </div>

          {pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-slate-500">
              No expenses recorded for this month.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* FORECAST & RUNWAY PROJECTION PREVIEW */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>End-of-Month Forecast & Projections</span>
            </h3>
            <p className="text-xs text-slate-400">
              Based on {monthEndForecast.daysElapsed} days elapsed and scheduled recurring commitments.
            </p>
          </div>
          <Link
            href="/insights"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Open What-If Simulator</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
            <span className="text-xs text-slate-400">Projected Month-End Outflow</span>
            <h4 className="text-lg font-bold text-white mt-1">
              {formatCurrency(monthEndForecast.projectedTotalExpensePaise)}
            </h4>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Includes {formatCurrency(monthEndForecast.scheduledUpcomingExpensePaise)} scheduled
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
            <span className="text-xs text-slate-400">Projected Net Monthly Margin</span>
            <h4
              className={`text-lg font-bold mt-1 ${
                monthEndForecast.projectedMonthEndNetPaise >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {formatCurrency(monthEndForecast.projectedMonthEndNetPaise)}
            </h4>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {monthEndForecast.projectedMonthEndNetPaise >= 0
                ? 'Surplus expected'
                : 'Deficit risk'}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
            <span className="text-xs text-slate-400">Projected Month-End Balance</span>
            <h4 className="text-lg font-bold text-white mt-1">
              {formatCurrency(monthEndForecast.projectedMonthEndBalancePaise)}
            </h4>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Confidence: {monthEndForecast.confidenceRating}
            </span>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="fintech-card p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest financial movements in {formatMonthName(selectedMonth)}</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({monthTransactions.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {monthTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No transactions found for this month.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-2.5 font-semibold">Date</th>
                  <th className="pb-2.5 font-semibold">Description</th>
                  <th className="pb-2.5 font-semibold">Merchant / Payee</th>
                  <th className="pb-2.5 font-semibold">Type</th>
                  <th className="pb-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monthTransactions.slice(0, 7).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-3 font-medium text-slate-200">
                      {t.description}
                    </td>
                    <td className="py-3 text-slate-400">
                      {t.merchant || '—'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          t.type === 'income'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right font-semibold font-mono ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount_paise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <AddTransactionModal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          initialType={modalType}
        />
      )}
      {showScanModal && (
        <ScanReceiptModal
          isOpen={true}
          onClose={() => setShowScanModal(false)}
        />
      )}
    </div>
  );
}
