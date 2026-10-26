'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart,
  Users,
  Target,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddBudgetModal } from '@/components/modals/AddBudgetModal';
import { AddGoalModal } from '@/components/modals/AddGoalModal';
import { ScanReceiptModal } from '@/components/modals/ScanReceiptModal';
import { useRouter } from 'next/navigation';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<
    'expense' | 'income' | 'budget' | 'goal' | 'scan' | null
  >(null);

  const actions = [
    {
      id: 'expense',
      label: 'Record Expense',
      desc: 'Add an outgoing payment or bill',
      icon: ArrowDownCircle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      action: () => setActiveModal('expense'),
    },
    {
      id: 'income',
      label: 'Record Income',
      desc: 'Add salary, freelance, or stipend',
      icon: ArrowUpCircle,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => setActiveModal('income'),
    },
    {
      id: 'scan',
      label: 'Scan Receipt',
      desc: 'OCR auto-extraction from photo',
      icon: Receipt,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      action: () => setActiveModal('scan'),
    },
    {
      id: 'split',
      label: 'Split Group Expense',
      desc: 'Add bill to shared trip or roommates',
      icon: Users,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      action: () => {
        onClose();
        router.push('/split');
      },
    },
    {
      id: 'budget',
      label: 'Set Budget Limit',
      desc: 'Create monthly category ceiling',
      icon: PieChart,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      action: () => setActiveModal('budget'),
    },
    {
      id: 'goal',
      label: 'New Savings Goal',
      desc: 'Track target milestone or fund',
      icon: Target,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      action: () => setActiveModal('goal'),
    },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen && !activeModal}
        onClose={onClose}
        title="Quick Financial Actions"
        description="Select an action to record finances or manage budgets."
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={act.action}
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-left hover:border-slate-700 hover:bg-slate-900 transition-all group"
              >
                <div
                  className={`rounded-lg p-2.5 border ${act.color} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {act.label}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Child modals triggered by quick action */}
      {activeModal === 'expense' && (
        <AddTransactionModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            onClose();
          }}
          initialType="expense"
        />
      )}
      {activeModal === 'income' && (
        <AddTransactionModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            onClose();
          }}
          initialType="income"
        />
      )}
      {activeModal === 'budget' && (
        <AddBudgetModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            onClose();
          }}
        />
      )}
      {activeModal === 'goal' && (
        <AddGoalModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            onClose();
          }}
        />
      )}
      {activeModal === 'scan' && (
        <ScanReceiptModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
