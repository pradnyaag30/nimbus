'use client';

import { DollarSign, AlertTriangle, TrendingDown, Layers } from 'lucide-react';

// Demo data for untagged cost impact. Production: pull from CUR/Cost Explorer.
const UNTAGGED_COST_DATA = {
  totalUntaggedCost: 12_480,
  totalMonthlyCost: 47_250,
  untaggedPercent: 26.4,
  byService: [
    { service: 'Amazon EC2', cost: 4_820, resourceCount: 23, percentOfUntagged: 38.6 },
    { service: 'Amazon RDS', cost: 2_950, resourceCount: 8, percentOfUntagged: 23.6 },
    { service: 'Amazon S3', cost: 1_890, resourceCount: 45, percentOfUntagged: 15.1 },
    { service: 'AWS Lambda', cost: 1_340, resourceCount: 12, percentOfUntagged: 10.7 },
    { service: 'Amazon ECS', cost: 890, resourceCount: 6, percentOfUntagged: 7.1 },
    { service: 'Other', cost: 590, resourceCount: 15, percentOfUntagged: 4.7 },
  ],
  missingTags: [
    { tagKey: 'CostCenter', untaggedCost: 8_420, untaggedResources: 67 },
    { tagKey: 'ProjectOwner', untaggedCost: 7_890, untaggedResources: 58 },
    { tagKey: 'Environment', untaggedCost: 3_210, untaggedResources: 21 },
    { tagKey: 'Team', untaggedCost: 5_640, untaggedResources: 42 },
    { tagKey: 'ProjectName', untaggedCost: 6_120, untaggedResources: 49 },
  ],
};

function formatCost(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function UntaggedCostImpact() {
  const data = UNTAGGED_COST_DATA;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Untagged Spend</p>
            <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/30">
              <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCost(data.totalUntaggedCost)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">per month</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">% of Total Spend</p>
            <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
              <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {data.untaggedPercent}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">unattributable</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Monthly</p>
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCost(data.totalMonthlyCost)}</p>
          <p className="mt-1 text-xs text-muted-foreground">all services</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Untagged Resources</p>
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/30">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {data.byService.reduce((s, r) => s + r.resourceCount, 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">across services</p>
        </div>
      </div>

      {/* Untagged Cost by Service */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h3 className="font-semibold">Untagged Cost by Service</h3>
          <p className="text-sm text-muted-foreground">
            Monthly unattributable spend broken down by AWS service.
          </p>
        </div>
        <div className="space-y-3 p-6 pt-2">
          {data.byService.map((svc) => (
            <div key={svc.service} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{svc.service}</span>
                  <span className="text-xs text-muted-foreground">{svc.resourceCount} resources</span>
                </div>
                <span className="font-medium text-red-600 dark:text-red-400">{formatCost(svc.cost)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400 transition-all dark:bg-red-500"
                  style={{ width: `${svc.percentOfUntagged}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Tag Impact */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h3 className="font-semibold">Missing Tag Impact</h3>
          <p className="text-sm text-muted-foreground">
            Cost impact of each missing required tag — resources without this tag cannot be attributed.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-t text-left">
                <th className="px-6 py-3 font-medium text-muted-foreground">Tag Key</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Untagged Cost</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Untagged Resources</th>
                <th className="px-6 py-3 font-medium text-muted-foreground min-w-[200px]">Cost Impact</th>
              </tr>
            </thead>
            <tbody>
              {data.missingTags
                .sort((a, b) => b.untaggedCost - a.untaggedCost)
                .map((tag) => {
                  const pctOfTotal = (tag.untaggedCost / data.totalMonthlyCost) * 100;
                  return (
                    <tr key={tag.tagKey} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs font-medium">{tag.tagKey}</span>
                      </td>
                      <td className="px-6 py-3 font-medium text-red-600 dark:text-red-400">
                        {formatCost(tag.untaggedCost)}
                      </td>
                      <td className="px-6 py-3">{tag.untaggedResources}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-400 dark:bg-red-500"
                              style={{ width: `${Math.max(pctOfTotal, 1)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">{pctOfTotal.toFixed(1)}%</span>
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
