'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSpendwise } from '@/hooks/use-spendwise';
import { UploadCloud, CheckCircle2, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { validateReceiptFile, processReceiptImage, ParsedReceiptData } from '@/lib/ocr';
import { formatCurrency, paiseToRupees, rupeesToPaise } from '@/lib/format';
import { Transaction } from '@/types';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScanReceiptModal({ isOpen, onClose }: ScanReceiptModalProps) {
  const { categories, accounts, addTransaction } = useSpendwise();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedReceiptData | null>(null);
  const [error, setError] = useState('');

  // Editable fields for confirmation
  const [merchant, setMerchant] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validation = validateReceiptFile(selected);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file format.');
      return;
    }

    setFile(selected);
    setIsProcessing(true);

    try {
      const result = await processReceiptImage(selected);
      setParsedData(result);

      // Populate editable fields
      setMerchant(result.merchant || selected.name.replace(/\.[^/.]+$/, ''));
      setAmountRupees(result.amountPaise ? paiseToRupees(result.amountPaise).toString() : '500');
      setDate(result.date || new Date().toISOString().slice(0, 10));

      // Match suggested category
      const matchedCat = categories.find(
        (c) =>
          result.suggestedCategory &&
          c.name.toLowerCase().includes(result.suggestedCategory.toLowerCase())
      );
      setCategoryId(matchedCat ? matchedCat.id : categories[0]?.id || '');
      setNotes(`Scanned receipt: ${selected.name}`);
    } catch (err: any) {
      setError('Failed to extract receipt details. You can enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountRupees);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid amount.');
      return;
    }

    const tx: Transaction = {
      id: `tx_receipt_${Date.now()}`,
      user_id: 'usr_demo_001',
      account_id: accountId || null,
      category_id: categoryId || null,
      amount_paise: rupeesToPaise(parsedAmount),
      type: 'expense',
      description: merchant || 'Receipt Expense',
      date: date || new Date().toISOString().slice(0, 10),
      merchant: merchant || null,
      notes: notes || null,
      tags: ['receipt_scanned'],
      updated_at: new Date().toISOString(),
    };

    addTransaction(tx);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Receipt & Auto-Extract"
      description="Upload a receipt or invoice photo. Review and confirm extracted merchant, date, amount, and category."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Upload Zone */}
        {!parsedData && (
          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-8 text-center hover:border-emerald-500/50 hover:bg-slate-900/80 cursor-pointer transition-all">
            <UploadCloud className="h-10 w-10 text-emerald-400 mb-3" />
            <p className="text-sm font-medium text-slate-200">
              {isProcessing ? 'Analyzing Receipt OCR...' : 'Click to upload receipt photo'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports JPEG, PNG, WebP up to 5MB</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </label>
        )}

        {/* Extracted Details Confirmation Form */}
        {parsedData && (
          <form onSubmit={handleConfirm} className="space-y-3.5">
            {/* Confidence Banner */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Extracted with {Math.round(parsedData.confidence * 100)}% Confidence</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {file?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Merchant / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Total Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Receipt Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Paid From Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setParsedData(null);
                  setFile(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Scan another file
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Confirm & Create Transaction
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
