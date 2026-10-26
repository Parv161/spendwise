'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Wallet,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, paiseToRupees, rupeesToPaise } from '@/lib/format';
import { CurrencyCode, Account, AccountType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { spendwiseStore } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SettingsPage() {
  const { profile, updateProfile, accounts, resetToDemo } = useSpendwise();

  // Profile Form State
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency || 'INR');
  const [monthlyIncomeRupees, setMonthlyIncomeRupees] = useState(
    profile.monthly_income_paise
      ? paiseToRupees(profile.monthly_income_paise).toString()
      : '0'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Account Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('savings');
  const [accountBalanceRupees, setAccountBalanceRupees] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeParsed = parseFloat(monthlyIncomeRupees) || 0;

    updateProfile({
      display_name: displayName.trim(),
      currency,
      monthly_income_paise: rupeesToPaise(incomeParsed),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    const balanceParsed = parseFloat(accountBalanceRupees) || 0;
    const newAcc: Account = {
      id: `acc_${Date.now()}`,
      user_id: profile.id,
      name: accountName.trim(),
      account_type: accountType,
      balance_paise: rupeesToPaise(balanceParsed),
      currency,
      is_default: false,
    };

    spendwiseStore.saveAccount(newAcc);
    setShowAddAccountModal(false);
    setAccountName('');
    setAccountBalanceRupees('');
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset all demo records? This will restore realistic Indian seed data for transactions, budgets, groups, and savings.'
      )
    ) {
      resetToDemo();
      alert('Demo data has been restored to default state.');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <span>Account & System Preferences</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage user profile, connected accounts, and Supabase database connection.
        </p>
      </div>

      {/* SECTION 1: PROFILE & INCOME PREFERENCES */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-400" />
            <span>Profile & Income Baseline</span>
          </h3>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Saved Successfully</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="GBP">British Pound (£ GBP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Monthly Income Baseline (₹)
              </label>
              <input
                type="number"
                step="100"
                value={monthlyIncomeRupees}
                onChange={(e) => setMonthlyIncomeRupees(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Supports allowances, stipends, or ₹0 for student mode.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: CONNECTED FINANCIAL ACCOUNTS */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span>Accounts & Wallets ({accounts.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Liquid bank accounts, UPI apps, cash wallets, and mutual fund ledgers.
            </p>
          </div>

          <button
            onClick={() => setShowAddAccountModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>Add Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 text-xs flex justify-between items-center"
            >
              <div>
                <span className="font-semibold text-white block">{acc.name}</span>
                <span className="text-[11px] text-slate-400 capitalize">
                  {acc.account_type.replace('_', ' ')}
                  {acc.is_default && ' • Default'}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-200">
                {formatCurrency(acc.balance_paise)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SUPABASE & ARCHITECTURE CONFIGURATION */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Database & Cloud Architecture</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-engine architecture: Supabase PostgreSQL + Local Offline-First Storage.
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold font-mono ${
              isSupabaseConfigured
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Persistence Engine'}</span>
          </span>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-300 space-y-2">
          <p className="leading-relaxed">
            SpendWise supports live Supabase PostgreSQL authentication and Row Level Security (RLS). When environment credentials (<code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) are left unset, SpendWise seamlessly switches to its self-contained local storage engine.
          </p>
          <div className="pt-2 text-slate-400 text-[11px]">
            Schema file located at: <code className="text-emerald-400">database/schema.sql</code>
          </div>
        </div>
      </div>

      {/* SECTION 4: DEMO DATA MANAGEMENT */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-emerald-400" />
              <span>Demo & Testing Sandbox</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reset transactions, budgets, groups, and goals to the initial fictional Indian dataset.
            </p>
          </div>

          <button
            onClick={handleResetData}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
          >
            Reset All Demo Data
          </button>
        </div>
      </div>

      {/* MODAL: Add Account */}
      {showAddAccountModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddAccountModal(false)}
          title="Add Financial Account"
          description="Track an additional bank account, UPI app, or cash reserve."
        >
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Axis Bank, Paytm Wallet, Cash"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Type *
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="savings">Savings Bank</option>
                  <option value="current">Current Account</option>
                  <option value="upi">UPI / Mobile App</option>
                  <option value="cash">Cash In Hand</option>
                  <option value="investment">Mutual Funds / Demat</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Opening Balance (₹) *
                </label>
                <input
                  type="number"
                  step="100"
                  required
                  placeholder="0.00"
                  value={accountBalanceRupees}
                  onChange={(e) => setAccountBalanceRupees(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Add Account
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
