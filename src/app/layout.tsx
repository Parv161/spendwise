import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'SpendWise — Advanced Personal Finance & Expense Splitting',
  description:
    'Track money. Understand spending. Plan ahead. Split fairly. Save smarter. A modern fintech platform for personal budgeting, shared group expenses, and financial forecasting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
