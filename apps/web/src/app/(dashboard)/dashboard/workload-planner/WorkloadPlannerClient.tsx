'use client';

import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import type { WorkloadDefinition, CrossCloudComparison } from '@/lib/cloud/pricing/types';
import { WorkloadForm } from './components/WorkloadForm';
import { PricingComparisonTable } from './components/PricingComparisonTable';

interface WorkloadPlannerClientProps {
  regions: { label: string; value: string }[];
}

export function WorkloadPlannerClient({ regions }: WorkloadPlannerClientProps) {
  const [comparison, setComparison] = useState<CrossCloudComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (workload: WorkloadDefinition) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pricing/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to compare pricing');
      }
      const data = await res.json();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare pricing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workload Planner</h1>
        <p className="text-sm text-muted-foreground">
          Define a workload and compare pricing across AWS, Azure, GCP, and OCI in seconds.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Multi-Cloud Cost Calculator
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            Configure compute, storage, database, and networking requirements below. The planner queries
            pricing across all four cloud providers and identifies the most cost-effective option.
            Pricing is based on on-demand rates — RI/SP discounts are evaluated separately in the Commitments page.
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Workload Form */}
      <WorkloadForm regions={regions} onSubmit={handleCompare} loading={loading} />

      {/* Results */}
      {comparison && (
        <>
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pricing Comparison Results
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Generated at {new Date(comparison.generatedAt).toLocaleString()} — On-demand pricing
            </p>
          </div>
          <PricingComparisonTable comparison={comparison} />
        </>
      )}

      {/* Empty State */}
      {!comparison && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-16 text-center shadow-sm">
          <Calculator className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Configure Your Workload</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Select compute, storage, database, and networking requirements above, then click
            &quot;Compare Across Clouds&quot; to see pricing from all four providers.
          </p>
        </div>
      )}
    </div>
  );
}
