'use client';

import { BookmarkCheck, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import type { CommitmentPortfolio, ExpirationAlert } from '@/lib/cloud/commitments/types';
import type { CommitmentCoverage } from '@/lib/cloud/aws-costs';

interface PortfolioSummaryCardsProps {
  portfolio: CommitmentPortfolio;
  coverage: CommitmentCoverage;
  alerts: ExpirationAlert[];
  format: (value: number) => string;
}

export function PortfolioSummaryCards({
  portfolio,
  coverage,
  alerts,
  format,
}: PortfolioSummaryCardsProps) {
  const cards = [
    {
      title: 'Active Commitments',
      value: portfolio.summary.totalActive.toString(),
      subtitle: `${portfolio.items.filter((i) => i.commitmentType === 'SAVINGS_PLAN').length} SP, ${portfolio.items.filter((i) => i.commitmentType === 'RESERVED_INSTANCE').length} RI`,
      icon: BookmarkCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'SP Coverage',
      value: `${coverage.savingsPlansCoveragePercent.toFixed(1)}%`,
      subtitle: `Utilization: ${coverage.savingsPlansUtilizationPercent.toFixed(1)}%`,
      icon: TrendingUp,
      color: coverage.savingsPlansCoveragePercent >= 70 ? 'text-green-600' : 'text-amber-600',
      bgColor: coverage.savingsPlansCoveragePercent >= 70 ? 'bg-green-50' : 'bg-amber-50',
    },
    {
      title: 'Estimated Savings',
      value: format(coverage.estimatedSavingsFromCommitments),
      subtitle: `Committed: ${format(coverage.totalCommittedCost)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Expiring Soon',
      value: alerts.length.toString(),
      subtitle: alerts.length > 0
        ? `Next: ${alerts[0].daysRemaining} days`
        : 'No upcoming expirations',
      icon: AlertTriangle,
      color: alerts.length > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: alerts.length > 0 ? 'bg-red-50' : 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{card.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
