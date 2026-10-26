'use client';

import React from 'react';
import {
  HeartPulse,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatMonthName } from '@/lib/format';

export default function FinancialHealthPage() {
  const { financialHealth, selectedMonth, profile } = useSpendwise();

  const { score, rating, metrics, details, explanations } = financialHealth;

  const scoreColor =
    score >= 80
      ? 'text-emerald-400'
      : score >= 60
      ? 'text-teal-400'
      : score >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  const scoreBorder =
    score >= 80
      ? 'border-emerald-500/40'
      : score >= 60
      ? 'border-teal-500/40'
      : score >= 40
      ? 'border-amber-500/40'
      : 'border-rose-500/40';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-emerald-400" />
          <span>Financial Health Overview & Explainability</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          A transparent 0–100 weighted index evaluating savings discipline, budget adherence, and liquidity runway.
        </p>
      </div>

      {/* OVERALL SCORE HERO CARD */}
      <div className={`fintech-card p-6 border ${scoreBorder} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
              <Calendar className="h-3 w-3 text-emerald-400" />
              Evaluation Period: {formatMonthName(selectedMonth)}
            </span>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              SpendWise Health Index: <span className={scoreColor}>{score} / 100</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Overall rating: <strong className={scoreColor}>{rating}</strong>. Your financial health is computed from authoritative cash flow records, budget limits, emergency reserves, and recurring commitments.
            </p>
          </div>

          {/* Big Circular/Gauge Indicator */}
          <div className="flex items-center gap-4 self-center md:self-auto">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950/80">
              <div
                className={`text-3xl font-black font-mono tracking-tighter ${scoreColor}`}
              >
                {score}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400">
          <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Transparency Notice:</strong> This score is a deterministic, educational fintech heuristic designed to assist your daily budgeting and milestone planning. It is not an official credit bureau rating (CIBIL/Experian) or clinical assessment.
          </span>
        </div>
      </div>

      {/* 5 WEIGHTED PILLARS BREAKDOWN */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          5 Weighted Evaluation Pillars
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pillar 1: Savings Rate (25%) */}
          <div className="fintech-card p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Savings Rate (25% Weight)</span>
              <span className="font-mono font-bold text-emerald-400">
                {metrics.savingsRateScore} / 25 pts
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(metrics.savingsRateScore / 25) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Current rate: <strong className="text-white">{details.savingsRatePct}%</strong> of monthly income. Target benchmark is 20%+ for long-term compounding.
            </p>
          </div>

          {/* Pillar 2: Budget Adherence (25%) */}
          <div className="fintech-card p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Budget Adherence (25% Weight)</span>
              <span className="font-mono font-bold text-purple-400">
                {metrics.budgetAdherenceScore} / 25 pts
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-400"
                style={{ width: `${(metrics.budgetAdherenceScore / 25) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Budget utilization: <strong className="text-white">{details.budgetUtilizationPct}%</strong>. Staying within pre-defined monthly caps guarantees predictable cash flow.
            </p>
          </div>

          {/* Pillar 3: Emergency Fund Readiness (20%) */}
          <div className="fintech-card p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Emergency Buffer (20% Weight)</span>
              <span className="font-mono font-bold text-sky-400">
                {metrics.emergencyFundScore} / 20 pts
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-400"
                style={{ width: `${(metrics.emergencyFundScore / 20) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Buffer covers <strong className="text-white">~{details.emergencyMonthsCovered} months</strong> of baseline living costs. Recommended safety buffer is 3 to 6 months.
            </p>
          </div>

          {/* Pillar 4: Recurring Burden (15%) */}
          <div className="fintech-card p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Fixed Burden (15% Weight)</span>
              <span className="font-mono font-bold text-amber-400">
                {metrics.recurringBurdenScore} / 15 pts
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(metrics.recurringBurdenScore / 15) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Fixed obligations consume <strong className="text-white">{details.fixedObligationRatioPct}%</strong> of income. Lower ratios offer greater financial agility during shocks.
            </p>
          </div>

          {/* Pillar 5: Spending Stability (15%) */}
          <div className="fintech-card p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Spending Stability (15% Weight)</span>
              <span className="font-mono font-bold text-teal-400">
                {metrics.spendingStabilityScore} / 15 pts
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-400"
                style={{ width: `${(metrics.spendingStabilityScore / 15) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Month-over-month spending delta: <strong className="text-white">{details.monthOverMonthDeltaPct}%</strong>. Steady or reduced outflow indicates disciplined habit formation.
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED OBSERVATIONS & AUDIT LOG */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>Explainability & Diagnostic Audit</span>
        </h3>

        <div className="space-y-2">
          {explanations.map((exp, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{exp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
