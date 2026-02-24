'use client';

import { useState, useTransition } from 'react';
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
import { CostExplorerFilterBar } from './components/CostExplorerFilterBar';
import { getFilteredCosts, type CostExplorerFilters, type FilteredCostResult } from './actions';

interface CostExplorerClientProps {
  monthlyCosts: { month: string; cost: number }[];
  topServices: { name: string; provider: string; cost: number; change: number }[];
  totalSpendMTD: number;
  forecastedSpend: number;
  changePercentage: number;
  accountId: string;
  error?: string;
  availableServices: string[];
  availableRegions: string[];
}

export function CostExplorerClient({
  monthlyCosts,
  topServices,
  totalSpendMTD,
  forecastedSpend,
  changePercentage,
  accountId,
  error,
  availableServices,
  availableRegions,
}: CostExplorerClientProps) {
  const { format, symbol, convert } = useCurrency();
  const [isPending, startTransition] = useTransition();
  const [filteredData, setFilteredData] = useState<FilteredCostResult | null>(null);
  const [activeGranularity, setActiveGranularity] = useState<'DAILY' | 'MONTHLY'>('MONTHLY');

  // Use filtered data if available, otherwise initial server data
  const displayCosts = filteredData?.costData ?? monthlyCosts.map((item) => ({ date: item.month, cost: item.cost }));
  const displayServices = filteredData?.serviceBreakdown ?? topServices.map((s) => ({
    service: s.name,
    cost: s.cost,
    percentOfTotal: 0,
    provider: s.provider,
    change: s.change,
  }));
  const displayTotal = filteredData?.totalSpend ?? totalSpendMTD;

  const chartData = displayCosts.map((item) => {
    const date = new Date(item.date);
    const label = activeGranularity === 'DAILY'
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return { month: label, cost: item.cost };
  });

  const handleFiltersChange = (filters: CostExplorerFilters) => {
    setActiveGranularity(filters.granularity);
    startTransition(async () => {
      const result = await getFilteredCosts(filters);
      setFilteredData(result);
    });
  };

  // Total for percentage calculation
  const totalServices = displayServices.reduce((sum, s) => sum + s.cost, 0);

  if (error || (totalSpendMTD === 0 && !filteredData)) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Analyze and break down your cloud costs by service, account, region, and tags.
          </p>
        </div>
        <CostExplorerFilterBar
          availableServices={availableServices}
          availableRegions={availableRegions}
          onFiltersChange={handleFiltersChange}
          isLoading={isPending}
        />
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

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Live cost data from AWS Account {accountId}
        </p>
      </div>

      {/* Filter Bar */}
      <CostExplorerFilterBar
        availableServices={availableServices}
        availableRegions={availableRegions}
        onFiltersChange={handleFiltersChange}
        isLoading={isPending}
      />

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {filteredData ? 'Filtered Spend' : 'Spend (MTD)'}
            </p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{format(displayTotal)}</p>
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

      {/* Cost Chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="font-semibold">
            {activeGranularity === 'DAILY' ? 'Daily' : 'Monthly'} Cost Trend
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredData ? 'Filtered results' : `Last 12 months of AWS spend`}
          </p>
        </div>
        <div className="relative h-[300px]">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading...
              </div>
            </div>
          )}
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
          <h3 className="font-semibold">Service Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            {filteredData ? 'Filtered services' : 'Top services by cost with month-over-month change'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-6 py-3 font-medium text-muted-foreground">Service</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Cost</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">% of Total</th>
                <th className="px-6 py-3 font-medium text-muted-foreground min-w-[120px]">Share</th>
              </tr>
            </thead>
            <tbody>
              {displayServices.map((service) => {
                const pct = totalServices > 0 ? (service.cost / totalServices) * 100 : 0;
                return (
                  <tr key={service.service} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium">{service.service}</td>
                    <td className="px-6 py-3 text-right font-medium">{format(service.cost)}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground">
                      {pct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
