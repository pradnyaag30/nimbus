'use client';

import { Lightbulb, ArrowUpRight, TrendingDown, Zap, HardDrive, Server, Workflow, Globe } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';

interface RecommendationsClientProps {
  topServices: { name: string; provider: string; cost: number; change: number }[];
  totalSpendMTD: number;
  forecastedSpend: number;
  accountId: string;
  error?: string;
}

// Derive smart recommendations from real service cost data
function deriveRecommendations(
  topServices: { name: string; provider: string; cost: number; change: number }[],
  totalSpendMTD: number,
) {
  const recommendations: {
    category: string;
    description: string;
    icon: typeof Lightbulb;
    savings: number;
    count: number;
    severity: 'high' | 'medium' | 'low';
    services: string[];
  }[] = [];

  // Find EC2/Compute services for rightsizing
  const computeServices = topServices.filter((s) =>
    /ec2|compute|instance/i.test(s.name),
  );
  if (computeServices.length > 0) {
    const computeCost = computeServices.reduce((s, c) => s + c.cost, 0);
    recommendations.push({
      category: 'Rightsizing',
      description: 'Analyze EC2 instance utilization and downsize over-provisioned instances',
      icon: Server,
      savings: computeCost * 0.15, // Industry avg: 15-30% savings from rightsizing
      count: computeServices.length,
      severity: computeCost > totalSpendMTD * 0.3 ? 'high' : 'medium',
      services: computeServices.map((s) => s.name),
    });

    // Reserved Instances if stable compute usage
    const stableCompute = computeServices.filter((s) => Math.abs(s.change) < 20);
    if (stableCompute.length > 0) {
      const stableCost = stableCompute.reduce((s, c) => s + c.cost, 0);
      recommendations.push({
        category: 'Reserved Instances / Savings Plans',
        description: 'Commit to 1-3 year terms for stable compute workloads to save up to 40%',
        icon: Zap,
        savings: stableCost * 0.3, // 30-40% savings from RIs
        count: stableCompute.length,
        severity: 'high',
        services: stableCompute.map((s) => s.name),
      });
    }
  }

  // Storage optimization
  const storageServices = topServices.filter((s) =>
    /s3|storage|ebs|efs|glacier|backup/i.test(s.name),
  );
  if (storageServices.length > 0) {
    const storageCost = storageServices.reduce((s, c) => s + c.cost, 0);
    recommendations.push({
      category: 'Storage Optimization',
      description: 'Move infrequently accessed data to S3 Intelligent-Tiering or Glacier',
      icon: HardDrive,
      savings: storageCost * 0.2,
      count: storageServices.length,
      severity: storageCost > totalSpendMTD * 0.15 ? 'high' : 'medium',
      services: storageServices.map((s) => s.name),
    });
  }

  // Network/data transfer optimization
  const networkServices = topServices.filter((s) =>
    /transfer|cloudfront|nat|vpc|route|elb|load/i.test(s.name),
  );
  if (networkServices.length > 0) {
    const networkCost = networkServices.reduce((s, c) => s + c.cost, 0);
    recommendations.push({
      category: 'Network Optimization',
      description: 'Optimize data transfer paths, use VPC endpoints, and review CloudFront caching',
      icon: Globe,
      savings: networkCost * 0.2,
      count: networkServices.length,
      severity: 'medium',
      services: networkServices.map((s) => s.name),
    });
  }

  // Spiking services — likely idle or misconfigured
  const spikingServices = topServices.filter((s) => s.change > 25);
  if (spikingServices.length > 0) {
    const spikeCost = spikingServices.reduce((s, c) => s + c.cost, 0);
    recommendations.push({
      category: 'Anomaly Review',
      description: 'Investigate services with >25% cost increase for potential waste or misconfig',
      icon: Workflow,
      savings: spikeCost * 0.3,
      count: spikingServices.length,
      severity: 'high',
      services: spikingServices.map((s) => s.name),
    });
  }

  // General: services with very small cost — potential cleanup
  const tinyServices = topServices.filter((s) => s.cost > 0 && s.cost < totalSpendMTD * 0.01);
  if (tinyServices.length > 3) {
    const tinyCost = tinyServices.reduce((s, c) => s + c.cost, 0);
    recommendations.push({
      category: 'Idle Resource Cleanup',
      description: 'Review low-cost services that may indicate unused or orphaned resources',
      icon: TrendingDown,
      savings: tinyCost * 0.5,
      count: tinyServices.length,
      severity: 'low',
      services: tinyServices.slice(0, 5).map((s) => s.name),
    });
  }

  return recommendations.sort((a, b) => b.savings - a.savings);
}

const severityStyles = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export function RecommendationsClient({
  topServices,
  totalSpendMTD,
  forecastedSpend,
  accountId,
  error,
}: RecommendationsClientProps) {
  const { format } = useCurrency();

  const recommendations = deriveRecommendations(topServices, totalSpendMTD);
  const totalSavings = recommendations.reduce((sum, r) => sum + r.savings, 0);
  const totalCount = recommendations.reduce((sum, r) => sum + r.count, 0);

  if (error || totalSpendMTD === 0) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered optimization recommendations across all cloud providers.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-12 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No cost data available for analysis.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect a cloud account to get optimization recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Cost optimization opportunities derived from AWS Account {accountId}
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Estimated Savings</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(totalSavings)}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Optimization Areas</p>
          <p className="mt-1 text-3xl font-bold">{recommendations.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Annualized Savings</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(totalSavings * 12)}
          </p>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div
              key={rec.category}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <Icon className="h-5 w-5 text-warning" />
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles[rec.severity]}`}>
                  {rec.severity}
                </span>
              </div>
              <h3 className="mt-3 font-semibold">{rec.category}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
              {rec.services.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Services: {rec.services.slice(0, 3).join(', ')}{rec.services.length > 3 ? ` +${rec.services.length - 3} more` : ''}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">{rec.count} resources</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {format(rec.savings)}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note about Compute Optimizer */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> These estimates are derived from your Cost Explorer data patterns.
          For precise rightsizing recommendations, AWS Compute Optimizer has been enabled on your account
          and will provide detailed analysis after collecting 14 days of utilization metrics.
        </p>
      </div>
    </div>
  );
}
