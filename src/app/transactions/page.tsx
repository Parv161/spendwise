'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Receipt,
  FileSpreadsheet,
  Tag,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatDate, paiseToRupees, rupeesToPaise } from '@/lib/format';
import { Transaction, TransactionType } from '@/types';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { ScanReceiptModal } from '@/components/modals/ScanReceiptModal';
import { Modal } from '@/components/ui/Modal';

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    accounts,
    deleteTransaction,
    addTransaction,
    selectedMonth,
  } = useSpendwise();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: number; skipped: number } | null>(null);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      const matchSearch =
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.merchant && t.merchant.toLowerCase().includes(search.toLowerCase()));

      // Type
      const matchType = typeFilter === 'all' || t.type === typeFilter;

      // Category
      const matchCategory = categoryFilter === 'all' || t.category_id === categoryFilter;

      // Account
      const matchAccount = accountFilter === 'all' || t.account_id === accountFilter;

      return matchSearch && matchType && matchCategory && matchAccount;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount_paise - a.amount_paise;
      if (sortBy === 'amount-asc') return a.amount_paise - b.amount_paise;
      return 0;
    });
  }, [transactions, search, typeFilter, categoryFilter, accountFilter, sortBy]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Description', 'Merchant', 'Category', 'Amount (INR)', 'Account', 'Notes'];
    const rows = filteredTransactions.map((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const acc = accounts.find((a) => a.id === t.account_id);
      return [
        t.id,
        t.date,
        t.type,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${(t.merchant || '').replace(/"/g, '""')}"`,
        `"${cat ? cat.name : ''}"`,
        (t.amount_paise / 100).toFixed(2),
        `"${acc ? acc.name : ''}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendwise_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import with Duplicate Prevention
  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    let importedCount = 0;
    let skippedCount = 0;

    // Check existing signatures: date + amount + description
    const existingSignatures = new Set(
      transactions.map((t) => `${t.date}_${t.amount_paise}_${t.description.toLowerCase().trim()}`)
    );

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length < 4) continue;

      // Format expected: Date, Type, Description, Amount
      const date = parts[0] || new Date().toISOString().slice(0, 10);
      const type = parts[1].toLowerCase() === 'income' ? 'income' : 'expense';
      const desc = parts[2] || 'Imported Transaction';
      const amount = parseFloat(parts[3]) || 0;
      const amountPaise = rupeesToPaise(amount);

      const signature = `${date}_${amountPaise}_${desc.toLowerCase()}`;
      if (existingSignatures.has(signature)) {
        skippedCount++;
        continue;
      }

      const newTx: Transaction = {
        id: `tx_imported_${Date.now()}_${i}`,
        user_id: 'usr_demo_001',
        account_id: accounts[0]?.id || null,
        category_id: categories[0]?.id || null,
        amount_paise: amountPaise,
        type,
        description: desc,
        date,
        notes: 'Imported via CSV',
      };

      addTransaction(newTx);
      existingSignatures.add(signature);
      importedCount++;
    }

    setImportStatus({ success: importedCount, skipped: skippedCount });
    setTimeout(() => {
      setImportStatus(null);
      setShowImportModal(false);
      setCsvText('');
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Transactions & Records
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View, search, filter, export, and import complete personal income and expense records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all active:scale-95"
          >
            <Receipt className="h-3.5 w-3.5 text-emerald-400" />
            <span>Scan Receipt</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all active:scale-95"
          >
            <Upload className="h-3.5 w-3.5 text-sky-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingTx(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="fintech-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search description, merchant..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Types (Income & Expense)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (Highest First)</option>
              <option value="amount-asc">Amount (Lowest First)</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>
            Showing {filteredTransactions.length} transaction
            {filteredTransactions.length === 1 ? '' : 's'}
          </span>
          {(search || typeFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setCategoryFilter('all');
                setAccountFilter('all');
              }}
              className="text-emerald-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="fintech-card overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No transactions match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedTransactions.map((t) => {
                  const cat = categories.find((c) => c.id === t.category_id);
                  const acc = accounts.find((a) => a.id === t.account_id);

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-200">
                        <div>
                          <span>{t.description}</span>
                          {t.merchant && (
                            <span className="block text-[11px] text-slate-400 font-normal">
                              {t.merchant}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {cat ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              color: cat.color,
                              borderColor: `${cat.color}30`,
                              borderWidth: '1px',
                            }}
                          >
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                        {acc ? acc.name : '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
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
                        className={`px-4 py-3.5 text-right font-semibold font-mono whitespace-nowrap ${
                          t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount_paise)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingTx(t);
                              setShowAddModal(true);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this transaction?')) {
                                deleteTransaction(t.id);
                              }
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-800 px-2.5 py-1 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-800 px-2.5 py-1 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowImportModal(false)}
          title="Import Transactions via CSV"
          description="Paste raw CSV text or format: Date, Type, Description, Amount (INR)"
        >
          <form onSubmit={handleImportCSV} className="space-y-4">
            {importStatus && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Successfully imported {importStatus.success} records! ({importStatus.skipped} duplicate records skipped).
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                CSV Data (Headers: Date, Type, Description, Amount)
              </label>
              <textarea
                rows={6}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`Date,Type,Description,Amount\n2026-10-24,expense,Swiggy Lunch,450.00\n2026-10-25,income,Freelance Consultation,5000.00`}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Duplicate transactions matching date, amount, and description are automatically prevented.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Validate & Import
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          isOpen={true}
          onClose={() => {
            setShowAddModal(false);
            setEditingTx(null);
          }}
          editingTransaction={editingTx}
        />
      )}

      {/* Scan Receipt Modal */}
      {showScanModal && (
        <ScanReceiptModal
          isOpen={true}
          onClose={() => setShowScanModal(false)}
        />
      )}
    </div>
  );
}
