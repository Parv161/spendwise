'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Send,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { useSpendwise } from '@/hooks/use-spendwise';
import { formatCurrency, formatMonthName, paiseToRupees, rupeesToPaise } from '@/lib/format';
import { simulateWhatIfScenario } from '@/lib/forecast';
import { getRuleBasedResponse, AssistantMessage } from '@/lib/ai-assistant';

export default function InsightsPage() {
  const {
    monthEndForecast,
    transactions,
    budgets,
    categories,
    goals,
    recurring,
    selectedMonth,
    profile,
  } = useSpendwise();

  // What-If Simulator State
  const [incomeDeltaRupees, setIncomeDeltaRupees] = useState<number>(0);
  const [discretionaryFactor, setDiscretionaryFactor] = useState<number>(1.0);
  const [plannedPurchaseRupees, setPlannedPurchaseRupees] = useState<number>(0);
  const [extraSavingsRupees, setExtraSavingsRupees] = useState<number>(0);

  // Run What-If Simulation
  const simulation = simulateWhatIfScenario(monthEndForecast, {
    incomeDeltaPaise: rupeesToPaise(incomeDeltaRupees),
    discretionarySpendFactor: discretionaryFactor,
    plannedPurchasePaise: rupeesToPaise(plannedPurchaseRupees),
    extraSavingsContributionPaise: rupeesToPaise(extraSavingsRupees),
  });

  // AI Assistant Chat State
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello ${profile.display_name}! I am your SpendWise Financial Assistant. I analyze your real transactions, budgets, and savings goals to answer questions and help optimize your spending.\n\nAsk me anything or tap one of the suggested prompts below!`,
      source: 'rule_based',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        'Why did I spend more this month?',
        'Which category increased the most?',
        'Am I likely to exceed my budget?',
        'What are 3 practical ways to reduce my spending?',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: AssistantMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      source: 'rule_based',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // Context for deterministic AI assistant
    const context = {
      transactions,
      budgets,
      categories,
      goals,
      recurring,
      currentMonthStr: selectedMonth,
      monthlyIncomePaise: profile.monthly_income_paise,
    };

    setTimeout(() => {
      const response = getRuleBasedResponse(text, context);
      const aiMsg: AssistantMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.text,
        source: 'rule_based',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: response.suggestedPrompts,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <span>Financial Intelligence & What-If Simulator</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Interactive scenario forecasting and real-data-backed financial assistant.
        </p>
      </div>

      {/* SECTION 1: WHAT-IF SIMULATOR */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Interactive What-If Scenario Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Adjust parameters to forecast month-end impact without altering real financial records.
            </p>
          </div>
          <button
            onClick={() => {
              setIncomeDeltaRupees(0);
              setDiscretionaryFactor(1.0);
              setPlannedPurchaseRupees(0);
              setExtraSavingsRupees(0);
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Reset Simulator
          </button>
        </div>

        {/* Sliders and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Monthly Income Adjustment */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Income Delta</span>
              <span className="font-mono text-emerald-400 font-bold">
                {incomeDeltaRupees >= 0 ? `+₹${incomeDeltaRupees.toLocaleString('en-IN')}` : `-₹${Math.abs(incomeDeltaRupees).toLocaleString('en-IN')}`}
              </span>
            </div>
            <input
              type="range"
              min="-20000"
              max="50000"
              step="2000"
              value={incomeDeltaRupees}
              onChange={(e) => setIncomeDeltaRupees(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Simulate a salary raise, bonus, or client loss.
            </p>
          </div>

          {/* 2. Discretionary Spending Factor */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Lifestyle Spend</span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(discretionaryFactor * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={discretionaryFactor}
              onChange={(e) => setDiscretionaryFactor(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              {discretionaryFactor < 1
                ? `Cutting discretionary spend by ${Math.round((1 - discretionaryFactor) * 100)}%`
                : discretionaryFactor > 1
                ? `Increasing spending by ${Math.round((discretionaryFactor - 1) * 100)}%`
                : 'Baseline spending pace'}
            </p>
          </div>

          {/* 3. Planned One-Time Purchase */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Planned Purchase</span>
              <span className="font-mono text-rose-400 font-bold">
                ₹{plannedPurchaseRupees.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60000"
              step="2500"
              value={plannedPurchaseRupees}
              onChange={(e) => setPlannedPurchaseRupees(parseInt(e.target.value, 10))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              e.g. Phone upgrade, flight tickets, furniture.
            </p>
          </div>

          {/* 4. Extra Monthly Savings */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Extra Savings</span>
              <span className="font-mono text-teal-400 font-bold">
                +₹{extraSavingsRupees.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30000"
              step="1000"
              value={extraSavingsRupees}
              onChange={(e) => setExtraSavingsRupees(parseInt(e.target.value, 10))}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Additional top-up to mutual funds or emergency fund.
            </p>
          </div>
        </div>

        {/* Simulation Output Cards */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Simulation Projections
            </span>
            <span className="text-xs text-slate-400">
              Runway: <strong className="text-emerald-400">{simulation.projectedRunwayMonths} months</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-[11px] text-slate-400">Simulated Net Margin</span>
              <h4
                className={`text-lg font-bold font-mono mt-0.5 ${
                  simulation.simulatedMonthEndNetPaise >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(simulation.simulatedMonthEndNetPaise)}
              </h4>
              <span className="text-[10px] text-slate-500 block">
                Baseline: {formatCurrency(simulation.baselineMonthEndNetPaise)}
              </span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-[11px] text-slate-400">Net Scenario Impact</span>
              <h4
                className={`text-lg font-bold font-mono mt-0.5 ${
                  simulation.netImpactPaise >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {simulation.netImpactPaise >= 0 ? '+' : ''}
                {formatCurrency(simulation.netImpactPaise)}
              </h4>
              <span className="text-[10px] text-slate-500 block">
                Net difference vs baseline
              </span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-[11px] text-slate-400">Simulated Month-End Cash</span>
              <h4 className="text-lg font-bold font-mono text-white mt-0.5">
                {formatCurrency(simulation.simulatedMonthEndBalancePaise)}
              </h4>
              <span className="text-[10px] text-slate-500 block">
                Available liquid balance
              </span>
            </div>
          </div>

          {simulation.advice.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              {simulation.advice.map((adv, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: AI PERSONAL FINANCE ASSISTANT */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                SpendWise AI Financial Assistant
              </h3>
              <p className="text-xs text-slate-400">
                Authorized user-scoped financial Q&A with transparent mathematical reasoning.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
            Deterministic Engine
          </span>
        </div>

        {/* Chat Messages Container */}
        <div className="h-96 overflow-y-auto space-y-4 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl p-3.5 space-y-2 ${
                    isUser
                      ? 'bg-emerald-500 text-slate-950 font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

                  {/* Render Suggested Prompts */}
                  {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Suggested questions:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.suggestedPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSendMessage(prompt)}
                            className="rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-[9px] block text-right font-mono ${
                      isUser ? 'text-slate-900/70' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="h-7 w-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 text-xs items-center text-slate-400">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <span className="animate-pulse">Analyzing user transactions & calculating insights...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about your spending, budget limits, or savings pace..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-40 flex items-center gap-1.5 active:scale-95"
          >
            <span>Ask</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
