import {
  Profile,
  Account,
  Category,
  Transaction,
  RecurringTransaction,
  Budget,
  SavingsGoal,
  SavingsContribution,
  SavingsChallenge,
  ChallengeProgress,
  ExpenseGroup,
  GroupMember,
  GroupExpense,
  ExpenseShare,
  Settlement,
  AppNotification,
  ForecastScenario,
} from '@/types';
import { getCurrentMonthStr } from './format';

const currentMonth = getCurrentMonthStr();
const [currYear, currMonthNum] = currentMonth.split('-').map(Number);
const prevMonthDate = new Date(currYear, currMonthNum - 2, 1);
const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

export const INITIAL_PROFILE: Profile = {
  id: 'usr_demo_001',
  email: 'parv@spendwise.app',
  display_name: 'Parv Singh',
  currency: 'INR',
  monthly_income_paise: 7500000, // ₹75,000.00
  needs_pct: 50,
  wants_pct: 30,
  savings_pct: 20,
  onboarding_completed: true,
};

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_01',
    user_id: 'usr_demo_001',
    name: 'HDFC Salary Bank',
    account_type: 'savings',
    balance_paise: 6425000, // ₹64,250
    currency: 'INR',
    is_default: true,
  },
  {
    id: 'acc_02',
    user_id: 'usr_demo_001',
    name: 'ICICI Direct Mutual Funds',
    account_type: 'investment',
    balance_paise: 12500000, // ₹1,25,000
    currency: 'INR',
    is_default: false,
  },
  {
    id: 'acc_03',
    user_id: 'usr_demo_001',
    name: 'Google Pay / UPI',
    account_type: 'upi',
    balance_paise: 840000, // ₹8,400
    currency: 'INR',
    is_default: false,
  },
  {
    id: 'acc_04',
    user_id: 'usr_demo_001',
    name: 'Cash Wallet',
    account_type: 'cash',
    balance_paise: 350000, // ₹3,500
    currency: 'INR',
    is_default: false,
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_salary',
    user_id: null,
    name: 'Salary & Stipend',
    type: 'income',
    classification: 'income',
    color: '#10b981',
    icon: 'Briefcase',
    is_custom: false,
  },
  {
    id: 'cat_freelance',
    user_id: null,
    name: 'Freelance & Projects',
    type: 'income',
    classification: 'income',
    color: '#059669',
    icon: 'Laptop',
    is_custom: false,
  },
  {
    id: 'cat_rent',
    user_id: null,
    name: 'Rent & Housing',
    type: 'expense',
    classification: 'needs',
    color: '#6366f1',
    icon: 'Home',
    is_custom: false,
  },
  {
    id: 'cat_groceries',
    user_id: null,
    name: 'Groceries & Provisions',
    type: 'expense',
    classification: 'needs',
    color: '#3b82f6',
    icon: 'ShoppingCart',
    is_custom: false,
  },
  {
    id: 'cat_utilities',
    user_id: null,
    name: 'Utilities & Wi-Fi',
    type: 'expense',
    classification: 'needs',
    color: '#0ea5e9',
    icon: 'Zap',
    is_custom: false,
  },
  {
    id: 'cat_transport',
    user_id: null,
    name: 'Transport & Metro',
    type: 'expense',
    classification: 'needs',
    color: '#f59e0b',
    icon: 'Bus',
    is_custom: false,
  },
  {
    id: 'cat_food',
    user_id: null,
    name: 'Food Delivery & Dining',
    type: 'expense',
    classification: 'wants',
    color: '#ef4444',
    icon: 'Utensils',
    is_custom: false,
  },
  {
    id: 'cat_shopping',
    user_id: null,
    name: 'Shopping & Electronics',
    type: 'expense',
    classification: 'wants',
    color: '#ec4899',
    icon: 'ShoppingBag',
    is_custom: false,
  },
  {
    id: 'cat_subs',
    user_id: null,
    name: 'Subscriptions & Entertainment',
    type: 'expense',
    classification: 'wants',
    color: '#8b5cf6',
    icon: 'Film',
    is_custom: false,
  },
  {
    id: 'cat_health',
    user_id: null,
    name: 'Health & Fitness',
    type: 'expense',
    classification: 'needs',
    color: '#14b8a6',
    icon: 'HeartPulse',
    is_custom: false,
  },
  {
    id: 'cat_travel',
    user_id: null,
    name: 'Travel & Vacations',
    type: 'expense',
    classification: 'wants',
    color: '#f97316',
    icon: 'Compass',
    is_custom: false,
  },
  {
    id: 'cat_sip',
    user_id: null,
    name: 'SIP & Mutual Funds',
    type: 'expense',
    classification: 'savings',
    color: '#10b981',
    icon: 'PiggyBank',
    is_custom: false,
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'bgt_overall',
    user_id: 'usr_demo_001',
    category_id: null, // Overall Monthly Limit
    amount_paise: 4800000, // ₹48,000
    period: 'monthly',
    start_date: `${currentMonth}-01`,
    end_date: `${currentMonth}-31`,
    alert_threshold_pct: 80,
  },
  {
    id: 'bgt_food',
    user_id: 'usr_demo_001',
    category_id: 'cat_food',
    amount_paise: 900000, // ₹9,000
    period: 'monthly',
    start_date: `${currentMonth}-01`,
    end_date: `${currentMonth}-31`,
    alert_threshold_pct: 85,
  },
  {
    id: 'bgt_groceries',
    user_id: 'usr_demo_001',
    category_id: 'cat_groceries',
    amount_paise: 800000, // ₹8,000
    period: 'monthly',
    start_date: `${currentMonth}-01`,
    end_date: `${currentMonth}-31`,
    alert_threshold_pct: 75,
  },
  {
    id: 'bgt_transport',
    user_id: 'usr_demo_001',
    category_id: 'cat_transport',
    amount_paise: 450000, // ₹4,500
    period: 'monthly',
    start_date: `${currentMonth}-01`,
    end_date: `${currentMonth}-31`,
    alert_threshold_pct: 80,
  },
  {
    id: 'bgt_shopping',
    user_id: 'usr_demo_001',
    category_id: 'cat_shopping',
    amount_paise: 600000, // ₹6,000
    period: 'monthly',
    start_date: `${currentMonth}-01`,
    end_date: `${currentMonth}-31`,
    alert_threshold_pct: 90,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Current Month Incomes
  {
    id: 'tx_01',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_salary',
    amount_paise: 6500000,
    type: 'income',
    description: 'Tech Internship Stipend',
    date: `${currentMonth}-01`,
    merchant: 'Acme Technologies Ltd.',
  },
  {
    id: 'tx_02',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_freelance',
    amount_paise: 1800000,
    type: 'income',
    description: 'React Dashboard UI Freelance Project',
    date: `${currentMonth}-12`,
    merchant: 'FinScale Studio',
  },
  // Current Month Expenses
  {
    id: 'tx_03',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_rent',
    amount_paise: 1600000,
    type: 'expense',
    description: 'Apartment Monthly Rent',
    date: `${currentMonth}-02`,
    merchant: 'Flat Owner',
  },
  {
    id: 'tx_04',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_sip',
    amount_paise: 1000000,
    type: 'expense',
    description: 'Nifty 50 Index Fund Monthly SIP',
    date: `${currentMonth}-05`,
    merchant: 'ICICI Prudential MF',
  },
  {
    id: 'tx_05',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_groceries',
    amount_paise: 345000,
    type: 'expense',
    description: 'Monthly Groceries & Staples',
    date: `${currentMonth}-04`,
    merchant: 'DMart Supermarket',
  },
  {
    id: 'tx_06',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_food',
    amount_paise: 68000,
    type: 'expense',
    description: 'Dinner with Team (Biryani Blues)',
    date: `${currentMonth}-08`,
    merchant: 'Swiggy',
  },
  {
    id: 'tx_07',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_transport',
    amount_paise: 100000,
    type: 'expense',
    description: 'Smart Card Metro Pass Recharge',
    date: `${currentMonth}-03`,
    merchant: 'Namma Metro Bangalore',
  },
  {
    id: 'tx_08',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_utilities',
    amount_paise: 99900,
    type: 'expense',
    description: 'Airtel Xstream Fiber 200Mbps',
    date: `${currentMonth}-10`,
    merchant: 'Airtel Payments',
  },
  {
    id: 'tx_09',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_subs',
    amount_paise: 11900,
    type: 'expense',
    description: 'Spotify Premium Student',
    date: `${currentMonth}-11`,
    merchant: 'Spotify India',
  },
  {
    id: 'tx_10',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_food',
    amount_paise: 42000,
    type: 'expense',
    description: 'Weekend Pizza & Garlic Bread',
    date: `${currentMonth}-14`,
    merchant: 'Zomato',
  },
  {
    id: 'tx_11',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_groceries',
    amount_paise: 89000,
    type: 'expense',
    description: 'Weekly Fruits, Milk & Vegetables',
    date: `${currentMonth}-16`,
    merchant: 'Blinkit',
  },
  {
    id: 'tx_12',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_transport',
    amount_paise: 38000,
    type: 'expense',
    description: 'Cab Ride to Tech Conference',
    date: `${currentMonth}-18`,
    merchant: 'Uber India',
  },
  {
    id: 'tx_13',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_shopping',
    amount_paise: 249900,
    type: 'expense',
    description: 'Mechanical Keyboard (Keychron K2)',
    date: `${currentMonth}-19`,
    merchant: 'Amazon India',
  },
  {
    id: 'tx_14',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_food',
    amount_paise: 54000,
    type: 'expense',
    description: 'Coffee & Sandwich with Colleague',
    date: `${currentMonth}-21`,
    merchant: 'Third Wave Coffee',
  },
  {
    id: 'tx_15',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_health',
    amount_paise: 120000,
    type: 'expense',
    description: 'Multivitamins & Protein Powder',
    date: `${currentMonth}-22`,
    merchant: 'Apollo Pharmacy',
  },
  // Previous Month Samples for Trend Comparisons
  {
    id: 'tx_prev_01',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_salary',
    amount_paise: 6500000,
    type: 'income',
    description: 'Tech Internship Stipend',
    date: `${prevMonth}-01`,
  },
  {
    id: 'tx_prev_02',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_rent',
    amount_paise: 1600000,
    type: 'expense',
    description: 'Apartment Monthly Rent',
    date: `${prevMonth}-02`,
  },
  {
    id: 'tx_prev_03',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_sip',
    amount_paise: 1000000,
    type: 'expense',
    description: 'Index Fund SIP',
    date: `${prevMonth}-05`,
  },
  {
    id: 'tx_prev_04',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_groceries',
    amount_paise: 380000,
    type: 'expense',
    description: 'DMart Supermarket',
    date: `${prevMonth}-06`,
  },
  {
    id: 'tx_prev_05',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_food',
    amount_paise: 320000,
    type: 'expense',
    description: 'Zomato Dining & Swiggy',
    date: `${prevMonth}-15`,
  },
];

export const INITIAL_RECURRING: RecurringTransaction[] = [
  {
    id: 'rec_01',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_rent',
    amount_paise: 1600000, // ₹16,000
    type: 'expense',
    description: 'Apartment Monthly Rent',
    frequency: 'monthly',
    start_date: `${currentMonth}-01`,
    next_run_date: `${currentMonth}-01`,
    is_active: true,
  },
  {
    id: 'rec_02',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_sip',
    amount_paise: 1000000, // ₹10,000
    type: 'expense',
    description: 'Nifty 50 Index Fund SIP',
    frequency: 'monthly',
    start_date: `${currentMonth}-05`,
    next_run_date: `${currentMonth}-05`,
    is_active: true,
  },
  {
    id: 'rec_03',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_utilities',
    amount_paise: 99900, // ₹999
    type: 'expense',
    description: 'Airtel Xstream Fiber Wi-Fi',
    frequency: 'monthly',
    start_date: `${currentMonth}-10`,
    next_run_date: `${currentMonth}-10`,
    is_active: true,
  },
  {
    id: 'rec_04',
    user_id: 'usr_demo_001',
    account_id: 'acc_03',
    category_id: 'cat_subs',
    amount_paise: 11900, // ₹119
    type: 'expense',
    description: 'Spotify Student Subscription',
    frequency: 'monthly',
    start_date: `${currentMonth}-11`,
    next_run_date: `${currentMonth}-11`,
    is_active: true,
  },
  {
    id: 'rec_05',
    user_id: 'usr_demo_001',
    account_id: 'acc_01',
    category_id: 'cat_salary',
    amount_paise: 6500000, // ₹65,000
    type: 'income',
    description: 'Tech Internship Monthly Stipend',
    frequency: 'monthly',
    start_date: `${currentMonth}-01`,
    next_run_date: `${currentMonth}-01`,
    is_active: true,
  },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal_01',
    user_id: 'usr_demo_001',
    name: 'MacBook Pro M-Series',
    target_amount_paise: 15000000, // ₹1,50,000
    current_amount_paise: 9500000, // ₹95,000 (63%)
    target_date: '2026-12-31',
    priority: 'high',
    category: 'Tech Upgrade',
    description: 'For coding, local LLMs, and development work.',
    is_completed: false,
  },
  {
    id: 'goal_02',
    user_id: 'usr_demo_001',
    name: 'Emergency Fund (6 Months)',
    target_amount_paise: 12000000, // ₹1,20,000
    current_amount_paise: 7500000, // ₹75,000 (62%)
    target_date: '2026-11-30',
    priority: 'high',
    category: 'Safety Net',
    description: 'Liquid cash buffer kept in high-yield savings.',
    is_completed: false,
  },
  {
    id: 'goal_03',
    user_id: 'usr_demo_001',
    name: 'Ladakh Bike Expedition',
    target_amount_paise: 4500000, // ₹45,000
    current_amount_paise: 2800000, // ₹28,000 (62%)
    target_date: '2027-06-15',
    priority: 'medium',
    category: 'Travel',
    description: 'Bike rental, fuel, gear, and homestays.',
    is_completed: false,
  },
];

export const INITIAL_SAVINGS_CONTRIBUTIONS: SavingsContribution[] = [
  {
    id: 'sc_01',
    goal_id: 'goal_01',
    user_id: 'usr_demo_001',
    amount_paise: 1500000,
    type: 'deposit',
    notes: 'Freelance payment allocation',
    date: `${currentMonth}-05`,
  },
  {
    id: 'sc_02',
    goal_id: 'goal_02',
    user_id: 'usr_demo_001',
    amount_paise: 1000000,
    type: 'deposit',
    notes: 'Monthly emergency fund transfer',
    date: `${currentMonth}-02`,
  },
];

export const INITIAL_CHALLENGES: SavingsChallenge[] = [
  {
    id: 'chal_01',
    code: 'CHAL_NO_DELIVERY_14',
    title: '14-Day Home Cook Sprint',
    description: 'Cut Swiggy/Zomato orders and cook meals at home. Target savings: ₹3,500.',
    duration_days: 14,
    target_amount_paise: 350000,
    badge_icon: 'ChefHat',
    rule_type: 'no_spend_discretionary',
  },
  {
    id: 'chal_02',
    code: 'CHAL_SIP_SPRINT_30',
    title: '₹10,000 Wealth Builder',
    description: 'Transfer at least ₹10,000 to your index fund SIP or liquid savings this month.',
    duration_days: 30,
    target_amount_paise: 1000000,
    badge_icon: 'TrendingUp',
    rule_type: 'weekly_target',
  },
  {
    id: 'chal_03',
    code: 'CHAL_METRO_STREAK_7',
    title: 'Public Transit Streak',
    description: 'Keep travel costs under ₹600 by riding Metro instead of ride-hailing cabs.',
    duration_days: 7,
    target_amount_paise: 60000,
    badge_icon: 'Train',
    rule_type: 'stay_in_budget',
  },
];

export const INITIAL_CHALLENGE_PROGRESS: ChallengeProgress[] = [
  {
    id: 'cp_01',
    user_id: 'usr_demo_001',
    challenge_id: 'chal_01',
    start_date: `${currentMonth}-01`,
    end_date: `${currentMonth}-15`,
    current_amount_paise: 245000, // ₹2,450 saved
    status: 'in_progress',
  },
  {
    id: 'cp_02',
    user_id: 'usr_demo_001',
    challenge_id: 'chal_02',
    start_date: `${currentMonth}-01`,
    end_date: `${currentMonth}-30`,
    current_amount_paise: 1000000,
    status: 'completed',
  },
];

// SHARED EXPENSE GROUP DEMO: "Goa Roadtrip 2026"
const GROUP_ID = 'grp_goa_2026';
const MEM_PARV = 'mem_parv';
const MEM_RAHUL = 'mem_rahul';
const MEM_ADITI = 'mem_aditi';
const MEM_VIKRAM = 'mem_vikram';

export const INITIAL_EXPENSE_GROUPS: ExpenseGroup[] = [
  {
    id: GROUP_ID,
    created_by: 'usr_demo_001',
    name: 'Goa Roadtrip 2026',
    description: '4-day beach vacation with college friends: villa, car rental, food & scuba.',
    currency: 'INR',
    group_type: 'trip',
    created_at: `${currentMonth}-02`,
  },
];

export const INITIAL_GROUP_MEMBERS: GroupMember[] = [
  {
    id: MEM_PARV,
    group_id: GROUP_ID,
    user_id: 'usr_demo_001',
    display_name: 'Parv (You)',
    email: 'parv@spendwise.app',
    role: 'admin',
  },
  {
    id: MEM_RAHUL,
    group_id: GROUP_ID,
    user_id: null,
    display_name: 'Rahul Sharma',
    email: 'rahul@gmail.com',
    role: 'member',
  },
  {
    id: MEM_ADITI,
    group_id: GROUP_ID,
    user_id: null,
    display_name: 'Aditi Rao',
    email: 'aditi.rao@gmail.com',
    role: 'member',
  },
  {
    id: MEM_VIKRAM,
    group_id: GROUP_ID,
    user_id: null,
    display_name: 'Vikram Patel',
    email: 'vikram.p@gmail.com',
    role: 'member',
  },
];

export const INITIAL_GROUP_EXPENSES: GroupExpense[] = [
  {
    id: 'gexp_01',
    group_id: GROUP_ID,
    payer_member_id: MEM_PARV,
    title: 'Beachfront 4BHK Villa Booking (3 Nights)',
    total_amount_paise: 2400000, // ₹24,000
    split_type: 'equal',
    date: `${currentMonth}-03`,
    notes: 'Booked via Airbnb with pool and breakfast included.',
    shares: [
      { id: 'sh_01', expense_id: 'gexp_01', member_id: MEM_PARV, allocated_share_paise: 600000 },
      { id: 'sh_02', expense_id: 'gexp_01', member_id: MEM_RAHUL, allocated_share_paise: 600000 },
      { id: 'sh_03', expense_id: 'gexp_01', member_id: MEM_ADITI, allocated_share_paise: 600000 },
      { id: 'sh_04', expense_id: 'gexp_01', member_id: MEM_VIKRAM, allocated_share_paise: 600000 },
    ],
  },
  {
    id: 'gexp_02',
    group_id: GROUP_ID,
    payer_member_id: MEM_RAHUL,
    title: 'Self-Drive SUV Rental & Highway Fuel',
    total_amount_paise: 1250000, // ₹12,500
    split_type: 'equal',
    date: `${currentMonth}-04`,
    notes: 'Innova Crysta rental + fastag tolls + 2 fuel refuels.',
    shares: [
      { id: 'sh_05', expense_id: 'gexp_02', member_id: MEM_PARV, allocated_share_paise: 312500 },
      { id: 'sh_06', expense_id: 'gexp_02', member_id: MEM_RAHUL, allocated_share_paise: 312500 },
      { id: 'sh_07', expense_id: 'gexp_02', member_id: MEM_ADITI, allocated_share_paise: 312500 },
      { id: 'sh_08', expense_id: 'gexp_02', member_id: MEM_VIKRAM, allocated_share_paise: 312500 },
    ],
  },
  {
    id: 'gexp_03',
    group_id: GROUP_ID,
    payer_member_id: MEM_VIKRAM,
    title: "Fisherman's Wharf Goan Seafood Dinner",
    total_amount_paise: 640000, // ₹6,400
    split_type: 'equal',
    date: `${currentMonth}-04`,
    notes: 'Crab Xec Xec, Prawn Balchão, and fresh mocktails.',
    shares: [
      { id: 'sh_09', expense_id: 'gexp_03', member_id: MEM_PARV, allocated_share_paise: 160000 },
      { id: 'sh_10', expense_id: 'gexp_03', member_id: MEM_RAHUL, allocated_share_paise: 160000 },
      { id: 'sh_11', expense_id: 'gexp_03', member_id: MEM_ADITI, allocated_share_paise: 160000 },
      { id: 'sh_12', expense_id: 'gexp_03', member_id: MEM_VIKRAM, allocated_share_paise: 160000 },
    ],
  },
  {
    id: 'gexp_04',
    group_id: GROUP_ID,
    payer_member_id: MEM_ADITI,
    title: 'Scuba Diving & Jet Ski at Grande Island',
    total_amount_paise: 800000, // ₹8,000
    split_type: 'equal',
    date: `${currentMonth}-05`,
    notes: 'Instructor guided dive with GoPro underwater video.',
    shares: [
      { id: 'sh_13', expense_id: 'gexp_04', member_id: MEM_PARV, allocated_share_paise: 200000 },
      { id: 'sh_14', expense_id: 'gexp_04', member_id: MEM_RAHUL, allocated_share_paise: 200000 },
      { id: 'sh_15', expense_id: 'gexp_04', member_id: MEM_ADITI, allocated_share_paise: 200000 },
      { id: 'sh_16', expense_id: 'gexp_04', member_id: MEM_VIKRAM, allocated_share_paise: 200000 },
    ],
  },
  {
    id: 'gexp_05',
    group_id: GROUP_ID,
    payer_member_id: MEM_PARV,
    title: 'Cafe Thalassa Sunset Dinner & Drinks',
    total_amount_paise: 380000, // ₹3,800
    split_type: 'exact',
    date: `${currentMonth}-05`,
    notes: 'Exact split based on orders.',
    shares: [
      { id: 'sh_17', expense_id: 'gexp_05', member_id: MEM_PARV, allocated_share_paise: 100000 },
      { id: 'sh_18', expense_id: 'gexp_05', member_id: MEM_RAHUL, allocated_share_paise: 100000 },
      { id: 'sh_19', expense_id: 'gexp_05', member_id: MEM_ADITI, allocated_share_paise: 90000 },
      { id: 'sh_20', expense_id: 'gexp_05', member_id: MEM_VIKRAM, allocated_share_paise: 90000 },
    ],
  },
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'stl_01',
    group_id: GROUP_ID,
    from_member_id: MEM_RAHUL,
    to_member_id: MEM_PARV,
    amount_paise: 287500, // ₹2,875
    payment_method: 'GPay UPI',
    reference_note: 'Partial settlement for villa booking',
    settled_at: `${currentMonth}-06T18:30:00Z`,
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_01',
    user_id: 'usr_demo_001',
    title: 'Food Delivery Budget Alert',
    message: 'You have consumed 82% of your monthly Food Delivery budget.',
    type: 'budget_warning',
    is_read: false,
    link_url: '/budgets',
    created_at: `${currentMonth}-20T10:15:00Z`,
  },
  {
    id: 'notif_02',
    user_id: 'usr_demo_001',
    title: 'Savings Milestone Achieved! 🎉',
    message: 'MacBook Pro goal has surpassed 60% completion (₹95,000 saved).',
    type: 'savings_milestone',
    is_read: false,
    link_url: '/savings',
    created_at: `${currentMonth}-15T14:20:00Z`,
  },
  {
    id: 'notif_03',
    user_id: 'usr_demo_001',
    title: 'Upcoming Bill Reminder',
    message: 'Airtel Xstream Fiber (₹999) is due in 3 days.',
    type: 'upcoming_bill',
    is_read: true,
    link_url: '/cash-flow',
    created_at: `${currentMonth}-07T09:00:00Z`,
  },
];

export const INITIAL_FORECAST_SCENARIOS: ForecastScenario[] = [
  {
    id: 'scen_01',
    user_id: 'usr_demo_001',
    name: 'Side Gig + 15% Spend Cut',
    income_delta_paise: 1500000, // +₹15,000 freelance
    discretionary_spend_factor: 0.85, // 15% spending reduction
    planned_purchase_paise: 0,
    notes: 'Simulate aggressive saving toward emergency buffer.',
  },
];
