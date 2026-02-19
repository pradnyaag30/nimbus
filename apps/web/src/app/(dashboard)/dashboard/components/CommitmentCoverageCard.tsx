'use client';

import { ShieldCheck, DollarSign, TrendingDown, BookmarkCheck } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';

interface CommitmentCoverage {
  savingsPlansCoveragePercent: number;
  savingsPlansUtilizationPercent: number;
  reservedInstanceCoveragePercent: number;
  reservedInstanceUtilizationPercent: number;
  totalOnDemandCost: number;
  totalCommittedCost: number;
  estimatedSavingsFromCommitments: number;
}

interface CommitmentCoverageCardProps {
  commitment: CommitmentCoverage;
}

function getCoverageColor(percent: number): string {
  if (percent >= 70) return 'text-green-600 dark:text-green-400';
  if (percent >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getCoverageBg(percent: number): string {
  if (percent >= 70) return 'bg-green-500';
  if (percent >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getCoverageLabel(spPercent: number, riPercent: number): string {
  const combined = Math.max(spPercent, riPercent);
  if (combined >= 70) return 'Good';
  if (combined >= 40) return 'Moderate';
  if (combined > 0) return 'Low';
  return 'None';
}

export function CommitmentCoverageCard({ commitment }: CommitmentCoverageCardProps) {
  const { format } = useCurrency();

  const combinedBest = Math.max(
    commitment.savingsPlansCoveragePercent,
    commitment.reservedInstanceCoveragePercent,
  );

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Commitment Coverage</h3>
          <p className="text-sm text-muted-foreground">
            Savings Plans & Reserved Instances
          </p>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
          combinedBest >= 70
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : combinedBest >= 40
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {getCoverageLabel(commitment.savingsPlansCoveragePercent, commitment.reservedInstanceCoveragePercent)}
        </span>
      </div>

      {/* SP Coverage progress bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Savings Plans Coverage</span>
          <span className={getCoverageColor(commitment.savingsPlansCoveragePercent)}>
            {commitment.savingsPlansCoveragePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${getCoverageBg(commitment.savingsPlansCoveragePercent)}`}
            style={{ width: `${Math.min(commitment.savingsPlansCoveragePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* RI Coverage progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Reserved Instance Coverage</span>
          <span className={getCoverageColor(commitment.reservedInstanceCoveragePercent)}>
            {commitment.reservedInstanceCoveragePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${getCoverageBg(commitment.reservedInstanceCoveragePercent)}`}
            style={{ width: `${Math.min(commitment.reservedInstanceCoveragePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Metric cards — 4 metrics */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border p-2.5 text-center">
          <ShieldCheck className={`mx-auto h-4 w-4 ${getCoverageColor(commitment.savingsPlansUtilizationPercent)}`} />
          <p className={`mt-1 text-sm font-bold ${getCoverageColor(commitment.savingsPlansUtilizationPercent)}`}>
            {commitment.totalCommittedCost > 0
              ? `${commitment.savingsPlansUtilizationPercent.toFixed(0)}%`
              : 'N/A'}
          </p>
          <p className="text-[10px] text-muted-foreground">SP Utilization</p>
        </div>
        <div className="rounded-lg border p-2.5 text-center">
          <BookmarkCheck className={`mx-auto h-4 w-4 ${getCoverageColor(commitment.reservedInstanceUtilizationPercent)}`} />
          <p className={`mt-1 text-sm font-bold ${getCoverageColor(commitment.reservedInstanceUtilizationPercent)}`}>
            {commitment.reservedInstanceUtilizationPercent > 0
              ? `${commitment.reservedInstanceUtilizationPercent.toFixed(0)}%`
              : 'N/A'}
          </p>
          <p className="text-[10px] text-muted-foreground">RI Utilization</p>
        </div>
        <div className="rounded-lg border p-2.5 text-center">
          <DollarSign className="mx-auto h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="mt-1 text-sm font-bold text-green-600 dark:text-green-400">
            {format(commitment.estimatedSavingsFromCommitments)}
          </p>
          <p className="text-[10px] text-muted-foreground">Est. Savings</p>
        </div>
        <div className="rounded-lg border p-2.5 text-center">
          <TrendingDown className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-1 text-sm font-bold">{format(commitment.totalCommittedCost)}</p>
          <p className="text-[10px] text-muted-foreground">Committed</p>
        </div>
      </div>

      {/* On-demand vs committed breakdown */}
      <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
        <span className="text-muted-foreground">
          On-Demand: <span className="font-medium text-foreground">{format(commitment.totalOnDemandCost)}</span>
        </span>
        <span className="text-muted-foreground">
          Committed: <span className="font-medium text-foreground">{format(commitment.totalCommittedCost)}</span>
        </span>
      </div>
    </div>
  );
}
