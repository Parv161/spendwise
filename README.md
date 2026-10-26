# SPENDWISE — Advanced Personal Finance & Expense Splitting Platform

> **Track money. Understand spending. Plan ahead. Split fairly. Save smarter.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing-green?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Currency](https://img.shields.io/badge/Currency-INR%20(₹)-emerald?style=flat-square)](#)

---

## 1. Product Overview

**SpendWise** is a personal finance management, shared expense splitting, and financial intelligence platform designed for college students, young professionals, flatmates, and travel groups. 

Unlike conventional expense trackers that merely record historical transactions, SpendWise bridges **personal cash-flow management** with **shared group split dynamics** and **transparent rule-based predictive intelligence**.

---

## 2. Core Modules & Key Features

### 1. Overview & Financial Dashboard
- **6 Authoritative KPI Cards**:
  - **Total Income**: Realized inflow for the selected period.
  - **Total Expenses**: Outflow recorded.
  - **Net Cash Flow**: Inflow minus outflow surplus or deficit.
  - **Available Liquid Balance**: Aggregated across all linked bank, UPI, and cash accounts.
  - **Budget Utilization**: Utilization percentage with dynamic color-coded ceiling bars.
  - **Savings Milestone Progress**: Aggregate completion across all active goals.
- **Interactive Visualizations**:
  - Recharts Cash Flow Bar Comparison (Income vs Expense vs Net Margin).
  - Category Spending Donut Chart with percentage tooltips.
  - End-of-month projected balance and run-rate gauge.
- **Contextual Insight Generator**:
  - Alerts for categories nearing (>80%) or exceeding limits.
  - Detection of dining/food spending surges vs previous month.
  - Upcoming scheduled bills within the next 7 days.
  - Celebration of unlocked savings milestones (50%, 100%).

### 2. Transaction Management & Auditing
- Full CRUD operations with instant reactive recalculation.
- Advanced multi-criteria filtering:
  - Search across descriptions and merchants.
  - Type filter (`income`, `expense`).
  - Category filter (12 standard Indian categories + custom categories).
  - Sorting by date (newest/oldest) or amount (highest/lowest).
- **CSV Data Portability**:
  - One-click CSV Export with standard format.
  - CSV Import with field mapping and **duplicate prevention** (using composite hash validation).

### 3. Budget Planner & 50/30/20 Allocation
- Overall monthly spending ceiling + category-specific budgets.
- Customizable alert thresholds (50%, 75%, 85%, 100%).
- **50/30/20 Needs/Wants/Savings Allocation Planner**:
  - Interactive sliders to customize target percentages.
  - Side-by-side comparison between planned distribution and actual current-month spending.

### 4. Shared Expense Splitting & Debt Simplification
- **Group Management**: Shared trips (e.g. *Goa Roadtrip 2026*), flatmates, or team outings.
- **4 Splitting Methods**:
  1. **Equal Split**: Remainder paise distributed deterministically (Zero Leakage).
  2. **Exact Split**: Custom rupee amounts per participant verified against total.
  3. **Percentage Split**: Custom percentages summing strictly to 100%.
  4. **Weighted Custom Shares**: Ratio parts (e.g. 2 shares : 1 share).
- **Deterministic Greedy Settlement Algorithm**:
  - Simplifies multi-party debts into the minimum number of direct transfers (at most $N-1$ transactions).
  - Preserves exact net balances without circular transfers.
  - Time complexity: $\mathcal{O}(N \log N)$ where $N$ is group member count.
- **Personal Expense Accounting Policy**:
  - Avoids double-counting: the payer's personal cash outflow records the bill paid, while each member's allocated share represents personal consumption attribution. Settlements reconcile balances cleanly.

### 5. Savings Goals & Gamified Challenges
- Milestones with target amount, target date, priority, and progress percentage.
- Suggested monthly contribution rate calculated from remaining duration.
- Deposit and withdrawal ledger.
- Gamified savings challenges (e.g. *14-Day Home Cook Sprint*, *₹10,000 Wealth Builder*, *Public Transit Streak*).

### 6. Cash Flow Calendar
- Timeline agenda view and interactive month calendar grid.
- **Strict Distinction**: Differentiates confirmed transactions from expected recurring commitments.
- Projected running balance day-by-day.

### 7. What-If Simulator & AI Financial Assistant
- **Interactive Simulator**:
  - Test real-time changes to monthly income ($\pm ₹50,000$).
  - Adjust lifestyle spending factor (0.5x to 1.5x).
  - Add planned one-time capital purchases.
  - Evaluates remaining liquid runway without modifying stored database records.
- **AI Assistant**:
  - Authorized, user-scoped conversational interface.
  - Answers questions regarding budget utilization, category surges, and affordability.
  - Transparent deterministic fallback mode with mathematical reasoning.

### 8. Financial Health Overview (0–100 Index)
- Transparent 5-pillar weighting:
  1. **Savings Rate** (25% weight)
  2. **Budget Adherence** (25% weight)
  3. **Emergency Fund Readiness** (20% weight)
  4. **Fixed Recurring Burden** (15% weight)
  5. **Spending Stability / MoM Trend** (15% weight)
- Diagnostic audit explanations and educational disclaimers.

### 9. Receipt Scanner & OCR Auto-Extraction
- Drag-and-drop receipt image upload (JPEG, PNG, WebP up to 5MB).
- Heuristic regex parser extracts:
  - Merchant / store name.
  - Date in Indian formats (`DD/MM/YYYY` or `YYYY-MM-DD`).
  - Total amount and GST/tax.
  - Smart category suggestion based on merchant keyword mapping.
- Editable confirmation screen before creating any transaction.

---

## 3. Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, no `any` shortcuts)
- **Styling**: [Tailwind CSS v3.4](https://tailwindcss.com/) with dark-first fintech palette
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/) (Responsive containers, bar charts, donut pie charts)
- **Database**: PostgreSQL / [Supabase](https://supabase.com/) schema with Row Level Security (RLS)
- **Testing**: [Vitest](https://vitest.dev/) unit test runner

---

## 4. Architecture & Financial Data Integrity

### Minor Unit Paise Representation
To prevent floating-point rounding errors common in financial software (e.g. `0.1 + 0.2 = 0.30000000000000004`), SpendWise stores and computes all monetary values as integer minor units:
$$\text{paise} = \text{round}(\text{rupees} \times 100)$$
All split algorithms, settlements, and aggregate budgets operate exclusively on integers.

### Greedy Settlement Algorithm Analysis
- **Problem**: In a group of $N$ participants with multiple shared bills, members owe money to each other. We want to find the minimal set of transactions that completely settles all debts while preserving every member's net balance.
- **Algorithm**:
  1. Calculate net balance for each member: $\text{Net}_i = (\text{Paid}_i + \text{SettledPaid}_i) - (\text{Owed}_i + \text{SettledReceived}_i)$.
  2. Filter members with $\text{Net} \neq 0$ into two lists: **Debtors** ($\text{Net} < 0$) and **Creditors** ($\text{Net} > 0$).
  3. Sort Debtors in ascending order (most negative first) and Creditors in descending order (highest positive first).
  4. In each step, pair the maximum debtor with the maximum creditor and transfer $\min(|\text{Debt}|, \text{Credit})$.
  5. Update remaining balances and advance pointers.
- **Guarantee**: Produces at most $N - 1$ transactions in $\mathcal{O}(N \log N)$ time complexity.

---

## 5. Getting Started Locally

### Prerequisites
- Node.js `v20+` or `v26+`
- npm `v10+` or `v11+`

### Installation Commands

```bash
# 1. Clone repository or navigate to workspace
cd "Personal Budget Splitter"

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 6. Supabase Project & Database Setup

SpendWise is pre-configured with a dual-engine architecture:
- **Out of the box**: Operates on a persistent client-side state engine pre-seeded with realistic Indian financial demo data.
- **Live Supabase Deployment**:
  1. Create a project at [supabase.com](https://supabase.com).
  2. Navigate to **SQL Editor** in your Supabase dashboard.
  3. Paste the contents of `database/schema.sql` and run it. This creates all tables, foreign keys, indexes, and Row Level Security (RLS) policies.
  4. Paste the contents of `database/seed.sql` to populate default categories and challenges.
  5. In your `.env.local`, set:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

---

## 7. Running the Automated Tests

To execute the unit test suite verifying paise arithmetic, split allocations, greedy debt optimization, and forecasting:

```bash
npm test
```

### Verified Test Suite
- `1. Currency & Paise Minor Unit Arithmetic`: Zero precision loss and Indian lakh/crore formatting.
- `2. Group Expense Splitting & Paise Precision`: Equal splits with remainder paise distribution, percentage validation, and weighted shares.
- `3. Group Balances & Settlement Optimizer`: Multi-payer calculations, net balance conservation ($\sum \text{Net} = 0$), and greedy settlement optimization.
- `4. Forecasting & What-If Simulator Integrity`: Boundary handling and non-mutating scenario execution.

---

## 8. Demo Data Sandbox

The application includes realistic fictional Indian financial records:
- **User**: Parv Singh (Tech Intern / Freelance Developer)
- **Accounts**: HDFC Salary Bank, ICICI Direct Mutual Funds, Google Pay UPI, Cash Wallet.
- **Trip Group**: *Goa Roadtrip 2026* with Parv, Rahul, Aditi, and Vikram featuring multi-payer villa booking, car rental, and seafood dinner.
- **1-Click Reset**: Click the **Reset Demo** button in the header or in Settings at any time to restore the full seed state.
