'use client';

import { Lightbulb, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';

interface RecentRecommendationsProps {
  services: { name: string; provider: string; cost: number; change: number }[];
  totalSpendMTD: number;
}

function deriveQuickRecommendations(
  services: { name: string; provider: string; cost: number; change: number }[],
  totalSpendMTD: number,
) {
  const recs: { id: string; title: string; savings: number; provider: string; severity: 'high' | 'medium' | 'low' }[] = [];

  // Rightsizing from compute services
  const compute = services.filter((s) => /ec2|compute|instance/i.test(s.name));
  if (compute.length > 0) {
    const computeCost = compute.reduce((s, c) => s + c.cost, 0);
    recs.push({
      id: 'rightsize',
      title: 'Rightsize EC2 instances based on utilization',
      savings: computeCost * 0.15,
      provider: 'AWS',
      severity: computeCost > totalSpendMTD * 0.3 ? 'high' : 'medium',
    });
  }

  // Reserved Instances
  const stableServices = services.filter((s) => Math.abs(s.change) < 20 && s.cost > 1);
  if (stableServices.length > 0) {
    const stableCost = stableServices.reduce((s, c) => s + c.cost, 0);
    recs.push({
      id: 'ri',
      title: 'Convert stable workloads to Reserved Instances',
      savings: stableCost * 0.25,
      provider: 'AWS',
      severity: 'high',
    });
  }

  // Storage optimization
  const storage = services.filter((s) => /s3|storage|ebs|backup/i.test(s.name));
  if (storage.length > 0) {
    const storageCost = storage.reduce((s, c) => s + c.cost, 0);
    recs.push({
      id: 'storage',
      title: 'Optimize S3 storage classes and lifecycle',
      savings: storageCost * 0.2,
      provider: 'AWS',
      severity: 'medium',
    });
  }

  // Spiking services
  const spiking = services.filter((s) => s.change > 25);
  if (spiking.length > 0) {
    const spikeCost = spiking.reduce((s, c) => s + c.cost, 0);
    recs.push({
      id: 'spike',
      title: `Investigate ${spiking.length} spiking service(s)`,
      savings: spikeCost * 0.3,
      provider: 'AWS',
      severity: 'high',
    });
  }

  return recs.sort((a, b) => b.savings - a.savings).slice(0, 4);
}

const severityStyles = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export function RecentRecommendations({ services, totalSpendMTD }: RecentRecommendationsProps) {
  const { format } = useCurrency();

  const recommendations = deriveQuickRecommendations(services, totalSpendMTD);
  const totalSavings = recommendations.reduce((sum, r) => sum + r.savings, 0);

  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Recommendations</h3>
            <p className="text-sm text-muted-foreground">No data yet</p>
          </div>
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Connect a cloud account to get optimization recommendations.</p>
      </div>
    );
  }

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
                <span className="text-xs text-muted-foreground">{rec.provider}</span>
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
