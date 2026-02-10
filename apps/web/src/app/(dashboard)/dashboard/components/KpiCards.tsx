import { DollarSign, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

// TODO: Replace with real data from API
const kpis = [
  {
    title: 'Total Spend (MTD)',
    value: 47832.5,
    change: -3.2,
    icon: DollarSign,
    trend: 'down' as const,
  },
  {
    title: 'Forecasted Spend',
    value: 92150.0,
    change: 2.1,
    icon: TrendingUp,
    trend: 'up' as const,
  },
  {
    title: 'Savings Identified',
    value: 12450.0,
    change: 15.4,
    icon: TrendingDown,
    trend: 'down' as const,
  },
  {
    title: 'Active Anomalies',
    value: 3,
    change: 0,
    icon: AlertTriangle,
    trend: 'neutral' as const,
    isCurrency: false,
  },
];

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.title} className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold">
              {kpi.isCurrency === false ? kpi.value : formatCurrency(kpi.value)}
            </p>
            {kpi.change !== 0 && (
              <p
                className={`mt-1 text-xs font-medium ${
                  kpi.trend === 'down' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPercentage(kpi.change)} from last month
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
