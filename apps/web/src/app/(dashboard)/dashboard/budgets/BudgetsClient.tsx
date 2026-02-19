'use client';

import { useCurrency } from '@/components/providers/CurrencyProvider';
import { PlusCircle, ExternalLink, AlertTriangle, Target } from 'lucide-react';

// --- Types -------------------------------------------------------------------

interface AwsBudget {
  budgetName: string;
  budgetType: string;
  limitAmount: number;
  currentSpend: number;
  forecastedSpend: number;
  percentUsed: number;
  alertLevel: 'ok' | 'warning' | 'critical';
}

interface AwsBudgetsSummary {
  budgets: AwsBudget[];
  totalBudgetLimit: number;
  totalCurrentSpend: number;
  budgetsInAlarm: number;
  status: 'active' | 'no-budgets' | 'error';
  errorMessage?: string;
}

interface BudgetsClientProps {
  totalSpendMTD: number;
  forecastedSpend: number;
  previousMonthTotal: number;
  topServices: { name: string; provider: string; cost: number; change: number }[];
  accountId: string;
  error?: string;
  awsBudgets?: AwsBudgetsSummary | null;
}

type AlertLevel = 'on-track' | 'normal' | 'warning' | 'critical';

const alertConfig: Record<AlertLevel, { label: string; badge: string; bar: string }> = {
  'on-track': {
    label: 'On Track',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    bar: 'bg-green-500',
  },
  'normal': {
    label: '50%+ Used',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    bar: 'bg-blue-500',
  },
  'warning': {
    label: 'Warning (>80%)',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    bar: 'bg-yellow-500',
  },
  'critical': {
    label: 'Critical (>100%)',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    bar: 'bg-red-500',
  },
};

function getAlertLevel(percentage: number): AlertLevel {
  if (percentage > 100) return 'critical';
  if (percentage > 80) return 'warning';
  if (percentage > 50) return 'normal';
  return 'on-track';
}

export function BudgetsClient({
  totalSpendMTD,
  forecastedSpend,
  previousMonthTotal,
  topServices,
  accountId,
  error,
  awsBudgets,
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

  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const burnRate = totalSpendMTD / Math.max(dayOfMonth, 1);

  const hasRealBudgets = awsBudgets?.status === 'active' && awsBudgets.budgets.length > 0;

  const handleCreateBudget = () => {
    window.open(
      'https://console.aws.amazon.com/billing/home#/budgets/create',
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Budget tracking for AWS Account {accountId} — Day {dayOfMonth}/{daysInMonth}
          </p>
        </div>
        <button
          onClick={handleCreateBudget}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          Create Budget
          <ExternalLink className="h-3 w-3" />
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

      {/* Real AWS Budgets or No-Budget CTA */}
      {hasRealBudgets ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {awsBudgets.budgets.map((budget) => {
            const percentage = budget.percentUsed;
            const projectedPct = budget.limitAmount > 0
              ? (budget.forecastedSpend / budget.limitAmount) * 100
              : 0;
            const alertLevel = getAlertLevel(percentage);
            const willExceed = projectedPct > 100 && alertLevel !== 'critical';
            const ac = alertConfig[alertLevel];

            return (
              <div key={budget.budgetName} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{budget.budgetName}</h3>
                    <p className="text-xs text-muted-foreground">{budget.budgetType}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ac.badge}`}>
                    {willExceed ? 'Will Exceed' : ac.label}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span>{format(budget.currentSpend)} spent</span>
                    <span className="text-muted-foreground">{format(budget.limitAmount)} limit</span>
                  </div>
                  {/* Progress bar with threshold markers */}
                  <div className="relative mt-2">
                    <div className="h-2.5 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${ac.bar}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="absolute top-0 h-2.5 w-px bg-blue-500/40" style={{ left: '50%' }} title="50%" />
                    <div className="absolute top-0 h-2.5 w-px bg-yellow-500/60" style={{ left: '80%' }} title="80% Warning" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% used</span>
                    {willExceed && (
                      <span className="text-yellow-600 dark:text-yellow-400">Projected to exceed</span>
                    )}
                    <span>Forecast: {format(budget.forecastedSpend)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <Target className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-3 font-semibold">No AWS Budgets Configured</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create your first budget in AWS to get threshold alerts and accurate budget tracking.
            Nimbus will automatically sync your budgets.
          </p>
          <button
            onClick={handleCreateBudget}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Create Budget in AWS
            <ExternalLink className="h-3 w-3" />
          </button>

          {/* Forecast-based summary when no budgets */}
          {forecastedSpend > 0 && (
            <div className="mx-auto mt-6 max-w-md rounded-lg border p-4 text-left">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Spend Overview (No Budget Set)
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">MTD Spend</p>
                  <p className="mt-0.5 text-sm font-bold">{format(totalSpendMTD)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Forecast</p>
                  <p className="mt-0.5 text-sm font-bold">{format(forecastedSpend)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Month</p>
                  <p className="mt-0.5 text-sm font-bold">{format(previousMonthTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert threshold legend */}
      {hasRealBudgets && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />On Track (&lt;50%)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />Normal (50-80%)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" />Warning (80-100%)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Critical (&gt;100%)</span>
        </div>
      )}
    </div>
  );
}
