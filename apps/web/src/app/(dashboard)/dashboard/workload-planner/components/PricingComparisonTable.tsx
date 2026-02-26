'use client';

import { Trophy, TrendingDown, ArrowRight } from 'lucide-react';
import type { CrossCloudComparison, ProviderPricingResult } from '@/lib/cloud/pricing/types';

interface PricingComparisonTableProps {
  comparison: CrossCloudComparison;
}

function formatCost(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatHourly(value: number): string {
  return `$${value.toFixed(4)}/hr`;
}

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  AWS: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  AZURE: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  GCP: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  OCI: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
};

function ProviderBadge({ provider }: { provider: string }) {
  const colors = PROVIDER_COLORS[provider] || PROVIDER_COLORS.AWS;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}>
      {provider}
    </span>
  );
}

function SavingsIndicator({ result, cheapest }: { result: ProviderPricingResult; cheapest: ProviderPricingResult | null }) {
  if (!cheapest || result.provider === cheapest.provider) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Trophy className="h-3 w-3" /> Best Price
      </span>
    );
  }

  const pctMore = ((result.totalMonthly - cheapest.totalMonthly) / cheapest.totalMonthly) * 100;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <TrendingDown className="h-3 w-3" />
      {pctMore.toFixed(0)}% more
    </span>
  );
}

export function PricingComparisonTable({ comparison }: PricingComparisonTableProps) {
  const { results, cheapest, workload } = comparison;
  const sorted = [...results].sort((a, b) => a.totalMonthly - b.totalMonthly);

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      {cheapest && (
        <div className={`rounded-xl border-2 p-6 ${PROVIDER_COLORS[cheapest.provider]?.border} ${PROVIDER_COLORS[cheapest.provider]?.bg}`}>
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="text-lg font-bold">
                {cheapest.provider} is the most cost-effective at {formatCost(cheapest.totalMonthly)}/mo
              </p>
              <p className="text-sm text-muted-foreground">
                For workload &quot;{workload.name}&quot; in {cheapest.regionName}
              </p>
            </div>
          </div>

          {/* Savings vs others */}
          <div className="mt-4 flex flex-wrap gap-3">
            {sorted.slice(1).map((r) => {
              const savings = r.totalMonthly - cheapest.totalMonthly;
              return (
                <span key={r.provider} className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-medium">
                  Save {formatCost(savings)}/mo vs {r.provider}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((result) => (
          <div
            key={result.provider}
            className={`rounded-xl border-2 bg-card p-5 shadow-sm ${
              result.provider === cheapest?.provider ? 'border-green-400 dark:border-green-600' : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <ProviderBadge provider={result.provider} />
              <SavingsIndicator result={result} cheapest={cheapest} />
            </div>

            <p className="text-3xl font-bold">{formatCost(result.totalMonthly)}</p>
            <p className="text-xs text-muted-foreground">/month · {result.regionName}</p>

            <div className="mt-4 space-y-2 text-sm">
              {result.compute && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Compute</span>
                  <div className="text-right">
                    <p className="font-medium">{formatCost(result.compute.monthlyPrice)}</p>
                    <p className="text-xs text-muted-foreground">{result.compute.instanceType} · {formatHourly(result.compute.pricePerHour)}</p>
                  </div>
                </div>
              )}
              {result.storage && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Storage</span>
                  <p className="font-medium">{formatCost(result.storage.monthlyPrice)}</p>
                </div>
              )}
              {result.database && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Database</span>
                  <div className="text-right">
                    <p className="font-medium">{formatCost(result.database.totalMonthly)}</p>
                    <p className="text-xs text-muted-foreground">{result.database.instanceType}{result.database.multiAz ? ' (HA)' : ''}</p>
                  </div>
                </div>
              )}
              {result.networking && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <p className="font-medium">{formatCost(result.networking.totalMonthly)}</p>
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCost(result.totalMonthly)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  ~{formatCost(result.totalMonthly * 12)}/year
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Breakdown Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h3 className="font-semibold">Detailed Comparison</h3>
          <p className="text-sm text-muted-foreground">Side-by-side breakdown of all pricing components.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-t text-left">
                <th className="px-6 py-3 font-medium text-muted-foreground">Component</th>
                {sorted.map((r) => (
                  <th key={r.provider} className="px-6 py-3 text-right">
                    <ProviderBadge provider={r.provider} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workload.compute && (
                <>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium">Compute (Instance)</td>
                    {sorted.map((r) => (
                      <td key={r.provider} className="px-6 py-3 text-right font-mono text-xs">{r.compute?.instanceType ?? '-'}</td>
                    ))}
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="px-6 py-3 text-muted-foreground flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Hourly</td>
                    {sorted.map((r) => (
                      <td key={r.provider} className="px-6 py-3 text-right">{r.compute ? formatHourly(r.compute.pricePerHour) : '-'}</td>
                    ))}
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="px-6 py-3 text-muted-foreground flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Monthly</td>
                    {sorted.map((r) => (
                      <td key={r.provider} className="px-6 py-3 text-right font-medium">{r.compute ? formatCost(r.compute.monthlyPrice) : '-'}</td>
                    ))}
                  </tr>
                </>
              )}
              {workload.storage && (
                <tr className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-medium">Storage</td>
                  {sorted.map((r) => (
                    <td key={r.provider} className="px-6 py-3 text-right font-medium">{r.storage ? formatCost(r.storage.monthlyPrice) : '-'}</td>
                  ))}
                </tr>
              )}
              {workload.database && (
                <tr className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-medium">Database</td>
                  {sorted.map((r) => (
                    <td key={r.provider} className="px-6 py-3 text-right font-medium">{r.database ? formatCost(r.database.totalMonthly) : '-'}</td>
                  ))}
                </tr>
              )}
              {workload.networking && (
                <tr className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-medium">Networking</td>
                  {sorted.map((r) => (
                    <td key={r.provider} className="px-6 py-3 text-right font-medium">{r.networking ? formatCost(r.networking.totalMonthly) : '-'}</td>
                  ))}
                </tr>
              )}
              <tr className="bg-muted/50 font-semibold">
                <td className="px-6 py-3">Total Monthly</td>
                {sorted.map((r) => (
                  <td key={r.provider} className="px-6 py-3 text-right">{formatCost(r.totalMonthly)}</td>
                ))}
              </tr>
              <tr className="font-medium">
                <td className="px-6 py-3">Annual Estimate</td>
                {sorted.map((r) => (
                  <td key={r.provider} className="px-6 py-3 text-right">{formatCost(r.totalMonthly * 12)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
