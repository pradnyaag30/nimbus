'use client';

import { useCurrency } from '@/components/providers/CurrencyProvider';
import { AlertTriangle, PlusCircle } from 'lucide-react';

interface BudgetsClientProps {
  totalSpendMTD: number;
  forecastedSpend: number;
  topServices: { name: string; provider: string; cost: number; change: number }[];
  accountId: string;
  error?: string;
}

export function BudgetsClient({
  totalSpendMTD,
  forecastedSpend,
  topServices,
  accountId,
  error,
}: BudgetsClientProps) {
  const { format } = useCurrency();

  if (error || totalSpendMTD === 0) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Track spend against budgets and set alerts for overspend.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No cost data available. Connect a cloud account first.</p>
        </div>
      </div>
    );
  }

  // Derive budgets from real data — overall account + top 3 services
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const burnRate = totalSpendMTD / Math.max(dayOfMonth, 1);

  const budgets = [
    {
      name: 'AWS Total (Account)',
      provider: 'AWS',
      limit: forecastedSpend * 1.1, // 10% above forecast as budget
      spent: totalSpendMTD,
      projected: forecastedSpend,
    },
    ...topServices.slice(0, 3).map((s) => ({
      name: s.name,
      provider: s.provider,
      limit: s.cost * (daysInMonth / Math.max(dayOfMonth, 1)) * 1.1,
      spent: s.cost,
      projected: s.cost * (daysInMonth / Math.max(dayOfMonth, 1)),
    })),
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Budget tracking for AWS Account {accountId} — Day {dayOfMonth}/{daysInMonth}
          </p>
        </div>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <PlusCircle className="h-4 w-4" />
          Create Budget
        </button>
      </div>

      {/* Budget progress summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">MTD Spend</p>
          <p className="mt-1 text-2xl font-bold">{format(totalSpendMTD)}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Daily Burn Rate</p>
          <p className="mt-1 text-2xl font-bold">{format(burnRate)}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Projected EOM</p>
          <p className="mt-1 text-2xl font-bold">{format(forecastedSpend)}</p>
        </div>
      </div>

      {/* Budget cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const projectedPct = (budget.projected / budget.limit) * 100;
          const isOver = percentage > 100;
          const isWarning = percentage > 80 && !isOver;
          const willExceed = projectedPct > 100;

          return (
            <div key={budget.name} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{budget.name}</h3>
                  <p className="text-xs text-muted-foreground">{budget.provider}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isOver
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : isWarning || willExceed
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {isOver ? 'Over Budget' : willExceed ? 'Will Exceed' : isWarning ? 'Warning' : 'On Track'}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>{format(budget.spent)} spent</span>
                  <span className="text-muted-foreground">{format(budget.limit)} limit</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? 'bg-red-500' : isWarning || willExceed ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(1)}% used</span>
                  <span>Projected: {format(budget.projected)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Auto-budgets:</strong> Budgets are auto-calculated at 110% of forecasted spend.
          Custom budgets with email alerts can be configured via AWS Budgets in the AWS Console.
        </p>
      </div>
    </div>
  );
}
