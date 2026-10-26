'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  ListFilter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatDate, formatMonthName, paiseToRupees, rupeesToPaise } from '@/lib/format';
import { RecurringTransaction, RecurringFrequency } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { spendwiseStore } from '@/lib/storage';

export default function CashFlowPage() {
  const {
    recurring,
    monthTransactions,
    selectedMonth,
    totalAvailableBalancePaise,
    accounts,
    categories,
  } = useSpendwise();

  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('agenda');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Recurring Form
  const [desc, setDesc] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Combine historical transactions + recurring upcoming events into an agenda
  const agendaEvents = useMemo(() => {
    interface EventItem {
      id: string;
      date: string;
      dayNum: number;
      title: string;
      amountPaise: number;
      type: 'income' | 'expense';
      status: 'confirmed' | 'scheduled';
      source: string;
    }

    const list: EventItem[] = [];

    // 1. Confirmed Transactions
    for (const t of monthTransactions) {
      const dayNum = parseInt(t.date.slice(8, 10), 10);
      list.push({
        id: `tx_${t.id}`,
        date: t.date,
        dayNum,
        title: t.description,
        amountPaise: t.amount_paise,
        type: t.type === 'income' ? 'income' : 'expense',
        status: 'confirmed',
        source: t.merchant || 'Recorded Transaction',
      });
    }

    // 2. Scheduled Recurring
    for (const r of recurring) {
      if (!r.is_active) continue;
      const recDay = parseInt(r.next_run_date.slice(8, 10), 10) || 1;
      const eventDate = `${selectedMonth}-${String(recDay).padStart(2, '0')}`;

      // Check if an existing confirmed transaction already matched this recurring event to avoid duplicate display
      const isAlreadyPaid = monthTransactions.some(
        (t) =>
          t.type === r.type &&
          t.description.toLowerCase().includes(r.description.toLowerCase().slice(0, 8))
      );

      if (!isAlreadyPaid) {
        list.push({
          id: `rec_${r.id}`,
          date: eventDate,
          dayNum: recDay,
          title: `${r.description} (Scheduled)`,
          amountPaise: r.amount_paise,
          type: r.type,
          status: 'scheduled',
          source: `Recurring • ${r.frequency}`,
        });
      }
    }

    return list.sort((a, b) => a.dayNum - b.dayNum);
  }, [monthTransactions, recurring, selectedMonth]);

  // Projected Day-by-Day Running Balance
  const runningBalanceTimeline = useMemo(() => {
    let running = totalAvailableBalancePaise;
    const timeline: { day: number; projectedBalancePaise: number; eventsCount: number }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = agendaEvents.filter((e) => e.dayNum === d);
      for (const ev of dayEvents) {
        if (ev.status === 'scheduled') {
          if (ev.type === 'income') running += ev.amountPaise;
          else running -= ev.amountPaise;
        }
      }
      timeline.push({
        day: d,
        projectedBalancePaise: running,
        eventsCount: dayEvents.length,
      });
    }
    return timeline;
  }, [agendaEvents, daysInMonth, totalAvailableBalancePaise]);

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amountRupees);
    if (isNaN(parsed) || parsed <= 0 || !desc.trim()) return;

    const dayNumPadded = String(Math.min(28, Math.max(1, parseInt(dayOfMonth, 10)))).padStart(2, '0');
    const nextDate = `${selectedMonth}-${dayNumPadded}`;

    const newRec: RecurringTransaction = {
      id: `rec_${Date.now()}`,
      user_id: 'usr_demo_001',
      account_id: accountId || null,
      category_id: categoryId || null,
      amount_paise: rupeesToPaise(parsed),
      type,
      description: desc.trim(),
      frequency,
      start_date: nextDate,
      next_run_date: nextDate,
      is_active: true,
    };

    spendwiseStore.saveRecurring(newRec);
    setShowAddModal(false);
    setDesc('');
    setAmountRupees('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Cash Flow Calendar & Upcoming Obligations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Differentiate confirmed payments from upcoming scheduled bills, SIPs, and paychecks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                viewMode === 'agenda'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Agenda View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Calendar Grid</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Recurring Bill</span>
          </button>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fintech-card p-4">
          <span className="text-xs text-slate-400">Current Liquid In-Hand</span>
          <h4 className="text-xl font-bold text-white mt-1">
            {formatCurrency(totalAvailableBalancePaise)}
          </h4>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Realized cash & bank accounts
          </span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-xs text-slate-400">Total Events This Month</span>
          <h4 className="text-xl font-bold text-emerald-400 mt-1">
            {agendaEvents.length} items
          </h4>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {agendaEvents.filter((e) => e.status === 'confirmed').length} paid •{' '}
            {agendaEvents.filter((e) => e.status === 'scheduled').length} scheduled
          </span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-xs text-slate-400">Projected Month-End Runway</span>
          <h4 className="text-xl font-bold text-white mt-1">
            {formatCurrency(
              runningBalanceTimeline[runningBalanceTimeline.length - 1]?.projectedBalancePaise ||
                totalAvailableBalancePaise
            )}
          </h4>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            After all scheduled commitments
          </span>
        </div>
      </div>

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="fintech-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 border-b border-slate-800 pb-3">
            Financial Events Timeline ({formatMonthName(selectedMonth)})
          </h3>

          <div className="space-y-3">
            {agendaEvents.map((ev) => (
              <div
                key={ev.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 text-xs transition-colors ${
                  ev.status === 'confirmed'
                    ? 'border-slate-800 bg-slate-950/40'
                    : 'border-dashed border-emerald-500/40 bg-emerald-500/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-slate-900 border border-slate-800 font-mono">
                    <span className="text-[10px] text-slate-400 uppercase">Day</span>
                    <span className="text-sm font-bold text-white">{ev.dayNum}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{ev.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                          ev.status === 'confirmed'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {ev.status === 'confirmed' ? 'Executed' : 'Expected Scheduled'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {ev.source} • {formatDate(ev.date)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-bold font-mono ${
                      ev.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {ev.type === 'income' ? '+' : '-'}
                    {formatCurrency(ev.amountPaise)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CALENDAR GRID VIEW */}
      {viewMode === 'calendar' && (
        <div className="fintech-card p-5 overflow-hidden">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2 border-b border-slate-800 pb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayEvents = agendaEvents.filter((e) => e.dayNum === day);
              const hasIncome = dayEvents.some((e) => e.type === 'income');
              const hasExpense = dayEvents.some((e) => e.type === 'expense');

              return (
                <div
                  key={day}
                  className="min-h-24 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2 text-xs flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-300">{day}</span>
                    <div className="flex gap-1">
                      {hasIncome && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                      {hasExpense && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
                    </div>
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <p
                        key={ev.id}
                        className={`truncate text-[10px] rounded px-1 py-0.5 ${
                          ev.status === 'confirmed'
                            ? 'bg-slate-900 text-slate-300'
                            : 'bg-emerald-500/10 text-emerald-300'
                        }`}
                        title={`${ev.title} (${formatCurrency(ev.amountPaise)})`}
                      >
                        {ev.title.slice(0, 10)}.. ({formatCurrency(ev.amountPaise)})
                      </p>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-500 block">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Add Recurring Transaction */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Add Scheduled Recurring Bill or Income"
          description="Automate monthly obligations like Rent, Wi-Fi, SIPs, or salary."
        >
          <form onSubmit={handleAddRecurring} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`rounded-md py-1.5 text-xs font-semibold ${
                  type === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400'
                }`}
              >
                Bill / Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`rounded-md py-1.5 text-xs font-semibold ${
                  type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400'
                }`}
              >
                Income / Salary
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Airtel Fiber, Netflix, Apartment Rent"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Day of Month (1-28) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  required
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Save Recurring Schedule
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
