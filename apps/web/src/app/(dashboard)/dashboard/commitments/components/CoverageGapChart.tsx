'use client';

import type { CommitmentCoverage } from '@/lib/cloud/aws-costs';

interface CoverageGapChartProps {
  coverage: CommitmentCoverage;
  format: (value: number) => string;
}

export function CoverageGapChart({ coverage, format }: CoverageGapChartProps) {
  const totalSpend = coverage.totalOnDemandCost + coverage.totalCommittedCost;
  const committedPct = totalSpend > 0 ? (coverage.totalCommittedCost / totalSpend) * 100 : 0;
  const onDemandPct = totalSpend > 0 ? (coverage.totalOnDemandCost / totalSpend) * 100 : 0;

  const bars = [
    {
      label: 'Savings Plans Coverage',
      value: coverage.savingsPlansCoveragePercent,
      utilization: coverage.savingsPlansUtilizationPercent,
      color: 'bg-blue-500',
      utilColor: 'bg-blue-300',
    },
    {
      label: 'Reserved Instance Coverage',
      value: coverage.reservedInstanceCoveragePercent,
      utilization: coverage.reservedInstanceUtilizationPercent,
      color: 'bg-indigo-500',
      utilColor: 'bg-indigo-300',
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Coverage & Utilization</h3>

      {/* Spend Breakdown */}
      <div className="mb-6 rounded-lg bg-muted/50 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Month Spend Breakdown</span>
          <span className="font-medium">{format(totalSpend)} total</span>
        </div>
        <div className="mb-2 flex h-4 overflow-hidden rounded-full bg-gray-200">
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${committedPct}%` }}
            title={`Committed: ${format(coverage.totalCommittedCost)}`}
          />
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${onDemandPct}%` }}
            title={`On-Demand: ${format(coverage.totalOnDemandCost)}`}
          />
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Committed: {format(coverage.totalCommittedCost)} ({committedPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            On-Demand: {format(coverage.totalOnDemandCost)} ({onDemandPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Coverage Bars */}
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{bar.label}</span>
              <span className="font-medium">{bar.value.toFixed(1)}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`${bar.color} transition-all`}
                style={{ width: `${bar.value}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Utilization: {bar.utilization.toFixed(1)}%</span>
              <span>
                {bar.value >= 70 ? 'Good' : bar.value >= 40 ? 'Moderate' : bar.value > 0 ? 'Low' : 'None'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
