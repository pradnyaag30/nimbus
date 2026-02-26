'use client';

import { useState } from 'react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { PortfolioSummaryCards } from './components/PortfolioSummaryCards';
import { CommitmentTable } from './components/CommitmentTable';
import { ExpirationTimeline } from './components/ExpirationTimeline';
import { CoverageGapChart } from './components/CoverageGapChart';
import { TunableRecommendations } from './components/TunableRecommendations';
import type { CommitmentPortfolio, ExpirationAlert } from '@/lib/cloud/commitments/types';
import type { CommitmentCoverage, RIPurchaseRecommendation, SPPurchaseRecommendation } from '@/lib/cloud/aws-costs';

interface CommitmentsClientProps {
  portfolio: CommitmentPortfolio;
  coverage: CommitmentCoverage;
  alerts: ExpirationAlert[];
  riRecommendations: RIPurchaseRecommendation[];
  spRecommendations: SPPurchaseRecommendation[];
}

type Tab = 'overview' | 'recommendations';

export function CommitmentsClient({
  portfolio,
  coverage,
  alerts,
  riRecommendations,
  spRecommendations,
}: CommitmentsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { format } = useCurrency();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Portfolio Overview' },
    { id: 'recommendations', label: 'Purchase Recommendations' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commitment Portfolio</h1>
        <p className="text-muted-foreground">
          Manage Reserved Instances, Savings Plans, and Committed Use Discounts across all cloud providers.
        </p>
      </div>

      {/* Summary Cards */}
      <PortfolioSummaryCards
        portfolio={portfolio}
        coverage={coverage}
        alerts={alerts}
        format={format}
      />

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Expiration Alerts */}
          {alerts.length > 0 && (
            <ExpirationTimeline alerts={alerts} />
          )}

          {/* Coverage Gap */}
          <CoverageGapChart coverage={coverage} format={format} />

          {/* Full Commitment Table */}
          <CommitmentTable items={portfolio.items} format={format} />
        </div>
      )}

      {activeTab === 'recommendations' && (
        <TunableRecommendations
          riRecommendations={riRecommendations}
          spRecommendations={spRecommendations}
          format={format}
        />
      )}
    </div>
  );
}
