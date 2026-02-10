import { formatCurrency } from '@/lib/utils';

export const metadata = { title: 'Budgets' };

// TODO: Replace with real data
const budgets = [
  { name: 'AWS Production', limit: 25000, spent: 20800, provider: 'AWS' },
  { name: 'Azure Development', limit: 10000, spent: 7200, provider: 'Azure' },
  { name: 'GCP Analytics', limit: 8000, spent: 9600, provider: 'GCP' },
  { name: 'K8s Platform', limit: 5000, spent: 3200, provider: 'Kubernetes' },
];

export default function BudgetsPage() {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Track spend against budgets and set alerts for overspend.
          </p>
        </div>
        <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          Create Budget
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const isOver = percentage > 100;
          const isWarning = percentage > 80 && !isOver;

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
                      : isWarning
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {isOver ? 'Over Budget' : isWarning ? 'Warning' : 'On Track'}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>{formatCurrency(budget.spent)} spent</span>
                  <span className="text-muted-foreground">{formatCurrency(budget.limit)} limit</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
