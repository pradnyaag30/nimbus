'use client';

import { Lightbulb, ArrowUpRight } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';

const categories = [
  { category: 'Rightsizing', description: 'Resize over-provisioned resources to match actual usage', count: 24, savings: 4820 },
  { category: 'Reserved Instances', description: 'Commit to 1-3 year terms for predictable workloads', count: 8, savings: 12400 },
  { category: 'Idle Resources', description: 'Delete or stop unused resources wasting money', count: 31, savings: 3250 },
  { category: 'Storage Optimization', description: 'Move infrequently accessed data to cheaper storage tiers', count: 15, savings: 1890 },
  { category: 'Spot Instances', description: 'Use spot/preemptible instances for fault-tolerant workloads', count: 6, savings: 5600 },
  { category: 'Network Optimization', description: 'Reduce cross-region data transfer and optimize routing', count: 9, savings: 2100 },
];

const totalSavings = categories.reduce((sum, c) => sum + c.savings, 0);
const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

export default function RecommendationsPage() {
  const { format } = useCurrency();

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered optimization recommendations across all cloud providers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Potential Savings</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(totalSavings)}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Recommendations</p>
          <p className="mt-1 text-3xl font-bold">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Annualized Savings</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(totalSavings * 12)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="group rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between">
              <Lightbulb className="h-5 w-5 text-warning" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <h3 className="mt-3 font-semibold">{cat.category}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">{cat.count} items</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {format(cat.savings)}/mo
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
