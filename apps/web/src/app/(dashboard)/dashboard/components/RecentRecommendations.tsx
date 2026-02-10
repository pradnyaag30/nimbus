'use client';

import { Lightbulb, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';

const recommendations = [
  {
    id: '1',
    title: 'Rightsize underutilized EC2 instances',
    savings: 2840,
    provider: 'AWS',
    severity: 'high' as const,
    count: 12,
  },
  {
    id: '2',
    title: 'Delete unattached Azure managed disks',
    savings: 1560,
    provider: 'Azure',
    severity: 'medium' as const,
    count: 8,
  },
  {
    id: '3',
    title: 'Convert on-demand to reserved instances',
    savings: 4200,
    provider: 'AWS',
    severity: 'high' as const,
    count: 5,
  },
  {
    id: '4',
    title: 'Remove unused elastic IPs',
    savings: 320,
    provider: 'AWS',
    severity: 'low' as const,
    count: 15,
  },
  {
    id: '5',
    title: 'Optimize GCS storage classes',
    savings: 890,
    provider: 'GCP',
    severity: 'medium' as const,
    count: 3,
  },
];

const severityStyles = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export function RecentRecommendations() {
  const { format } = useCurrency();
  const totalSavings = recommendations.reduce((sum, r) => sum + r.savings, 0);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            {format(totalSavings)}/mo potential savings
          </p>
        </div>
        <Lightbulb className="h-5 w-5 text-warning" />
      </div>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{rec.title}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles[rec.severity]}`}
                >
                  {rec.severity}
                </span>
                <span className="text-xs text-muted-foreground">{rec.count} resources</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {format(rec.savings)}/mo
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
