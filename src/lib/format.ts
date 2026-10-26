import { CurrencyCode } from '@/types';

/**
 * Converts integer paise (minor units) to human-readable currency string.
 * Formats INR using the Indian numbering system (Lakhs/Crores, e.g. ₹1,25,000.00).
 */
export function formatCurrency(
  paise: number,
  currency: CurrencyCode = 'INR',
  includeDecimals: boolean = false
): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const majorUnits = absPaise / 100;

  let formatted = '';

  if (currency === 'INR') {
    formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(majorUnits);
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(majorUnits);
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Converts rupees (major unit) to paise (integer minor unit).
 * Avoids float precision glitches: e.g. 19.99 * 100 -> 1999
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/[^0-9.-]/g, '');
    rupees = parseFloat(cleaned) || 0;
  }
  return Math.round(rupees * 100);
}

/**
 * Converts paise to rupees.
 */
export function paiseToRupees(paise: number): number {
  return (paise || 0) / 100;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into user-friendly format (e.g. 24 Oct 2026).
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Gets the current month in YYYY-MM format.
 */
export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns the human readable month name (e.g. "October 2026") from "YYYY-MM".
 */
export function formatMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
}
