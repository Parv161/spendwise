'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  User,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatMonthName } from '@/lib/format';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const {
    selectedMonth,
    setSelectedMonth,
    notifications,
    profile,
    resetToDemo,
  } = useSpendwise();

  const [showNotifications, setShowNotifications] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Derive title from pathname
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Overview';
      case '/transactions':
        return 'Transactions & Records';
      case '/budgets':
        return 'Budget Planner';
      case '/split':
        return 'Shared Expense Splitting';
      case '/savings':
        return 'Savings Goals & Challenges';
      case '/cash-flow':
        return 'Cash Flow Calendar';
      case '/insights':
        return 'Insights & AI Assistant';
      case '/health':
        return 'Financial Health Overview';
      case '/settings':
        return 'Account & Preferences';
      default:
        return 'SpendWise';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleReset = () => {
    if (window.confirm('Reset all demo data to default realistic Indian financial records?')) {
      resetToDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  // Generate available months for selector (last 5 months + current + next month)
  const monthOptions = React.useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = -4; i <= 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push(val);
    }
    return list;
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#090d16]/80 px-4 md:px-8 backdrop-blur-md">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-semibold text-white tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400">
            Smart personal finance & group splitting
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Month Selector */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300">
          <Calendar className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-slate-200">
                {formatMonthName(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={handleReset}
          title="Reset demo data to default Indian records"
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-all active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          <span>{resetSuccess ? 'Reset Done!' : 'Reset Demo'}</span>
        </button>

        {/* Notification Bell with Popup */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-300 hover:border-slate-700 hover:text-white transition-all"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 ring-2 ring-[#090d16]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <span className="text-xs text-slate-400">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 text-xs transition-colors hover:border-slate-700"
                      >
                        {n.type === 'budget_warning' || n.type === 'budget_exceeded' ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                        ) : n.type === 'savings_milestone' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Info className="h-4 w-4 shrink-0 text-sky-400" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-slate-200">{n.title}</p>
                          <p className="mt-0.5 text-slate-400">{n.message}</p>
                          {n.link_url && (
                            <Link
                              href={n.link_url}
                              onClick={() => setShowNotifications(false)}
                              className="mt-1.5 inline-flex items-center gap-1 font-semibold text-emerald-400 hover:underline"
                            >
                              <span>Take action</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Chip */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 pr-3 text-xs font-medium text-slate-300 hover:border-slate-700 transition-all"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
            {profile.display_name ? profile.display_name[0] : 'U'}
          </div>
          <span className="hidden sm:inline font-medium text-slate-200">
            {profile.display_name || 'Account'}
          </span>
        </Link>
      </div>
    </header>
  );
}
