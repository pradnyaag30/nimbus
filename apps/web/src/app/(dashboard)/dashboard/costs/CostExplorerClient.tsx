'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface CostExplorerClientProps {
  monthlyCosts: { month: string; cost: number }[];
  topServices: { name: string; provider: string; cost: number; change: number }[];
  totalSpendMTD: number;
  forecastedSpend: number;
  changePercentage: number;
  accountId: string;
  error?: string;
}

export function CostExplorerClient({
  monthlyCosts,
  topServices,
  totalSpendMTD,
  forecastedSpend,
  changePercentage,
  accountId,
  error,
}: CostExplorerClientProps) {
  const { format, symbol, convert } = useCurrency();

  const chartData = monthlyCosts.map((item) => {
    const date = new Date(item.month);
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return { month: label, cost: item.cost };
  });

  if (error || totalSpendMTD === 0) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Analyze and break down your cloud costs by service, account, region, and tags.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No cost data available</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {error || 'Connect a cloud account to start exploring costs.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalServices = topServices.reduce((sum, s) => sum + s.cost, 0);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Live cost data from AWS Account {accountId}
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Spend (MTD)</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{format(totalSpendMTD)}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Forecasted</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{format(forecastedSpend)}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">MoM Change</p>
            {changePercentage <= 0 ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className={`mt-2 text-2xl font-bold ${changePercentage <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Monthly Cost Bar Chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="font-semibold">Monthly Cost Trend</h3>
          <p className="text-sm text-muted-foreground">Last 12 months of AWS spend</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${symbol}${(convert(v) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [format(value), 'Cost']}
              />
              <Bar dataKey="cost" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Breakdown Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h3 className="font-semibold">Service Breakdown (Current Month)</h3>
          <p className="text-sm text-muted-foreground">Top services by cost with month-over-month change</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-6 py-3 font-medium text-muted-foreground">Service</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Provider</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Cost (MTD)</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">% of Total</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">MoM Change</th>
              </tr>
            </thead>
            <tbody>
              {topServices.map((service) => (
                <tr key={service.name} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-3 font-medium">{service.name}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      {service.provider}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium">{format(service.cost)}</td>
                  <td className="px-6 py-3 text-right text-muted-foreground">
                    {totalServices > 0 ? ((service.cost / totalServices) * 100).toFixed(1) : 0}%
                  </td>
                  <td className={`px-6 py-3 text-right font-medium ${
                    service.change < 0 ? 'text-green-600 dark:text-green-400' : service.change > 5 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                  }`}>
                    {service.change >= 0 ? '+' : ''}{service.change.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
